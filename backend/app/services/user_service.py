from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Optional

from app.models.models import User
from app.schemas.auth import RegisterRequest
from app.core.security import hash_password


class UserService:

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str | UUID) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, data: RegisterRequest) -> User:
        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            daily_hours_available=data.daily_hours_available,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def update_completion_rate(db: AsyncSession, user: User) -> None:
        """Recalculate completion rate based on task history."""
        from sqlalchemy import func
        from app.models.models import Task, TaskStatus

        result = await db.execute(
            select(
                func.count(Task.id).filter(Task.status == TaskStatus.COMPLETED).label("completed"),
                func.count(Task.id).filter(Task.status.in_([TaskStatus.COMPLETED, TaskStatus.MISSED])).label("total")
            ).where(Task.user_id == user.id)
        )
        row = result.one()
        if row.total > 0:
            user.completion_rate = round(row.completed / row.total, 4)
            await db.flush()
