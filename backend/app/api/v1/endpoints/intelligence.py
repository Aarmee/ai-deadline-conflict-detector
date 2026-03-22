from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from uuid import UUID
from datetime import date, timedelta
from typing import List, Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.models import (
    User, Task, Prediction, Conflict, ScheduleRecommendation,
    Notification, TaskStatus
)
from app.schemas.tasks import (
    PredictionResponse, ConflictResponse, RecommendationResponse,
    NotificationResponse, MarkAllReadResponse,
    DashboardResponse, ProductivityResponse, RiskSummary,
    WorkloadChartResponse, DailyWorkload,
)
from app.services.conflict_service import run_conflict_detection
from app.services.optimizer_service import generate_schedule_recommendation
from app.services.task_service import TaskService


# ═══════════════════════════════════════════════════════════
#  PREDICTIONS
# ═══════════════════════════════════════════════════════════
predictions_router = APIRouter(prefix="/predictions", tags=["Predictions & Dashboard"])


@predictions_router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="Get full dashboard summary"
)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns everything the frontend dashboard needs in one call:
    - Total active tasks
    - Risk breakdown (how many LOW / MEDIUM / HIGH)
    - Workload score (% of weekly capacity used)
    - Active unresolved conflict count
    - Tasks due within 7 days
    - Unread notification count
    """
    active_tasks = await TaskService.get_active_tasks_for_user(db, current_user.id)

    # Count risk levels across all active tasks using latest prediction
    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    for task in active_tasks:
        pred_result = await db.execute(
            select(Prediction)
            .where(Prediction.task_id == task.id)
            .order_by(Prediction.predicted_at.desc())
            .limit(1)
        )
        pred = pred_result.scalar_one_or_none()
        if pred:
            risk_counts[pred.risk_level] += 1

    total_effort = sum(t.estimated_effort_hours for t in active_tasks)
    weekly_capacity = current_user.daily_hours_available * 7
    workload_score = min(round((total_effort / max(weekly_capacity, 1)) * 100, 1), 100)

    conflict_count = await db.execute(
        select(func.count(Conflict.id)).where(
            Conflict.user_id == current_user.id,
            Conflict.resolved == False
        )
    )
    active_conflicts = conflict_count.scalar() or 0

    today = date.today()
    week_end = today + timedelta(days=7)
    tasks_this_week = sum(
        1 for t in active_tasks
        if today <= (t.deadline if isinstance(t.deadline, date) else t.deadline.date()) <= week_end
    )

    notif_count = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )
    unread = notif_count.scalar() or 0

    return DashboardResponse(
        total_active_tasks=len(active_tasks),
        risk_summary=RiskSummary(**risk_counts),
        workload_score=workload_score,
        active_conflicts=active_conflicts,
        tasks_due_this_week=tasks_this_week,
        unread_notifications=unread,
    )


@predictions_router.get(
    "/task/{task_id}",
    response_model=List[PredictionResponse],
    summary="Get full prediction history for a task"
)
async def get_task_predictions(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all prediction records for a task, newest first.
    Useful for showing how risk changed over time as the user edited the task.
    """
    task = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    if not task.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Task not found")

    result = await db.execute(
        select(Prediction)
        .where(Prediction.task_id == task_id)
        .order_by(Prediction.predicted_at.desc())
    )
    return result.scalars().all()


# ═══════════════════════════════════════════════════════════
#  CONFLICTS
# ═══════════════════════════════════════════════════════════
conflicts_router = APIRouter(prefix="/conflicts", tags=["Conflict Detection"])


