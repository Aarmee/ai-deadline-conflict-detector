# 🔧 Services Directory

> Business logic layer - Core functionality and data operations

## 📁 Directory Structure

```
services/
├── user_service.py          # User CRUD operations
├── task_service.py          # Task CRUD and queries
├── prediction_service.py    # ML prediction management
├── conflict_service.py      # Conflict detection engine
├── optimizer_service.py     # Schedule optimization
└── __init__.py              # Package initialization
```

---

## 🎯 What Are Services?

**Services** contain business logic and data operations:
- **Separate concerns** - Keep endpoints clean
- **Reusable logic** - Share code across endpoints
- **Testable** - Easy to unit test
- **Database operations** - CRUD and complex queries

**Pattern:**
```
API Endpoint → Service → Database
```

---

## 📄 Files Explained

### `user_service.py`
**Purpose:** User account management

**Methods:**

#### `get_by_id(db, user_id)`
**What it does:** Fetch user by UUID

```python
user = await UserService.get_by_id(db, user_id)
```

#### `get_by_email(db, email)`
**What it does:** Fetch user by email (for login)

```python
user = await UserService.get_by_email(db, "john@example.com")
```

#### `create(db, data: RegisterRequest)`
**What it does:** Create new user with hashed password

```python
user = await UserService.create(db, register_data)
# Automatically hashes password
# Returns User object with ID
```

#### `update_completion_rate(db, user)`
**What it does:** Recalculate user's historical completion rate

```python
await UserService.update_completion_rate(db, user)
# Queries completed vs total tasks
# Updates user.completion_rate
```

**Why this matters:**
- Completion rate is ML feature
- Affects deadline risk predictions
- Updated after task completion

**When to use:**
- After user registration
- After task completion
- When user profile is requested

---

### `task_service.py`
**Purpose:** Task management and queries

**Methods:**

#### `create(db, data: TaskCreate, user: User)`
**What it does:** Create new task

```python
task = await TaskService.create(db, task_data, current_user)
```

#### `get_by_id(db, task_id, user_id)`
**What it does:** Fetch task by ID (with ownership check)

```python
task = await TaskService.get_by_id(db, task_id, user.id)
# Returns None if not found or not owned by user
```

#### `get_all_for_user(db, user_id, status, priority, category, skip, limit)`
**What it does:** List user's tasks with filters

```python
tasks = await TaskService.get_all_for_user(
    db,
    user_id=user.id,
    status=TaskStatus.PENDING,
    priority=TaskPriority.HIGH,
    skip=0,
    limit=50
)
```

**Filters:**
- `status` - PENDING, IN_PROGRESS, COMPLETED, MISSED
- `priority` - LOW, MEDIUM, HIGH
- `category` - Custom category string
- `skip` - Pagination offset
- `limit` - Max results

#### `update(db, task: Task, data: TaskUpdate)`
**What it does:** Update task fields

```python
updated_task = await TaskService.update(db, task, update_data)
# Only updates provided fields
```

#### `delete(db, task: Task)`
**What it does:** Delete task and related data

```python
await TaskService.delete(db, task)
# Cascades to predictions, conflicts
```

#### `complete(db, task: Task)`
**What it does:** Mark task as completed

```python
task = await TaskService.complete(db, task)
# Sets status = COMPLETED
# Sets completed_at = now
```

#### `get_total_active_workload(db, user_id)`
**What it does:** Calculate total hours for active tasks

```python
total_hours = await TaskService.get_total_active_workload(db, user.id)
# Sums estimated_effort_hours for PENDING + IN_PROGRESS tasks
```

**Used by:**
- ML model (workload feature)
- Conflict detection (overload check)
- Dashboard (workload score)

#### `count_active_tasks(db, user_id)`
**What it does:** Count active tasks

```python
count = await TaskService.count_active_tasks(db, user.id)
# Counts PENDING + IN_PROGRESS tasks
```

**Used by:**
- ML model (task count feature)
- Dashboard (task summary)

