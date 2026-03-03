# 🌐 API Directory

> HTTP endpoints and route definitions - The interface between frontend and backend

## 📁 Directory Structure

```
api/
├── v1/                    # API version 1
│   ├── endpoints/         # Individual endpoint modules
│   │   ├── auth.py       # Authentication endpoints
│   │   ├── tasks.py      # Task management endpoints
│   │   ├── intelligence.py  # ML/Analytics endpoints
│   │   └── __init__.py
│   ├── router.py         # Main API router (aggregates all endpoints)
│   └── __init__.py
└── __init__.py
```

---

## 📄 Files Explained

### `v1/router.py`
**Purpose:** Aggregates all endpoint routers into a single API router

**What it does:**
- Imports routers from all endpoint modules
- Combines them under `/api/v1` prefix
- Exports single `api_router` for `main.py`

**Code:**
```python
from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.tasks import router as tasks_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(tasks_router)
```

**When to edit:**
- Adding new endpoint modules
- Changing API version prefix

---

### `v1/endpoints/auth.py`
**Purpose:** Authentication and user management endpoints

**Endpoints:**
- `POST /api/v1/auth/register` - Create new account
- `POST /api/v1/auth/login` - Login and get JWT tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile
- `PATCH /api/v1/auth/me` - Update profile
- `POST /api/v1/auth/change-password` - Change password
- `DELETE /api/v1/auth/me` - Deactivate account

**What it does:**
- Handles user registration with password validation
- Issues JWT access and refresh tokens
- Manages user authentication
- Provides user profile operations

**Dependencies:**
- `UserService` - User CRUD operations
- `security.py` - Password hashing, JWT creation
- `auth.py` schemas - Request/response validation

**When to edit:**
- Adding new auth endpoints (e.g., forgot password)
- Changing authentication logic
- Adding OAuth providers

**Example endpoint:**
```python
@router.post("/register", response_model=TokenResponse)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    # Validate email not taken
    # Create user with hashed password
    # Return JWT tokens
```

---

### `v1/endpoints/tasks.py`
**Purpose:** Task management CRUD operations

**Endpoints:**
- `GET /api/v1/tasks` - List all tasks (with filters)
- `POST /api/v1/tasks` - Create task + ML prediction
- `GET /api/v1/tasks/{id}` - Get single task
- `PATCH /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task
- `POST /api/v1/tasks/{id}/complete` - Mark complete
- `POST /api/v1/tasks/{id}/start` - Mark in progress
- `GET /api/v1/tasks/{id}/subtasks` - List subtasks
- `POST /api/v1/tasks/{id}/subtasks` - Create subtask

**What it does:**
- Full CRUD for tasks
- Automatically runs ML prediction on task creation
- Triggers conflict detection after changes
- Manages task status transitions
- Handles parent-child task relationships

**Dependencies:**
- `TaskService` - Task CRUD logic
- `PredictionService` - ML predictions
- `conflict_service` - Conflict detection
- `tasks.py` schemas - Validation

**Special features:**
- `_attach_prediction()` helper - Safely attaches ML predictions without lazy loading
- Automatic conflict detection on create/update
- Re-runs prediction when deadline/effort changes

**When to edit:**
- Adding new task operations
- Changing task workflow
- Adding task filters

---

### `v1/endpoints/intelligence.py`
**Purpose:** ML predictions, conflicts, recommendations, analytics

**Routers (5 separate routers):**

#### 1. `predictions_router` - ML Predictions
- `GET /api/v1/predictions/dashboard` - Dashboard data
- `GET /api/v1/predictions/task/{id}` - Prediction history

#### 2. `conflicts_router` - Conflict Detection
- `GET /api/v1/conflicts` - List active conflicts
- `POST /api/v1/conflicts/detect` - Run detection manually
- `POST /api/v1/conflicts/{id}/resolve` - Mark resolved

#### 3. `recommendations_router` - Schedule Optimization
- `GET /api/v1/recommendations/schedule` - Get AI recommendations
- `POST /api/v1/recommendations/{id}/accept` - Accept recommendation

#### 4. `notifications_router` - User Notifications
- `GET /api/v1/notifications` - List notifications
- `POST /api/v1/notifications/mark-all-read` - Mark all read

#### 5. `analytics_router` - Productivity Analytics
- `GET /api/v1/analytics/productivity` - Completion stats
- `GET /api/v1/analytics/workload-chart` - Workload over time
- `GET /api/v1/analytics/summary` - Overall summary

**What it does:**
- Provides ML-powered insights
- Detects scheduling conflicts
- Generates task recommendations
- Tracks productivity metrics
- Manages user notifications

**Dependencies:**
- `PredictionService` - ML predictions
- `conflict_service` - Conflict detection
- `optimizer_service` - Schedule optimization
- `TaskService` - Task queries

**When to edit:**
- Adding new analytics
- Changing conflict detection rules
- Adding notification types

---

## 🏗 API Design Patterns

### 1. Dependency Injection
```python
async def endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # db and current_user automatically injected
```

### 2. Response Models
```python
@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(...):
    # FastAPI validates response matches TaskResponse
