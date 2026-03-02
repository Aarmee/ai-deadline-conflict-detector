from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.tasks import router as tasks_router
from app.api.v1.endpoints.intelligence import (
    predictions_router,
    conflicts_router,
    recommendations_router,
    notifications_router,
    analytics_router,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(tasks_router)
api_router.include_router(predictions_router)
api_router.include_router(conflicts_router)
api_router.include_router(recommendations_router)
api_router.include_router(notifications_router)
api_router.include_router(analytics_router)
