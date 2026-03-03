# 🗄️ Models Directory

> SQLAlchemy ORM models - Database table definitions

## 📁 Directory Structure

```
models/
├── models.py         # All database models (tables)
└── __init__.py       # Package initialization
```

---

## 📄 Files Explained

### `models.py`
**Purpose:** Defines all database tables using SQLAlchemy ORM

**What it does:**
- Defines table structure (columns, types, constraints)
- Establishes relationships between tables
- Provides ORM interface for database operations
- Handles data validation at database level

---

## 📊 Database Models (Tables)

### 1. `User` Model
**Table:** `users`

**Purpose:** Store user accounts and authentication data

**Columns:**
```python
id: UUID                      # Primary key (auto-generated)
email: str                    # Unique, indexed
password_hash: str            # Bcrypt hashed password
full_name: str                # User's display name
daily_hours_available: float  # Work capacity (1.0-24.0 hours)
completion_rate: float        # Historical completion rate (0.0-1.0)
is_active: bool              # Account status (default: True)
created_at: datetime         # Account creation timestamp
updated_at: datetime         # Last update timestamp
```

**Relationships:**
- `tasks` → One-to-Many with Task (user has many tasks)
- `predictions` → One-to-Many with Prediction
- `conflicts` → One-to-Many with Conflict
- `recommendations` → One-to-Many with Recommendation
- `notifications` → One-to-Many with Notification

**Why these fields?**
- `email` - Unique identifier for login
- `password_hash` - Secure password storage (never plain text!)
- `daily_hours_available` - Used by ML model for workload calculations
- `completion_rate` - ML feature for predicting deadline risk
- `is_active` - Soft delete (deactivate instead of delete)

**Example:**
```python
user = User(
    email="john@example.com",
    password_hash=hash_password("SecurePass123"),
    full_name="John Doe",
    daily_hours_available=8.0
)
```

---

### 2. `Task` Model
**Table:** `tasks`

**Purpose:** Store user tasks with deadlines and priorities

**Columns:**
```python
id: UUID                      # Primary key
user_id: UUID                 # Foreign key to users
title: str                    # Task name (max 200 chars)
description: str              # Optional details (max 1000 chars)
deadline: datetime            # When task is due
estimated_effort_hours: float # How long task will take
priority: TaskPriority        # LOW, MEDIUM, HIGH (enum)
status: TaskStatus            # PENDING, IN_PROGRESS, COMPLETED, MISSED (enum)
category: str                 # Optional category (e.g., "Work", "Academic")
parent_task_id: UUID          # Optional - for subtasks
completed_at: datetime        # When task was completed (nullable)
created_at: datetime          # Task creation timestamp
updated_at: datetime          # Last update timestamp
```

**Relationships:**
- `user` → Many-to-One with User (task belongs to user)
- `subtasks` → One-to-Many with Task (task has many subtasks)
- `parent_task` → Many-to-One with Task (subtask belongs to parent)
- `predictions` → One-to-Many with Prediction (task has prediction history)

**Enums:**
```python
class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class TaskStatus(str, Enum):
    PENDING = "PENDING"           # Not started
    IN_PROGRESS = "IN_PROGRESS"   # Currently working
    COMPLETED = "COMPLETED"       # Finished on time
    MISSED = "MISSED"             # Deadline passed without completion
```

**Why these fields?**
- `estimated_effort_hours` - ML model uses this to predict risk
- `priority` - User-defined importance
- `status` - Track task lifecycle
- `parent_task_id` - Support hierarchical tasks (subtasks)
- `completed_at` - Calculate actual vs estimated time

**Example:**
```python
task = Task(
    user_id=user.id,
    title="Complete project report",
    deadline=datetime(2024, 12, 31, 23, 59, 59),
    estimated_effort_hours=8.0,
    priority=TaskPriority.HIGH,
    status=TaskStatus.PENDING,
    category="Academic"
)
```

---

### 3. `Prediction` Model
**Table:** `predictions`

**Purpose:** Store ML model predictions for tasks

**Columns:**
```python
id: UUID                      # Primary key
task_id: UUID                 # Foreign key to tasks
user_id: UUID                 # Foreign key to users
risk_level: str               # LOW, MEDIUM, HIGH
probability_score: float      # 0.0-1.0 (confidence)
model_version: str            # Which ML model version
features_snapshot: JSON       # Input features used
predicted_at: datetime        # When prediction was made
```

