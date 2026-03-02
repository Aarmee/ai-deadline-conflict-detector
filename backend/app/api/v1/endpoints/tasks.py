from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional, List

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.models import User, Task, TaskStatus, TaskPriority, Prediction
from app.schemas.tasks import (
    TaskCreate, TaskUpdate, TaskResponse, TaskCreateResponse,
    PredictionSummary, SubtaskResponse
)
from app.services.task_service import TaskService
from app.services.user_service import UserService
from app.services.prediction_service import PredictionService
from app.services.conflict_service import run_conflict_detection

router = APIRouter(prefix="/tasks", tags=["Tasks"])


# ─────────────────────────────────────────────────────────
#  Helper — attach latest prediction to task response
# ─────────────────────────────────────────────────────────
def _attach_prediction(task: Task, prediction: Optional[Prediction] = None) -> TaskResponse:
    """
    Attach prediction to task response without triggering lazy loads.
    
    Args:
        task: Task object
        prediction: Optional prediction to attach (if already loaded)
    """
    from sqlalchemy import inspect as sqla_inspect
    
    resp = TaskResponse.model_validate(task)
    
    # Handle subtasks count without lazy loading
    task_state = sqla_inspect(task)
    if 'subtasks' not in task_state.unloaded:
        resp.subtask_count = len(task.subtasks) if task.subtasks else 0
    else:
        resp.subtask_count = 0
    
    # Attach prediction if provided
    if prediction:
        resp.latest_prediction = PredictionSummary.model_validate(prediction)
    elif 'predictions' not in task_state.unloaded and task.predictions:
        # Predictions already loaded, safe to access
        latest_pred = max(task.predictions, key=lambda p: p.predicted_at)
        resp.latest_prediction = PredictionSummary.model_validate(latest_pred)
    
    return resp


