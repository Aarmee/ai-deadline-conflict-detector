"""
Background Scheduler
─────────────────────
Uses APScheduler to run nightly jobs:
  1. 09:00 PM — Nightly report email to all active users
  2. 08:00 AM — Deadline reminder for tasks due tomorrow

Both jobs query the DB directly using a fresh async session.
"""

import logging
from datetime import date, timedelta, datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.models import User, Task, TaskStatus, Conflict, Prediction, RiskLevel
from app.services.email_service import (
    send_nightly_report_email,
    send_deadline_reminder_email,
)

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone="UTC")


# ─── Job 1: Nightly Report (runs 9 PM UTC daily) ──────────
async def job_nightly_report() -> None:
    logger.info("Running nightly report job...")
    async with AsyncSessionLocal() as db:
        try:
            # Get all active users
            result = await db.execute(select(User).where(User.is_active == True))
            users = result.scalars().all()

            for user in users:
                try:
                    await _send_report_for_user(db, user)
                except Exception as e:
                    logger.error(f"Nightly report failed for {user.email}: {e}")
        except Exception as e:
            logger.error(f"Nightly report job error: {e}")


async def _send_report_for_user(db: AsyncSession, user: User) -> None:
    today = date.today()
    week_end = today + timedelta(days=7)

    # Active task count
    active_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.user_id == user.id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        )
    )
    total_active = active_result.scalar() or 0

    # HIGH risk count (latest prediction per task)
    high_risk_result = await db.execute(
        select(func.count(Prediction.id))
        .join(Task, Task.id == Prediction.task_id)
        .where(
            Task.user_id == user.id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            Prediction.risk_level == RiskLevel.HIGH,
        )
    )
    high_risk_count = high_risk_result.scalar() or 0

    # Unresolved conflicts
    conflict_result = await db.execute(
        select(func.count(Conflict.id)).where(
            Conflict.user_id == user.id,
            Conflict.resolved == False,
        )
    )
    conflicts_count = conflict_result.scalar() or 0

    # Tasks due this week
    due_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.user_id == user.id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            Task.deadline >= today,
            Task.deadline <= week_end,
        )
    )
    due_this_week = due_result.scalar() or 0

    # Workload score (total effort / available hours this week * 100)
    effort_result = await db.execute(
        select(func.sum(Task.estimated_effort_hours)).where(
            Task.user_id == user.id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        )
    )
    total_effort = effort_result.scalar() or 0.0
    available = user.daily_hours_available * 7
    workload_score = min((total_effort / available * 100) if available > 0 else 0, 100)

    await send_nightly_report_email(
        to=user.email,
        full_name=user.full_name,
        total_active=total_active,
        high_risk_count=high_risk_count,
        conflicts_count=conflicts_count,
        due_this_week=due_this_week,
        workload_score=workload_score,
    )


# ─── Job 2: Deadline Reminder (runs 8 AM UTC daily) ───────
async def job_deadline_reminder() -> None:
    logger.info("Running deadline reminder job...")
    async with AsyncSessionLocal() as db:
        try:
            tomorrow = date.today() + timedelta(days=1)

            # Get all tasks due tomorrow with their users
            result = await db.execute(
                select(Task, User)
                .join(User, User.id == Task.user_id)
                .where(
                    Task.deadline == tomorrow,
                    Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
                    User.is_active == True,
                )
            )
            rows = result.all()

            # Group by user
            user_tasks: dict = {}
            for task, user in rows:
                if user.id not in user_tasks:
                    user_tasks[user.id] = {"user": user, "tasks": []}

                # Get latest prediction for this task
                pred_result = await db.execute(
                    select(Prediction)
                    .where(Prediction.task_id == task.id)
                    .order_by(Prediction.predicted_at.desc())
                    .limit(1)
                )
                pred = pred_result.scalar_one_or_none()

                user_tasks[user.id]["tasks"].append({
                    "title": task.title,
                    "estimated_effort_hours": task.estimated_effort_hours,
                    "priority": task.priority.value if hasattr(task.priority, "value") else task.priority,
                    "risk_level": pred.risk_level.value if pred and hasattr(pred.risk_level, "value") else "MEDIUM",
                })

            # Send reminder to each user
            for uid, data in user_tasks.items():
                try:
                    await send_deadline_reminder_email(
                        to=data["user"].email,
                        full_name=data["user"].full_name,
                        tasks_due_tomorrow=data["tasks"],
                    )
                except Exception as e:
                    logger.error(f"Reminder failed for {data['user'].email}: {e}")

        except Exception as e:
            logger.error(f"Deadline reminder job error: {e}")


# ─── Register jobs ────────────────────────────────────────
def start_scheduler() -> None:
    # Nightly report — 9 PM UTC every day
    scheduler.add_job(
        job_nightly_report,
        CronTrigger(hour=21, minute=0),
        id="nightly_report",
        replace_existing=True,
    )
    # Deadline reminder — 8 AM UTC every day
    scheduler.add_job(
        job_deadline_reminder,
        CronTrigger(hour=8, minute=0),
        id="deadline_reminder",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started: nightly_report @ 21:00 UTC, deadline_reminder @ 08:00 UTC")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
