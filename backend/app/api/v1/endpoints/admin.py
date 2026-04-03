"""
Admin API Endpoints
────────────────────
All routes require a JWT with role: admin claim.
Admin credentials are stored in .env — no DB table needed.

Routes:
  POST /admin/login              — authenticate with admin credentials
  GET  /admin/stats              — system-wide overview (counts only)
  GET  /admin/users              — all users (no task content)
  POST /admin/users/{id}/toggle  — activate / deactivate a user
  GET  /admin/ml/stats           — prediction stats + model info
  GET  /admin/conflicts/stats    — conflict counts by type
  GET  /admin/activity           — recent registrations + HIGH risk spikes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from datetime import datetime, timezone, timedelta

from app.db.session import get_db
from app.core.config import settings
from app.core.security import (
    verify_password, hash_password,
    create_access_token, get_current_admin,
)
from app.models.models import (
    User, Task, Prediction, Conflict, TaskStatus,
    RiskLevel, ConflictType, ConflictSeverity,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ─── POST /admin/login ────────────────────────────────────
@router.post("/login")
async def admin_login(data: dict):
    """
    Verify admin credentials from .env.
    Returns JWT with role: admin claim.
    """
    email    = data.get("email", "")
    password = data.get("password", "")

    if email != settings.ADMIN_EMAIL:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    # Compare password — support both plain and hashed in .env
    admin_pw = settings.ADMIN_PASSWORD
    # Try direct string match first (plain text in .env)
    if password != admin_pw:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = create_access_token({
        "sub": "admin",
        "role": "admin",
        "email": settings.ADMIN_EMAIL,
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "admin",
    }


# ─── GET /admin/stats ─────────────────────────────────────
@router.get("/stats")
async def system_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    """System-wide counts — no private task content exposed."""

    # User counts
    user_result = await db.execute(
        select(
            func.count(User.id).label("total"),
            func.sum(case((User.is_active == True, 1), else_=0)).label("active"),
            func.sum(case((User.is_active == False, 1), else_=0)).label("inactive"),
        )
    )
    user_row = user_result.one()

    # Task counts by status
    task_result = await db.execute(
        select(Task.status, func.count(Task.id).label("cnt"))
        .group_by(Task.status)
    )
    task_rows = task_result.all()
    task_by_status = {row.status.value: row.cnt for row in task_rows}

    # Total predictions
    pred_count = await db.execute(select(func.count(Prediction.id)))
    total_predictions = pred_count.scalar()

    # Total conflicts
    conflict_count = await db.execute(select(func.count(Conflict.id)))
    total_conflicts = conflict_count.scalar()

    # Unresolved conflicts
    unresolved = await db.execute(
        select(func.count(Conflict.id)).where(Conflict.resolved == False)
    )
    unresolved_conflicts = unresolved.scalar()

    return {
        "users": {
            "total": user_row.total or 0,
            "active": int(user_row.active or 0),
            "inactive": int(user_row.inactive or 0),
        },
        "tasks": {
            "total": sum(task_by_status.values()),
            "by_status": {
                "PENDING":     task_by_status.get("PENDING", 0),
                "IN_PROGRESS": task_by_status.get("IN_PROGRESS", 0),
                "COMPLETED":   task_by_status.get("COMPLETED", 0),
                "MISSED":      task_by_status.get("MISSED", 0),
            },
        },
        "predictions": {
            "total": total_predictions or 0,
        },
        "conflicts": {
            "total": total_conflicts or 0,
            "unresolved": unresolved_conflicts or 0,
        },
    }


# ─── GET /admin/users ─────────────────────────────────────
@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    """
    All users with: name, email, join date, status,
    daily_hours, completion_rate, task count.
    No task content exposed.
    """
    result = await db.execute(
        select(
            User.id,
            User.full_name,
            User.email,
            User.is_active,
            User.daily_hours_available,
            User.completion_rate,
            User.created_at,
            func.count(Task.id).label("task_count"),
        )
        .outerjoin(Task, Task.user_id == User.id)
        .group_by(User.id)
        .order_by(User.created_at.desc())
    )
    rows = result.all()

    return [
        {
            "id": str(row.id),
            "full_name": row.full_name,
            "email": row.email,
            "is_active": row.is_active,
            "daily_hours_available": row.daily_hours_available,
            "completion_rate": round(float(row.completion_rate), 2),
            "task_count": row.task_count,
            "joined_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


# ─── POST /admin/users/{user_id}/toggle ───────────────────
@router.post("/users/{user_id}/toggle")
async def toggle_user_status(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    """Soft ban / unban a user by toggling is_active."""
    from uuid import UUID
    try:
        uid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    await db.flush()
    return {
        "id": str(user.id),
        "is_active": user.is_active,
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
    }


# ─── GET /admin/ml/stats ──────────────────────────────────
@router.get("/ml/stats")
async def ml_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    """Prediction stats + model info. No task content exposed."""

    # Risk level breakdown
    risk_result = await db.execute(
        select(Prediction.risk_level, func.count(Prediction.id).label("cnt"))
        .group_by(Prediction.risk_level)
    )
    risk_rows = risk_result.all()
    risk_breakdown = {row.risk_level.value: row.cnt for row in risk_rows}

    # Average probability score
    avg_result = await db.execute(
        select(func.avg(Prediction.probability_score))
    )
    avg_prob = avg_result.scalar() or 0.0

    # Total predictions
    total_result = await db.execute(select(func.count(Prediction.id)))
    total = total_result.scalar() or 0

    # HIGH risk count in active tasks (count only, no content)
    high_risk_result = await db.execute(
        select(func.count(Prediction.id))
        .join(Task, Task.id == Prediction.task_id)
        .where(
            Prediction.risk_level == RiskLevel.HIGH,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        )
    )
    active_high_risk = high_risk_result.scalar() or 0

    return {
        "model_version": settings.ML_MODEL_VERSION,
        "model_path": settings.ML_MODEL_PATH,
        "total_predictions": total,
        "risk_breakdown": {
            "HIGH": risk_breakdown.get("HIGH", 0),
            "LOW":  risk_breakdown.get("LOW", 0),
        },
        "avg_probability_score": round(float(avg_prob), 4),
        "active_high_risk_tasks": active_high_risk,
        "high_risk_percentage": round(
            (risk_breakdown.get("HIGH", 0) / total * 100) if total > 0 else 0, 1
        ),
    }


# ─── GET /admin/conflicts/stats ───────────────────────────
@router.get("/conflicts/stats")
async def conflict_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    """Conflict counts by type and severity. No conflict descriptions exposed."""

    # By type
    type_result = await db.execute(
        select(Conflict.conflict_type, func.count(Conflict.id).label("cnt"))
        .group_by(Conflict.conflict_type)
    )
    by_type = {row.conflict_type.value: row.cnt for row in type_result.all()}

    # By severity
    sev_result = await db.execute(
        select(Conflict.severity, func.count(Conflict.id).label("cnt"))
        .group_by(Conflict.severity)
    )
    by_severity = {row.severity.value: row.cnt for row in sev_result.all()}

    # Users with most unresolved conflicts (user id + count only)
    user_conflict_result = await db.execute(
        select(
            User.full_name,
            func.count(Conflict.id).label("conflict_count"),
        )
        .join(Conflict, Conflict.user_id == User.id)
        .where(Conflict.resolved == False)
        .group_by(User.id, User.full_name)
        .order_by(func.count(Conflict.id).desc())
        .limit(5)
    )
    top_users = [
        {"name": row.full_name, "conflict_count": row.conflict_count}
        for row in user_conflict_result.all()
    ]

    # Unresolved total
    unresolved_result = await db.execute(
        select(func.count(Conflict.id)).where(Conflict.resolved == False)
    )
    unresolved = unresolved_result.scalar() or 0

    return {
        "total_unresolved": unresolved,
        "by_type": {
            "DEADLINE_OVERLAP":  by_type.get("DEADLINE_OVERLAP", 0),
            "WORKLOAD_OVERLOAD": by_type.get("WORKLOAD_OVERLOAD", 0),
            "DEPENDENCY_BLOCK":  by_type.get("DEPENDENCY_BLOCK", 0),
        },
        "by_severity": {
            "CRITICAL": by_severity.get("CRITICAL", 0),
            "WARNING":  by_severity.get("WARNING", 0),
        },
        "top_affected_users": top_users,
    }


# ─── GET /admin/activity ──────────────────────────────────
@router.get("/activity")
async def recent_activity(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_admin),
):
    """Recent registrations and HIGH risk prediction counts. No private content."""

    # Recent registrations (last 7 days)
    since = datetime.now(timezone.utc) - timedelta(days=7)
    reg_result = await db.execute(
        select(User.full_name, User.email, User.created_at)
        .where(User.created_at >= since)
        .order_by(User.created_at.desc())
        .limit(10)
    )
    recent_registrations = [
        {
            "full_name": row.full_name,
            "email": row.email,
            "joined_at": row.created_at.isoformat(),
        }
        for row in reg_result.all()
    ]

    # Recent HIGH risk predictions (last 24h — count per hour, no task content)
    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    high_risk_recent = await db.execute(
        select(func.count(Prediction.id))
        .where(
            Prediction.risk_level == RiskLevel.HIGH,
            Prediction.predicted_at >= since_24h,
        )
    )
    high_risk_last_24h = high_risk_recent.scalar() or 0

    # Recent critical conflicts (last 24h — count only)
    critical_recent = await db.execute(
        select(func.count(Conflict.id))
        .where(
            Conflict.severity == ConflictSeverity.CRITICAL,
            Conflict.detected_at >= since_24h,
        )
    )
    critical_last_24h = critical_recent.scalar() or 0

    return {
        "recent_registrations": recent_registrations,
        "last_24h": {
            "high_risk_predictions": high_risk_last_24h,
            "critical_conflicts": critical_last_24h,
        },
    }