#### `get_latest_prediction(task: Task)`
**What it does:** Get most recent prediction for task

```python
prediction = TaskService.get_latest_prediction(task)
# Returns latest Prediction or None
```

**Note:** This is synchronous - only use when predictions are already loaded!

**When to use:**
- User registration
- User login
- Profile updates
- Password changes

---

### `prediction_service.py`
**Purpose:** ML prediction management

**Methods:**

#### `predict_and_save(db, task, user, active_workload_hours, active_task_count)`
**What it does:** Run ML prediction and save to database

```python
prediction = await PredictionService.predict_and_save(
    db,
    task=task,
    user=user,
    active_workload_hours=15.0,
    active_task_count=5
)
```

**Process:**
1. Extract features from task + user + workload
2. Run ML model inference
3. Create Prediction record
4. Save to database
5. Return Prediction object

**Returns:**
```python
{
    "risk_level": "MEDIUM",
    "probability_score": 0.6543,
    "model_version": "rf_v1.0",
    "features_snapshot": {...}
}
```

#### `get_latest_for_task(db, task_id)`
**What it does:** Get latest prediction for task

```python
prediction = await PredictionService.get_latest_for_task(db, task_id)
```

#### `get_all_for_task(db, task_id)`
**What it does:** Get prediction history for task

```python
predictions = await PredictionService.get_all_for_task(db, task_id)
# Returns list ordered by predicted_at DESC
```

**When to use:**
- After task creation
- After task update (deadline/effort changed)
- Dashboard data
- Prediction history endpoint

---

### `conflict_service.py`
**Purpose:** Detect and manage scheduling conflicts

**Main Function:**

#### `run_conflict_detection(db, user: User)`
**What it does:** Detect all types of conflicts for user

```python
await run_conflict_detection(db, user)
```

**Detects 3 types:**

##### 1. Deadline Overlap
**What it detects:** Multiple tasks with overlapping deadlines

**Logic:**
```python
# Find tasks with deadlines within 24 hours of each other
# Group by overlapping deadline windows
# Create conflict if 2+ tasks overlap
```

**Example:**
- Task A: Due Dec 31, 11:59 PM
- Task B: Due Dec 31, 11:00 PM
- **Conflict:** Both due same day

##### 2. Workload Overload
**What it detects:** Total workload exceeds user capacity

**Logic:**
```python
# Sum all active task effort hours
# Calculate user capacity (daily_hours × days_remaining)
# Create conflict if workload > capacity
```

**Example:**
- User capacity: 8 hours/day × 10 days = 80 hours
- Total workload: 95 hours
- **Conflict:** Overloaded by 15 hours

##### 3. Dependency Blocking
**What it detects:** Parent tasks blocking subtasks

**Logic:**
```python
# Find incomplete parent tasks with subtasks
# Check if parent deadline is after subtask deadline
# Create conflict if parent blocks subtask
```

**Example:**
- Parent task: Due Jan 15
- Subtask: Due Jan 10
- Parent status: PENDING
- **Conflict:** Can't complete subtask before parent

**Process:**
1. Mark existing conflicts as resolved
2. Run all 3 detection algorithms
3. Create new Conflict records
4. Create notifications for new conflicts

**When to use:**
- After task creation
- After task update
- Manual conflict check endpoint
- Scheduled background job

---

### `optimizer_service.py`
**Purpose:** AI-powered schedule optimization

**Main Function:**

#### `generate_schedule_recommendation(db, user: User)`
**What it does:** Generate optimal task order

```python
recommendation = await generate_schedule_recommendation(db, user)
```

**Algorithm:**
1. Fetch all active tasks (PENDING + IN_PROGRESS)
2. Calculate urgency score for each task:
   ```python
   urgency_score = (
       deadline_proximity_weight * deadline_score +
       risk_level_weight * risk_score +
       priority_weight * priority_score
   )
   ```
3. Sort tasks by urgency score (descending)
4. Calculate suggested start dates
5. Create Recommendation record
6. Create notification