**Relationships:**
- `task` → Many-to-One with Task
- `user` → Many-to-One with User

**Why these fields?**
- `risk_level` - Human-readable risk category
- `probability_score` - Numeric confidence (0-1)
- `model_version` - Track which model made prediction
- `features_snapshot` - Audit trail of input data
- `predicted_at` - Track prediction history over time

**Example:**
```python
prediction = Prediction(
    task_id=task.id,
    user_id=user.id,
    risk_level="MEDIUM",
    probability_score=0.6543,
    model_version="rf_v1.0",
    features_snapshot={
        "days_remaining": 10,
        "estimated_effort_hours": 8.0,
        "workload_capacity_ratio": 0.75
    }
)
```

---

### 4. `Conflict` Model
**Table:** `conflicts`

**Purpose:** Store detected scheduling conflicts

**Columns:**
```python
id: UUID                      # Primary key
user_id: UUID                 # Foreign key to users
conflict_type: str            # DEADLINE_OVERLAP, WORKLOAD_OVERLOAD, DEPENDENCY_BLOCKING
severity: str                 # LOW, MEDIUM, HIGH
description: str              # Human-readable explanation
task_ids: JSON                # Array of affected task IDs
is_resolved: bool             # Whether conflict is fixed
detected_at: datetime         # When conflict was found
resolved_at: datetime         # When conflict was resolved (nullable)
```

**Relationships:**
- `user` → Many-to-One with User

**Conflict Types:**
- `DEADLINE_OVERLAP` - Multiple tasks with overlapping deadlines
- `WORKLOAD_OVERLOAD` - Total workload exceeds user capacity
- `DEPENDENCY_BLOCKING` - Parent task blocking subtasks

**Why these fields?**
- `conflict_type` - Categorize conflict for resolution strategies
- `severity` - Prioritize which conflicts to address first
- `task_ids` - Link to affected tasks (JSON array)
- `is_resolved` - Track conflict lifecycle

**Example:**
```python
conflict = Conflict(
    user_id=user.id,
    conflict_type="DEADLINE_OVERLAP",
    severity="HIGH",
    description="Tasks 'Project Report' and 'Final Exam' have overlapping deadlines",
    task_ids=["uuid1", "uuid2"],
    is_resolved=False
)
```

---

### 5. `Recommendation` Model
**Table:** `recommendations`

**Purpose:** Store AI-generated schedule recommendations

**Columns:**
```python
id: UUID                      # Primary key
user_id: UUID                 # Foreign key to users
recommended_order: JSON       # Array of tasks with urgency scores
reasoning: str                # Why this order was recommended
is_accepted: bool             # Whether user accepted recommendation
created_at: datetime          # When recommendation was generated
accepted_at: datetime         # When user accepted (nullable)
```

**Relationships:**
- `user` → Many-to-One with User

**Why these fields?**
- `recommended_order` - JSON array of tasks sorted by urgency
- `reasoning` - Explain AI decision (transparency)
- `is_accepted` - Track recommendation effectiveness

**Example:**
```python
recommendation = Recommendation(
    user_id=user.id,
    recommended_order=[
        {
            "task_id": "uuid1",
            "task_title": "Final Exam Prep",
            "urgency_score": 0.95,
            "suggested_start_date": "2024-03-03"
        },
        {
            "task_id": "uuid2",
            "task_title": "Project Report",
            "urgency_score": 0.87,
            "suggested_start_date": "2024-03-05"
        }
    ],
    reasoning="Prioritized by deadline proximity and risk level",
    is_accepted=False
)
```

---

### 6. `Notification` Model
**Table:** `notifications`

**Purpose:** Store user notifications

**Columns:**
```python
id: UUID                      # Primary key
user_id: UUID                 # Foreign key to users
type: str                     # CONFLICT_DETECTED, RECOMMENDATION_READY, DEADLINE_APPROACHING
title: str                    # Notification headline
message: str                  # Detailed message
is_read: bool                 # Whether user has seen it
created_at: datetime          # When notification was created
```

**Relationships:**
- `user` → Many-to-One with User

**Notification Types:**
- `CONFLICT_DETECTED` - New scheduling conflict found
- `RECOMMENDATION_READY` - New AI recommendation available
- `DEADLINE_APPROACHING` - Task deadline is near
- `TASK_OVERDUE` - Task missed deadline

