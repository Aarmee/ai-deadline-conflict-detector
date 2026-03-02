from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.models import Prediction, Task, User
from app.ml.model import ml_service, extract_features
from app.core.config import settings


class PredictionService:

    @staticmethod
    async def predict_and_save(
        db: AsyncSession,
        task: Task,
        user: User,
        active_workload_hours: float,
        active_task_count: int,
    ) -> Prediction:
        """Run ML inference and save result to DB."""
        features = extract_features(task, user, active_workload_hours, active_task_count)
        result = ml_service.predict(features)

        prediction = Prediction(
            task_id=task.id,
            user_id=user.id,
            risk_level=result["risk_level"],
            probability_score=result["probability_score"],
            model_version=settings.ML_MODEL_VERSION,
            features_snapshot={**features, "probabilities": result["probabilities"]},
        )
        db.add(prediction)
        await db.flush()
        await db.refresh(prediction)
        return prediction

    @staticmethod
    async def get_latest_for_task(db: AsyncSession, task_id: UUID) -> Prediction | None:
        result = await db.execute(
            select(Prediction)
            .where(Prediction.task_id == task_id)
            .order_by(Prediction.predicted_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_for_task(db: AsyncSession, task_id: UUID):
        result = await db.execute(
            select(Prediction)
            .where(Prediction.task_id == task_id)
            .order_by(Prediction.predicted_at.desc())
        )
        return result.scalars().all()
