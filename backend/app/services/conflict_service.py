"""
Conflict Detection Engine
──────────────────────────
Detects 3 types of conflicts:
1. DEADLINE_OVERLAP   – Multiple high-effort tasks share the same deadline
2. WORKLOAD_OVERLOAD  – Total effort exceeds capacity within any 7-day window
3. DEPENDENCY_BLOCK   – Subtask deadline is later than parent task deadline
"""

from datetime import date, timedelta
from collections import defaultdict
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio

from app.models.models import Task, Conflict, ConflictType, ConflictSeverity, TaskStatus, User, Notification, NotificationType
from app.services.email_service import send_conflict_alert_email


async def run_conflict_detection(db: AsyncSession, user: User) -> List[Conflict]:
    """Run all conflict detection checks and persist new conflicts."""
    # Load all active tasks for user
    result = await db.execute(
        select(Task).where(
            Task.user_id == user.id,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
        )
    )
    tasks = result.scalars().all()

    if len(tasks) < 2:
        return []

    # Clear old unresolved conflicts for this user before re-running
    old_result = await db.execute(
        select(Conflict).where(
            Conflict.user_id == user.id,
            Conflict.resolved == False
        )
    )
    for old in old_result.scalars().all():
        await db.delete(old)
    await db.flush()

    new_conflicts = []

    # ── Check 1: Deadline Overlap ──────────────────────────
    deadline_groups: Dict[date, List[Task]] = defaultdict(list)
    for task in tasks:
        dl = task.deadline if isinstance(task.deadline, date) else task.deadline.date()
        deadline_groups[dl].append(task)

    for deadline, group in deadline_groups.items():
        if len(group) < 2:
            continue
        total_effort = sum(t.estimated_effort_hours for t in group)
        days_remaining = max((deadline - date.today()).days, 1)
        available_hours = user.daily_hours_available * days_remaining

        # Conflict if total effort exceeds 60% of available time (realistic threshold)
        if total_effort > available_hours * 0.60:
            severity = ConflictSeverity.CRITICAL if total_effort > available_hours else ConflictSeverity.WARNING
            conflict = Conflict(
                user_id=user.id,
                task_ids=[str(t.id) for t in group],
                conflict_type=ConflictType.DEADLINE_OVERLAP,
                severity=severity,
                description=(
                    f"{len(group)} tasks due on {deadline.strftime('%b %d, %Y')} require "
                    f"{total_effort:.1f}h but only {available_hours:.1f}h available "
                    f"({days_remaining} day(s) remaining)."
                ),
            )
            db.add(conflict)
            new_conflicts.append(conflict)

    # ── Check 2: Workload Overload (sliding 7-day windows) ─
    today = date.today()
    window_conflicts_found = set()  # avoid duplicate window conflicts

    for window_start_offset in range(0, 28, 7):
        window_start = today + timedelta(days=window_start_offset)
        window_end = window_start + timedelta(days=7)

        window_tasks = [
            t for t in tasks
            if window_start <= (t.deadline if isinstance(t.deadline, date) else t.deadline.date()) < window_end
        ]
        if not window_tasks:
            continue

        total_effort = sum(t.estimated_effort_hours for t in window_tasks)
        available = user.daily_hours_available * 7

        if total_effort > available:
            window_key = window_start.isoformat()
            if window_key not in window_conflicts_found:
                window_conflicts_found.add(window_key)
                overflow_pct = ((total_effort - available) / available) * 100
                conflict = Conflict(
                    user_id=user.id,
                    task_ids=[str(t.id) for t in window_tasks],
                    conflict_type=ConflictType.WORKLOAD_OVERLOAD,
                    severity=ConflictSeverity.CRITICAL if overflow_pct > 50 else ConflictSeverity.WARNING,
                    description=(
                        f"Week of {window_start.strftime('%b %d')}: {total_effort:.1f}h of work scheduled "
                        f"but only {available:.1f}h capacity ({overflow_pct:.0f}% overloaded)."
                    ),
                )
                db.add(conflict)
                new_conflicts.append(conflict)

    # ── Check 3: Dependency Block (subtask after parent) ───
    task_map = {t.id: t for t in tasks}
    for task in tasks:
        if task.parent_task_id and task.parent_task_id in task_map:
            parent = task_map[task.parent_task_id]
            child_dl = task.deadline if isinstance(task.deadline, date) else task.deadline.date()
            parent_dl = parent.deadline if isinstance(parent.deadline, date) else parent.deadline.date()
            if child_dl > parent_dl:
                conflict = Conflict(
                    user_id=user.id,
                    task_ids=[str(parent.id), str(task.id)],
                    conflict_type=ConflictType.DEPENDENCY_BLOCK,
                    severity=ConflictSeverity.WARNING,
                    description=(
                        f"Subtask '{task.title}' (due {child_dl}) has a later deadline "
                        f"than its parent '{parent.title}' (due {parent_dl})."
                    ),
                )
                db.add(conflict)
                new_conflicts.append(conflict)

    # ── Create Notifications for new conflicts ─────────────
    if new_conflicts:
        critical_count = sum(1 for c in new_conflicts if c.severity == ConflictSeverity.CRITICAL)
        notif = Notification(
            user_id=user.id,
            type=NotificationType.CONFLICT_DETECTED,
            message=(
                f"{len(new_conflicts)} schedule conflict(s) detected"
                + (f" ({critical_count} critical)" if critical_count else "")
                + ". Open the dashboard to review."
            ),
        )
        db.add(notif)

    await db.flush()

    # Fire conflict alert email async (non-blocking)
    if new_conflicts:
        critical_count = sum(1 for c in new_conflicts if c.severity == ConflictSeverity.CRITICAL)
        asyncio.create_task(send_conflict_alert_email(
            to=user.email,
            full_name=user.full_name,
            conflict_count=len(new_conflicts),
            critical_count=critical_count,
        ))

    return new_conflicts