**Why these fields?**
- `type` - Categorize for filtering/styling
- `is_read` - Track which notifications user has seen
- `created_at` - Sort by recency

**Example:**
```python
notification = Notification(
    user_id=user.id,
    type="CONFLICT_DETECTED",
    title="Schedule Conflict Detected",
    message="You have overlapping deadlines for 2 tasks",
    is_read=False
)
```

---

## 🔗 Relationships Explained

### One-to-Many
```python
# User has many tasks
user.tasks  # Access all tasks for a user

# Task has many predictions
task.predictions  # Access prediction history
```

### Many-to-One
```python
# Task belongs to user
task.user  # Access the user who owns this task

# Prediction belongs to task
prediction.task  # Access the task this prediction is for
```

### Self-Referential (Parent-Child)
```python
# Task can have subtasks
parent_task.subtasks  # Access all subtasks

# Subtask belongs to parent
subtask.parent_task  # Access parent task
```

---

## 🏗 Database Schema Diagram

```
┌─────────────┐
│    User     │
│  (users)    │
└──────┬──────┘
       │
       │ 1:N
       │
       ├──────────────────────────────────┐
       │                                  │
       ↓                                  ↓
┌─────────────┐                    ┌──────────────┐
│    Task     │                    │  Prediction  │
│  (tasks)    │←───────────────────│(predictions) │
└──────┬──────┘        N:1         └──────────────┘
       │
       │ Self-referential
       │ (parent-child)
       │
       ↓
┌─────────────┐
│   Subtask   │
│  (tasks)    │
└─────────────┘

User also has:
- Conflicts (1:N)
- Recommendations (1:N)
- Notifications (1:N)
```

---

## 🎯 Common Operations

### Create
```python
user = User(email="test@example.com", ...)
db.add(user)
await db.flush()  # Get ID without committing
await db.commit()  # Persist to database
```

### Read
```python
# Get by ID
user = await db.get(User, user_id)

# Query with filter
result = await db.execute(
    select(User).where(User.email == "test@example.com")
)
user = result.scalar_one_or_none()
```

### Update
```python
user.full_name = "New Name"
await db.flush()  # Save changes
await db.commit()
```

### Delete
```python
await db.delete(user)
await db.commit()
```

### Relationships
```python
# Access related data
user_tasks = user.tasks  # Lazy load (triggers query)

# Eager load (better performance)
result = await db.execute(
    select(User).options(selectinload(User.tasks))
)
user = result.scalar_one()
# user.tasks already loaded, no additional query
```

---

## 🔍 Indexes

**Indexed columns for performance:**
- `users.email` - Fast login lookups
- `tasks.user_id` - Fast task queries per user
- `tasks.deadline` - Fast deadline sorting
- `predictions.task_id` - Fast prediction history
- `conflicts.user_id` - Fast conflict queries

---

## 🛠 Migrations

When you change models, create a migration:

```bash
# Auto-generate migration
alembic revision --autogenerate -m "Add new column"

# Review generated file in alembic/versions/

# Apply migration
alembic upgrade head
```

---

## 🐛 Common Issues

### Issue: "Table doesn't exist"
**Cause:** Migrations not run

**Solution:**
```bash
alembic upgrade head
```

### Issue: "Column doesn't exist"
**Cause:** Model changed but migration not created

**Solution:**
```bash
alembic revision --autogenerate -m "Add column"
alembic upgrade head
```

### Issue: "Lazy loading in async"
**Cause:** Accessing relationship without eager loading

**Solution:**
```python
# Bad (lazy load)
user.tasks  # Triggers sync query in async context

# Good (eager load)
result = await db.execute(
    select(User).options(selectinload(User.tasks))
)
user = result.scalar_one()
user.tasks  # Already loaded
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `alembic/versions/` | Database migrations |
| `app/schemas/` | Pydantic models (validation) |
| `app/services/` | Business logic using models |
| `app/db/session.py` | Database connection |

---

## 🔗 SQLAlchemy Documentation

- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/orm/)
- [Async SQLAlchemy](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Relationships](https://docs.sqlalchemy.org/en/20/orm/relationships.html)

---

**Pro Tip:** Always use `await db.flush()` after creating objects to get auto-generated IDs before committing!
