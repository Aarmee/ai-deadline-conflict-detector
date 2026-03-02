from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import date, datetime, timezone
from typing import Optional, List

from app.models.models import Task, TaskStatus, TaskPriority, Prediction, User
from app.schemas.tasks import TaskCreate, TaskUpdate


class TaskService:

    @staticmethod
    async def get_all_for_user(
        db: AsyncSession,
        user_id: UUID,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Task]:
        query = (
            select(Task)
            .where(Task.user_id == user_id, Task.parent_task_id == None)
            .options(selectinload(Task.predictions))
            .order_by(Task.deadline.asc())
            .offset(skip)
            .limit(limit)
        )
        if status:
            query = query.where(Task.status == status)
        if priority:
            query = query.where(Task.priority == priority)
        if category:
            query = query.where(Task.category == category)

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_by_id(db: AsyncSession, task_id: UUID, user_id: UUID) -> Optional[Task]:
        result = await db.execute(
            select(Task)
            .where(Task.id == task_id, Task.user_id == user_id)
            .options(selectinload(Task.predictions))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, data: TaskCreate, user: User) -> Task:
        task = Task(
            user_id=user.id,
            title=data.title,
            description=data.description,
            deadline=data.deadline,
            estimated_effort_hours=data.estimated_effort_hours,
            priority=data.priority,
            category=data.category,
            parent_task_id=data.parent_task_id,
        )
        db.add(task)
        await db.flush()
        await db.refresh(task)
        return task

    @staticmethod
    async def update(db: AsyncSession, task: Task, data: TaskUpdate) -> Task:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        await db.flush()
        await db.refresh(task)
        return task

    @staticmethod
    async def complete(db: AsyncSession, task: Task) -> Task:
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now(timezone.utc)
        await db.flush()
        return task

    @staticmethod
    async def delete(db: AsyncSession, task: Task) -> None:
        await db.delete(task)
        await db.flush()

    @staticmethod
    async def get_active_tasks_for_user(db: AsyncSession, user_id: UUID) -> List[Task]:
        result = await db.execute(
            select(Task).where(
                Task.user_id == user_id,
                Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
            )
        )
        return result.scalars().all()

    @staticmethod
    async def get_total_active_workload(db: AsyncSession, user_id: UUID) -> float:
        result = await db.execute(
            select(func.sum(Task.estimated_effort_hours)).where(
                Task.user_id == user_id,
                Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
            )
        )
        return result.scalar() or 0.0

    @staticmethod
    async def count_active_tasks(db: AsyncSession, user_id: UUID) -> int:
        result = await db.execute(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
            )
        )
        return result.scalar() or 0

    @staticmethod
    def get_latest_prediction(task: Task) -> Optional[Prediction]:
        if not task.predictions:
            return None
        return max(task.predictions, key=lambda p: p.predicted_at)
