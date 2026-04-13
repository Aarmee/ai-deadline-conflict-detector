from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import api_router
from app.ml.model import ml_service
from app.services.scheduler import start_scheduler, stop_scheduler


# ─── Lifespan (startup/shutdown) ──────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    ml_service.load_model()
    print("ML model ready.")
    start_scheduler()

    yield

    # Shutdown
    stop_scheduler()
    print("Shutting down...")


# ─── App Instance ─────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## AI-Driven Smart Deadline Conflict Detection System

### Features
- **JWT Authentication** — Secure register/login with token refresh
- **Task Management** — Full CRUD with subtask support
- **ML Risk Prediction** — Random Forest model predicts deadline miss probability
- **Conflict Detection** — 3 types: Deadline Overlap, Workload Overload, Dependency Block  
- **Schedule Optimizer** — Urgency-scored task ordering with suggested start dates
- **Dashboard Analytics** — Workload score, risk summary, productivity metrics

### Authentication
Use `POST /api/v1/auth/login` to get a Bearer token, then click **Authorize** above.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS Middleware ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────
app.include_router(api_router)


# ─── Health Check ─────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ml_model_loaded": ml_service.is_loaded,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "health": "/health",
    }
