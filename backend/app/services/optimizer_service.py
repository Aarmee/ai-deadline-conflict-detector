"""
Schedule Optimization Engine
──────────────────────────────
Ranks tasks by urgency score and assigns suggested start dates
across the user's available daily hours.

Urgency Score = (priority_weight * 0.40) + (1/days_remaining * 0.35) + (risk_probability * 0.25)
"""

from datetime import date, timedelta
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Task, TaskStatus, Prediction, ScheduleRecommendation, User


PRIORITY_WEIGHTS = {"LOW": 1.0, "MEDIUM": 2.0, "HIGH": 3.0, "CRITICAL": 4.0}


async def generate_schedule_recommendation(
    db: AsyncSession, user: User
) -> ScheduleRecommendation:
    """Generate an AI-powered schedule recommendation for the user."""

    # Load active tasks
    result = await db.execute(
        select(Task).where(
            Task.user_id == user.id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
        )
    )
    tasks = result.scalars().all()

    if not tasks:
        rec = ScheduleRecommendation(
            user_id=user.id,
            recommended_order=[],
            reason_summary="No active tasks found. Add tasks to get schedule recommendations.",
        )
        db.add(rec)
        await db.flush()
        await db.refresh(rec)
        return rec

    # Get latest predictions for each task
    task_risk = {}
    for task in tasks:
        pred_result = await db.execute(
            select(Prediction)
            .where(Prediction.task_id == task.id)
            .order_by(Prediction.predicted_at.desc())
            .limit(1)
        )
        pred = pred_result.scalar_one_or_none()
        task_risk[task.id] = {
            "risk_level": pred.risk_level if pred else "MEDIUM",
            "probability": pred.probability_score if pred else 0.5,
        }

    # Compute urgency scores
    today = date.today()
    scored_tasks = []
    for task in tasks:
        deadline = task.deadline if isinstance(task.deadline, date) else task.deadline.date()
        days_remaining = max((deadline - today).days, 1)
        priority_weight = PRIORITY_WEIGHTS.get(
            task.priority.value if hasattr(task.priority, 'value') else task.priority, 2.0
        )
        risk_prob = task_risk[task.id]["probability"]

        urgency = (
            (priority_weight / 4.0) * 0.40 +
            (1.0 / days_remaining) * 0.35 +
            risk_prob * 0.25
        )
        scored_tasks.append({
            "task": task,
            "urgency_score": round(urgency, 4),
            "risk_level": task_risk[task.id]["risk_level"],
            "days_remaining": days_remaining,
        })

    # Sort descending by urgency score
    scored_tasks.sort(key=lambda x: x["urgency_score"], reverse=True)

    # Assign suggested start dates (greedy day filling)
    ordered_items = []
    current_date = today
    hours_used_today = 0.0

    for item in scored_tasks:
        task = item["task"]
        effort = task.estimated_effort_hours
        remaining_effort = effort
        start_date = current_date

        while remaining_effort > 0:
            available_today = user.daily_hours_available - hours_used_today
            if available_today <= 0:
                current_date += timedelta(days=1)
                hours_used_today = 0
                available_today = user.daily_hours_available

            work_today = min(available_today, remaining_effort)
            hours_used_today += work_today
            remaining_effort -= work_today

            if remaining_effort > 0:
                current_date += timedelta(days=1)
                hours_used_today = 0

        ordered_items.append({
            "task_id": str(task.id),
            "title": task.title,
            "suggested_start_date": start_date.isoformat(),
            "urgency_score": item["urgency_score"],
            "risk_level": item["risk_level"],
        })

    # Build human-readable reason summary
    top_task = scored_tasks[0]["task"] if scored_tasks else None
    high_risk_count = sum(1 for t in scored_tasks if t["risk_level"] == "HIGH")
    reason = (
        f"Tasks sorted by urgency (priority × deadline proximity × risk). "
        f"{high_risk_count} HIGH risk task(s) prioritized to the top. "
        + (f"Start with '{top_task.title}' — highest urgency score." if top_task else "")
    )

    rec = ScheduleRecommendation(
        user_id=user.id,
        recommended_order=ordered_items,
        reason_summary=reason,
    )
    db.add(rec)
    await db.flush()
    await db.refresh(rec)
    return rec