# ─────────────────────────────────────────────────────────
#  GET /tasks  — List all top-level tasks for current user
# ─────────────────────────────────────────────────────────
@router.get("", response_model=List[TaskResponse], summary="List all tasks")
async def list_tasks(
    status: Optional[TaskStatus] = Query(default=None, description="Filter by status"),
    priority: Optional[TaskPriority] = Query(default=None, description="Filter by priority"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    skip: int = Query(default=0, ge=0, description="Pagination offset"),
    limit: int = Query(default=50, le=100, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all top-level tasks (no subtasks) for the authenticated user,
    sorted by deadline ascending. Each task includes its latest ML prediction.
    Supports filtering by status, priority, and category.
    """
    tasks = await TaskService.get_all_for_user(
        db, current_user.id,
        status=status, priority=priority, category=category,
        skip=skip, limit=limit
    )
    return [_attach_prediction(t) for t in tasks]


# ─────────────────────────────────────────────────────────
#  POST /tasks  — Create new task
# ─────────────────────────────────────────────────────────
@router.post("", response_model=TaskCreateResponse, status_code=status.HTTP_201_CREATED, summary="Create a task")
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new task. Immediately runs:
    1. ML risk prediction — returns risk_level + probability_score
    2. Conflict detection — updates active conflicts for user
    """
    # Validate parent task belongs to same user if provided
    if data.parent_task_id:
        parent = await TaskService.get_by_id(db, data.parent_task_id, current_user.id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent task not found")

    task = await TaskService.create(db, data, current_user)

    # ML prediction
    workload = await TaskService.get_total_active_workload(db, current_user.id)
    count = await TaskService.count_active_tasks(db, current_user.id)
    prediction = await PredictionService.predict_and_save(db, task, current_user, workload, count)

    # Conflict detection (runs silently, saves to DB)
    await run_conflict_detection(db, current_user)

    return TaskCreateResponse(
        task=_attach_prediction(task, prediction),
        prediction=PredictionSummary.model_validate(prediction),
    )


# ─────────────────────────────────────────────────────────
#  GET /tasks/{task_id}  — Get single task
# ─────────────────────────────────────────────────────────
@router.get("/{task_id}", response_model=TaskResponse, summary="Get a task")
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a single task with its latest prediction. Returns 404 if not found or not owned by user."""
    task = await TaskService.get_by_id(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _attach_prediction(task)


# ─────────────────────────────────────────────────────────
#  PATCH /tasks/{task_id}  — Update task
# ─────────────────────────────────────────────────────────
@router.patch("/{task_id}", response_model=TaskCreateResponse, summary="Update a task")
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Partially updates a task. Only provided fields are changed.
    Re-runs ML prediction automatically if deadline or effort_hours changed.
    Re-runs conflict detection after any update.
    """
    task = await TaskService.get_by_id(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task = await TaskService.update(db, task, data)

    # Re-predict if deadline or effort changed — both affect risk score
    prediction = None
    if data.deadline is not None or data.estimated_effort_hours is not None:
        workload = await TaskService.get_total_active_workload(db, current_user.id)
        count = await TaskService.count_active_tasks(db, current_user.id)
        prediction = await PredictionService.predict_and_save(db, task, current_user, workload, count)
        await run_conflict_detection(db, current_user)

    if not prediction:
        prediction = await PredictionService.get_latest_for_task(db, task_id)

    return TaskCreateResponse(
        task=_attach_prediction(task, prediction),
        prediction=PredictionSummary.model_validate(prediction) if prediction else None,
    )


# ─────────────────────────────────────────────────────────
#  DELETE /tasks/{task_id}  — Delete task
# ─────────────────────────────────────────────────────────
@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a task")
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a task and all its predictions (cascade). Also deletes subtasks."""
    task = await TaskService.get_by_id(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await TaskService.delete(db, task)


# ─────────────────────────────────────────────────────────
#  POST /tasks/{task_id}/complete  — Mark complete
# ─────────────────────────────────────────────────────────
@router.post("/{task_id}/complete", response_model=TaskResponse, summary="Mark task as complete")
async def complete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks a task as COMPLETED and records completion timestamp.
    Recalculates user's historical completion_rate (used as ML feature).
    """
    task = await TaskService.get_by_id(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Task is already completed")

    task = await TaskService.complete(db, task)
    # Recalculate completion rate — this feeds back into future ML predictions
    await UserService.update_completion_rate(db, current_user)
    return _attach_prediction(task)


# ─────────────────────────────────────────────────────────
#  POST /tasks/{task_id}/start  — Mark IN_PROGRESS
# ─────────────────────────────────────────────────────────
@router.post("/{task_id}/start", response_model=TaskResponse, summary="Mark task as in progress")
async def start_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Moves task status from PENDING to IN_PROGRESS."""
    task = await TaskService.get_by_id(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != TaskStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Task is already {task.status.value}")

    task.status = TaskStatus.IN_PROGRESS
    await db.flush()
    await db.refresh(task)
    return _attach_prediction(task)


# ─────────────────────────────────────────────────────────
#  GET /tasks/{task_id}/subtasks  — List subtasks
# ─────────────────────────────────────────────────────────
@router.get("/{task_id}/subtasks", response_model=List[SubtaskResponse], summary="Get subtasks")
async def get_subtasks(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all subtasks for a given parent task."""
    # Verify parent belongs to user
    parent = await TaskService.get_by_id(db, task_id, current_user.id)
    if not parent:
        raise HTTPException(status_code=404, detail="Task not found")

    result = await db.execute(
        select(Task).where(
            Task.parent_task_id == task_id,
            Task.user_id == current_user.id
        ).order_by(Task.deadline.asc())
    )
    return result.scalars().all()


# ─────────────────────────────────────────────────────────
#  POST /tasks/{task_id}/subtasks  — Create subtask
# ─────────────────────────────────────────────────────────
@router.post("/{task_id}/subtasks", response_model=TaskCreateResponse, status_code=status.HTTP_201_CREATED, summary="Create a subtask")
async def create_subtask(
    task_id: UUID,
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a subtask under a parent task.
    Forces parent_task_id to match the URL path parameter.
    Also runs ML prediction on the new subtask.
    """
    parent = await TaskService.get_by_id(db, task_id, current_user.id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent task not found")

    # Force the subtask to point at this parent
    data.parent_task_id = task_id
    task = await TaskService.create(db, data, current_user)

    workload = await TaskService.get_total_active_workload(db, current_user.id)
    count = await TaskService.count_active_tasks(db, current_user.id)
    prediction = await PredictionService.predict_and_save(db, task, current_user, workload, count)

    return TaskCreateResponse(
        task=_attach_prediction(task, prediction),
        prediction=PredictionSummary.model_validate(prediction),
    )