```

### 3. Status Codes
```python
@router.post("/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(...):
    # Returns 201 instead of default 200
```

### 4. Error Handling
```python
if not task:
    raise HTTPException(
        status_code=404,
        detail="Task not found"
    )
```

---

## 🔐 Authentication Flow

### Protected Endpoints
```python
@router.get("/tasks")
async def list_tasks(
    current_user: User = Depends(get_current_user)  # ← Requires auth
):
    # Only authenticated users can access
```

### Public Endpoints
```python
@router.post("/auth/register")
async def register(data: RegisterRequest):
    # No authentication required
```

---

## 📊 Request/Response Flow

```
1. Client sends HTTP request
   ↓
2. FastAPI validates request body (Pydantic schema)
   ↓
3. Dependency injection (db, current_user)
   ↓
4. Endpoint function executes
   ↓
5. Service layer processes business logic
   ↓
6. Database operations (if needed)
   ↓
7. ML predictions (if needed)
   ↓
8. Response validated (Pydantic schema)
   ↓
9. JSON response sent to client
```

---

## 🎯 Adding a New Endpoint

### Step 1: Create endpoint function
```python
# app/api/v1/endpoints/tasks.py

@router.post("/tasks/{task_id}/archive")
async def archive_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = await TaskService.get_by_id(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.is_archived = True
    await db.flush()
    return {"message": "Task archived"}
```

### Step 2: Test in Swagger
- Go to http://localhost:8000/docs
- Find your new endpoint
- Click "Try it out"
- Test it!

### Step 3: Write tests
```python
# tests/test_api/test_tasks.py

async def test_archive_task(auth_client):
    # Create task
    create_resp = await auth_client.post("/api/v1/tasks", json={...})
    task_id = create_resp.json()["task"]["id"]
    
    # Archive it
    resp = await auth_client.post(f"/api/v1/tasks/{task_id}/archive")
    assert resp.status_code == 200
```

---

## 🐛 Common Issues

### Issue: "422 Unprocessable Entity"
**Cause:** Request body doesn't match Pydantic schema

**Solution:** Check request body matches schema exactly
```python
# Schema expects:
class TaskCreate(BaseModel):
    title: str
    deadline: datetime

# Send:
{
  "title": "My Task",
  "deadline": "2024-12-31T23:59:59"  # ISO format!
}
```

### Issue: "401 Unauthorized"
**Cause:** Missing or invalid JWT token

**Solution:** Add Authorization header
```
Authorization: Bearer <your_access_token>
```

### Issue: "404 Not Found"
**Cause:** Endpoint doesn't exist or wrong URL

**Solution:** Check endpoint is registered in `router.py`

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `app/schemas/` | Request/response validation |
| `app/services/` | Business logic |
| `app/models/` | Database models |
| `app/core/security.py` | Authentication |

---

## 🔗 Documentation

- [Swagger UI](http://localhost:8000/docs) - Interactive API docs
- [ReDoc](http://localhost:8000/redoc) - Clean API docs
- [API Examples](../../API_EXAMPLES.md) - Copy-paste examples

---

**Pro Tip:** Always test new endpoints in Swagger UI before writing frontend code!