@conflicts_router.get(
    "",
    response_model=List[ConflictResponse],
    summary="List all active conflicts"
)
async def list_conflicts(
    include_resolved: bool = Query(default=False, description="Include resolved conflicts too"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all unresolved schedule conflicts for the user.
    Set include_resolved=true to see historical resolved conflicts as well.
    """
    query = select(Conflict).where(Conflict.user_id == current_user.id)
    if not include_resolved:
        query = query.where(Conflict.resolved == False)
    query = query.order_by(Conflict.detected_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@conflicts_router.post(
    "/detect",
    response_model=List[ConflictResponse],
    summary="Manually trigger conflict detection"
)
async def detect_conflicts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually re-runs all 3 conflict detection algorithms:
    1. DEADLINE_OVERLAP — multiple tasks due same day exceed daily capacity
    2. WORKLOAD_OVERLOAD — any 7-day window exceeds capacity
    3. DEPENDENCY_BLOCK — subtask deadline after parent deadline
    Clears old unresolved conflicts and replaces with fresh results.
    """
    conflicts = await run_conflict_detection(db, current_user)
    return conflicts


@conflicts_router.post(
    "/{conflict_id}/resolve",
    response_model=ConflictResponse,
    summary="Mark conflict as resolved"
)
async def resolve_conflict(
    conflict_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks a specific conflict as resolved. It will no longer show in active conflicts.
    Conflict is not deleted — kept in DB for audit purposes.
    """
    result = await db.execute(
        select(Conflict).where(Conflict.id == conflict_id, Conflict.user_id == current_user.id)
    )
    conflict = result.scalar_one_or_none()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
    conflict.resolved = True
    await db.flush()
    return conflict


# ═══════════════════════════════════════════════════════════
#  SCHEDULE RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════
recommendations_router = APIRouter(prefix="/recommendations", tags=["Schedule Optimizer"])


@recommendations_router.get(
    "/schedule",
    response_model=RecommendationResponse,
    summary="Generate AI schedule recommendation"
)
async def get_schedule_recommendation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Runs the schedule optimization engine. Tasks are scored by:
      urgency = (priority_weight × 0.40) + (1/days_remaining × 0.35) + (risk_probability × 0.25)
    Then greedily assigned to daily time slots based on daily_hours_available.
    Returns suggested start dates for each task + human-readable reasoning.
    """
    rec = await generate_schedule_recommendation(db, current_user)
    return rec


@recommendations_router.post(
    "/{rec_id}/accept",
    response_model=RecommendationResponse,
    summary="Accept a recommendation"
)
async def accept_recommendation(
    rec_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marks a recommendation as accepted (accepted=true). Frontend uses this to apply the schedule."""
    result = await db.execute(
        select(ScheduleRecommendation).where(
            ScheduleRecommendation.id == rec_id,
            ScheduleRecommendation.user_id == current_user.id
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.accepted = True
    await db.flush()
    return rec


@recommendations_router.post(
    "/{rec_id}/reject",
    response_model=RecommendationResponse,
    summary="Reject a recommendation"
)
async def reject_recommendation(
    rec_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marks a recommendation as rejected (accepted=false)."""
    result = await db.execute(
        select(ScheduleRecommendation).where(
            ScheduleRecommendation.id == rec_id,
            ScheduleRecommendation.user_id == current_user.id
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.accepted = False
    await db.flush()
    return rec


@recommendations_router.get(
    "/history",
    response_model=List[RecommendationResponse],
    summary="Get past recommendations"
)
async def get_recommendation_history(
    limit: int = Query(default=10, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the last N schedule recommendations generated for this user."""
    result = await db.execute(
        select(ScheduleRecommendation)
        .where(ScheduleRecommendation.user_id == current_user.id)
        .order_by(ScheduleRecommendation.generated_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


# ═══════════════════════════════════════════════════════════
#  NOTIFICATIONS
# ═══════════════════════════════════════════════════════════
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])


@notifications_router.get(
    "",
    response_model=List[NotificationResponse],
    summary="List notifications"
)
async def list_notifications(
    unread_only: bool = Query(default=False, description="Return only unread notifications"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns user notifications sorted by newest first.
    Notification types: RISK_ALERT, CONFLICT_DETECTED, DEADLINE_REMINDER, SYSTEM.
    """
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@notifications_router.patch(
    "/{notif_id}/read",
    response_model=NotificationResponse,
    summary="Mark notification as read"
)
async def mark_notification_read(
    notif_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marks a single notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id,
            Notification.user_id == current_user.id
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.flush()
    return notif


@notifications_router.post(
    "/read-all",
    response_model=MarkAllReadResponse,
    summary="Mark all notifications as read"
)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks ALL unread notifications as read in one call.
    Frontend uses this for the 'Mark all as read' button.
    Returns how many were marked.
    """
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )
    count = result.scalar() or 0

    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.flush()
    return MarkAllReadResponse(marked_read=count)


@notifications_router.delete(
    "/{notif_id}",
    status_code=204,
    summary="Delete a notification"
)
async def delete_notification(
    notif_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently deletes a notification."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id,
            Notification.user_id == current_user.id
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.delete(notif)
    await db.flush()


# ═══════════════════════════════════════════════════════════
#  ANALYTICS
# ═══════════════════════════════════════════════════════════
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])


@analytics_router.get(
    "/productivity",
    response_model=ProductivityResponse,
    summary="Get productivity stats"
)
async def get_productivity(
    period: str = Query(default="all", description="weekly | monthly | all"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns completion_rate, total completed, total missed, total pending tasks.
    Used by the frontend analytics charts to show trends.
    """
    query = select(
        func.count(Task.id).filter(Task.status == TaskStatus.COMPLETED).label("completed"),
        func.count(Task.id).filter(Task.status == TaskStatus.MISSED).label("missed"),
        func.count(Task.id).filter(Task.status == TaskStatus.PENDING).label("pending"),
        func.count(Task.id).filter(Task.status == TaskStatus.IN_PROGRESS).label("in_progress"),
    ).where(Task.user_id == current_user.id)

    if period == "weekly":
        since = date.today() - timedelta(days=7)
        query = query.where(Task.created_at >= since)
    elif period == "monthly":
        since = date.today() - timedelta(days=30)
        query = query.where(Task.created_at >= since)

    result = await db.execute(query)
    row = result.one()
    completed = row.completed or 0
    missed = row.missed or 0
    total = completed + missed
    rate = round(completed / total, 4) if total > 0 else 0.0

    return ProductivityResponse(
        completion_rate=rate,
        total_completed=completed,
        total_missed=missed,
        total_pending=(row.pending or 0) + (row.in_progress or 0),
        period=period,
    )


@analytics_router.get(
    "/workload",
    response_model=WorkloadChartResponse,
    summary="Get workload distribution over time"
)
async def get_workload_chart(
    days: int = Query(default=14, ge=7, le=60, description="Number of days to look ahead"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns day-by-day effort distribution for the next N days.
    Each day shows: total effort hours due, task count, capacity, and whether overloaded.
    Used by the frontend to render the workload heatmap / bar chart.
    """
    active_tasks = await TaskService.get_active_tasks_for_user(db, current_user.id)
    today = date.today()
    capacity_per_day = current_user.daily_hours_available

    # Group tasks by their deadline date
    day_map: dict[date, list[Task]] = {}
    for task in active_tasks:
        dl = task.deadline if isinstance(task.deadline, date) else task.deadline.date()
        if dl not in day_map:
            day_map[dl] = []
        day_map[dl].append(task)

    daily_breakdown = []
    total_effort = 0.0
    total_capacity = 0.0
    overload_days = 0

    for offset in range(days):
        day = today + timedelta(days=offset)
        tasks_on_day = day_map.get(day, [])
        effort = sum(t.estimated_effort_hours for t in tasks_on_day)
        overloaded = effort > capacity_per_day
        if overloaded:
            overload_days += 1
        total_effort += effort
        total_capacity += capacity_per_day
        daily_breakdown.append(DailyWorkload(
            date=day.isoformat(),
            effort_hours=round(effort, 1),
            task_count=len(tasks_on_day),
            capacity_hours=capacity_per_day,
            overloaded=overloaded,
        ))

    return WorkloadChartResponse(
        days=daily_breakdown,
        total_effort=round(total_effort, 1),
        total_capacity=round(total_capacity, 1),
        overload_days=overload_days,
    )


@analytics_router.get(
    "/summary",
    summary="Get overall account summary"
)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Single endpoint the frontend can call for the profile/summary page.
    Returns task counts per status, completion rate, and user profile.
    """
    result = await db.execute(
        select(
            func.count(Task.id).filter(Task.status == TaskStatus.PENDING).label("pending"),
            func.count(Task.id).filter(Task.status == TaskStatus.IN_PROGRESS).label("in_progress"),
            func.count(Task.id).filter(Task.status == TaskStatus.COMPLETED).label("completed"),
            func.count(Task.id).filter(Task.status == TaskStatus.MISSED).label("missed"),
        ).where(Task.user_id == current_user.id)
    )
    row = result.one()

    return {
        "user": {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email,
            "daily_hours_available": current_user.daily_hours_available,
            "completion_rate": current_user.completion_rate,
        },
        "task_counts": {
            "pending": row.pending or 0,
            "in_progress": row.in_progress or 0,
            "completed": row.completed or 0,
            "missed": row.missed or 0,
            "total": (row.pending or 0) + (row.in_progress or 0) + (row.completed or 0) + (row.missed or 0),
        },
    }