**Urgency Factors:**
- **Deadline proximity** (40%) - How soon is deadline?
- **Risk level** (35%) - ML prediction risk
- **Priority** (25%) - User-defined priority

**Returns:**
```python
{
    "recommended_order": [
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
    "reasoning": "Prioritized by deadline proximity and risk level"
}
```

**When to use:**
- User requests schedule recommendation
- After major task changes
- Weekly automated recommendations

---

## 🏗 Service Layer Architecture

```
┌─────────────────────────────────────┐
│   API Endpoints                     │
│   - Validate request                │
│   - Call service methods            │
│   - Return response                 │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Service Layer                     │
│   - Business logic                  │
│   - Data operations                 │
│   - Complex queries                 │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Database (SQLAlchemy)             │
│   - CRUD operations                 │
│   - Relationships                   │
└─────────────────────────────────────┘
```

---

## 🎯 Design Patterns

### Static Methods
```python
class TaskService:
    @staticmethod
    async def create(db, data, user):
        # No instance needed
        # Pure function
```

**Why static?**
- No state needed
- Easy to test
- Clear dependencies (db, data)

### Dependency Injection
```python
async def create_task(
    db: AsyncSession = Depends(get_db),  # ← Injected
    current_user: User = Depends(get_current_user)  # ← Injected
):
    task = await TaskService.create(db, data, current_user)
```

### Separation of Concerns
```python
# ❌ Bad - Logic in endpoint
@router.post("/tasks")
async def create_task(data, db, user):
    task = Task(...)
    db.add(task)
    await db.flush()
    # ... 50 lines of logic
    return task

# ✅ Good - Logic in service
@router.post("/tasks")
async def create_task(data, db, user):
    task = await TaskService.create(db, data, user)
    return task
```

---

## 🧪 Testing Services

Services are easy to test in isolation:

```python
# tests/test_services/test_task_service.py

async def test_create_task(db_session, test_user):
    data = TaskCreate(
        title="Test Task",
        deadline=datetime.now() + timedelta(days=7),
        estimated_effort_hours=5.0
    )
    
    task = await TaskService.create(db_session, data, test_user)
    
    assert task.id is not None
    assert task.title == "Test Task"
    assert task.user_id == test_user.id
```

---

## 🔄 Service Interaction Flow

### Example: Create Task with Prediction

```
1. API Endpoint receives request
   ↓
2. TaskService.create(db, data, user)
   - Creates Task record
   - Returns Task object
   ↓
3. TaskService.get_total_active_workload(db, user.id)
   - Calculates current workload
   ↓
4. TaskService.count_active_tasks(db, user.id)
   - Counts active tasks
   ↓
5. PredictionService.predict_and_save(db, task, user, workload, count)
   - Runs ML model
   - Saves Prediction
   ↓
6. run_conflict_detection(db, user)
   - Detects conflicts
   - Creates notifications
   ↓
7. Return response to client
```

---

## 🐛 Common Patterns

### Error Handling
```python
@staticmethod
async def get_by_id(db, task_id, user_id):
    result = await db.execute(
        select(Task).where(
            Task.id == task_id,
            Task.user_id == user_id  # ← Ownership check
        )
    )
    return result.scalar_one_or_none()  # Returns None if not found
```

### Pagination
```python
@staticmethod
async def get_all_for_user(db, user_id, skip=0, limit=50):
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id)
        .offset(skip)  # ← Skip first N
        .limit(limit)  # ← Max results
    )
    return result.scalars().all()
```

### Filtering
```python
query = select(Task).where(Task.user_id == user_id)

if status:
    query = query.where(Task.status == status)
if priority:
    query = query.where(Task.priority == priority)
if category:
    query = query.where(Task.category == category)

result = await db.execute(query)
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `app/models/models.py` | Database models |
| `app/schemas/` | Request/response validation |
| `app/api/v1/endpoints/` | API endpoints |
| `app/ml/model.py` | ML model |

---

**Pro Tip:** Keep services focused on a single responsibility. If a service gets too large, split it into multiple services!
