from pydantic import BaseModel, Field
from datetime import date, datetime
from uuid import UUID
from typing import Optional, List, Any
from app.models.models import TaskPriority, TaskStatus, RiskLevel, ConflictType, ConflictSeverity, NotificationType


# ═══════════════════════════════════════════════════════════
#  TASK SCHEMAS
# ═══════════════════════════════════════════════════════════

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    deadline: date
    estimated_effort_hours: float = Field(gt=0, le=1000)
    priority: TaskPriority
    category: Optional[str] = Field(default=None, max_length=80)
    parent_task_id: Optional[UUID] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    deadline: Optional[date] = None
    estimated_effort_hours: Optional[float] = Field(default=None, gt=0, le=1000)
    priority: Optional[TaskPriority] = None
    category: Optional[str] = None
    status: Optional[TaskStatus] = None


class PredictionSummary(BaseModel):
    risk_level: RiskLevel
    probability_score: float
    predicted_at: datetime

    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str]
    deadline: date
    estimated_effort_hours: float
    priority: TaskPriority
    category: Optional[str]
    status: TaskStatus
    parent_task_id: Optional[UUID]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    latest_prediction: Optional[PredictionSummary] = None
    subtask_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class TaskCreateResponse(BaseModel):
    task: TaskResponse
    prediction: Optional[PredictionSummary] = None


class SubtaskResponse(BaseModel):
    id: UUID
    title: str
    deadline: date
    estimated_effort_hours: float
    priority: TaskPriority
    status: TaskStatus
    parent_task_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
#  PREDICTION SCHEMAS
# ═══════════════════════════════════════════════════════════

class PredictionResponse(BaseModel):
    id: UUID
    task_id: UUID
    risk_level: RiskLevel
    probability_score: float
    model_version: str
    features_snapshot: dict
    predicted_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
#  CONFLICT SCHEMAS
# ═══════════════════════════════════════════════════════════

class ConflictResponse(BaseModel):
    id: UUID
    user_id: UUID
    task_ids: List[str]
    conflict_type: ConflictType
    severity: ConflictSeverity
    description: str
    resolved: bool
    detected_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
#  RECOMMENDATION SCHEMAS
# ═══════════════════════════════════════════════════════════

class RecommendationItem(BaseModel):
    task_id: str
    title: str
    suggested_start_date: str
    urgency_score: float
    risk_level: str


class RecommendationResponse(BaseModel):
    id: UUID
    # recommended_order stored as List[dict] in DB JSON column —
    # we keep it as List[Any] here so it never crashes on serialization
    recommended_order: List[Any]
    reason_summary: str
    accepted: Optional[bool]
    generated_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
#  NOTIFICATION SCHEMAS
# ═══════════════════════════════════════════════════════════

class NotificationResponse(BaseModel):
    id: UUID
    type: NotificationType
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MarkAllReadResponse(BaseModel):
    marked_read: int


# ═══════════════════════════════════════════════════════════
#  DASHBOARD SCHEMA
# ═══════════════════════════════════════════════════════════

class RiskSummary(BaseModel):
    LOW: int = 0
    MEDIUM: int = 0
    HIGH: int = 0


class DashboardResponse(BaseModel):
    total_active_tasks: int
    risk_summary: RiskSummary
    workload_score: float        # 0–100 percentage of weekly capacity used
    active_conflicts: int
    tasks_due_this_week: int
    unread_notifications: int


# ═══════════════════════════════════════════════════════════
#  ANALYTICS SCHEMAS
# ═══════════════════════════════════════════════════════════

class ProductivityResponse(BaseModel):
    completion_rate: float
    total_completed: int
    total_missed: int
    total_pending: int
    period: str


class DailyWorkload(BaseModel):
    date: str
    effort_hours: float
    task_count: int
    capacity_hours: float
    overloaded: bool


class WorkloadChartResponse(BaseModel):
    days: List[DailyWorkload]
    total_effort: float
    total_capacity: float
    overload_days: int


# ═══════════════════════════════════════════════════════════
#  USER SCHEMAS (password change)
# ═══════════════════════════════════════════════════════════

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=100)
