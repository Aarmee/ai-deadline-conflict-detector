# 📋 Schemas Directory

> Pydantic models for request/response validation and serialization

## 📁 Directory Structure

```
schemas/
├── auth.py           # Authentication schemas
├── tasks.py          # Task management schemas
└── __init__.py       # Package initialization
```

---

## 🎯 What Are Schemas?

**Schemas** (Pydantic models) define the shape and validation rules for:
- **Request bodies** - What data clients send to API
- **Response bodies** - What data API returns to clients
- **Data validation** - Automatic type checking and validation

**Key Difference from Models:**
- **Models** (`app/models/`) = Database tables (SQLAlchemy)
- **Schemas** (`app/schemas/`) = API contracts (Pydantic)

---

## 📄 Files Explained

### `auth.py`
**Purpose:** Authentication and user-related schemas

**Schemas:**

#### 1. `RegisterRequest`
**Purpose:** Validate user registration data

```python
class RegisterRequest(BaseModel):
    email: EmailStr                              # Valid email format
    password: str = Field(min_length=8, max_length=100)  # 8-100 chars
    full_name: str = Field(min_length=2, max_length=100)  # 2-100 chars
    daily_hours_available: float = Field(default=8.0, ge=1.0, le=24.0)  # 1-24 hours
    
    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
```

**Validation Rules:**
- Email must be valid format
- Password: 8-100 chars, 1 uppercase, 1 digit
- Full name: 2-100 chars
- Daily hours: 1.0-24.0

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "daily_hours_available": 8.0
}
```

#### 2. `LoginRequest`
**Purpose:** Validate login credentials

```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
```

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### 3. `TokenResponse`
**Purpose:** JWT token response format

```python
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```

**Example Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### 4. `RefreshRequest`
**Purpose:** Refresh token request

```python
class RefreshRequest(BaseModel):
    refresh_token: str
```

#### 5. `UserResponse`
**Purpose:** User profile response

```python
class UserResponse(UserBase):
    id: UUID
    completion_rate: float
    is_active: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}  # Allow ORM conversion
```

**Example Response:**
```json
{
  "id": "uuid-here",
  "email": "john@example.com",
  "full_name": "John Doe",
  "daily_hours_available": 8.0,
  "completion_rate": 0.85,
  "is_active": true,
  "created_at": "2024-03-01T10:00:00"
}
```

#### 6. `UserUpdate`
**Purpose:** Update user profile

```python
class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    daily_hours_available: Optional[float] = Field(default=None, ge=1.0, le=24.0)
```

**Example Request:**
```json
{
  "full_name": "John Smith",
  "daily_hours_available": 6.0
}
```

---

### `tasks.py`
**Purpose:** Task management schemas

**Schemas:**

#### 1. `TaskCreate`
**Purpose:** Create new task

```python
class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    deadline: datetime
    estimated_effort_hours: float = Field(gt=0, le=1000)
    priority: TaskPriority = TaskPriority.MEDIUM
    category: Optional[str] = Field(default=None, max_length=50)
    parent_task_id: Optional[UUID] = None
```

**Validation Rules:**
- Title: 1-200 chars (required)
- Description: 0-1000 chars (optional)
- Deadline: Valid datetime (required)
- Effort: > 0, ≤ 1000 hours (required)
- Priority: LOW/MEDIUM/HIGH (default: MEDIUM)
- Category: 0-50 chars (optional)
- Parent task ID: UUID (optional, for subtasks)

**Example Request:**
```json
{
  "title": "Complete project report",
  "description": "Write and submit final report",
  "deadline": "2024-12-31T23:59:59",
  "estimated_effort_hours": 8.0,
  "priority": "HIGH",
  "category": "Academic"
}
```

#### 2. `TaskUpdate`
**Purpose:** Update existing task (all fields optional)

```python
class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    deadline: Optional[datetime] = None
    estimated_effort_hours: Optional[float] = Field(default=None, gt=0, le=1000)
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    category: Optional[str] = Field(default=None, max_length=50)
```

**Example Request:**
```json
{
  "title": "Updated title",
  "priority": "MEDIUM",
  "deadline": "2024-12-25T23:59:59"
}
```

#### 3. `TaskResponse`
**Purpose:** Task response with prediction

```python
class TaskResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str]
    deadline: datetime
    estimated_effort_hours: float
    priority: TaskPriority
    status: TaskStatus
    category: Optional[str]
    parent_task_id: Optional[UUID]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    subtask_count: int = 0
    latest_prediction: Optional[PredictionSummary] = None
    
    model_config = {"from_attributes": True}
```

**Example Response:**
```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "title": "Complete project report",
  "description": "Write and submit final report",
  "deadline": "2024-12-31T23:59:59",
  "estimated_effort_hours": 8.0,
  "priority": "HIGH",
  "status": "PENDING",
  "category": "Academic",
  "parent_task_id": null,
  "completed_at": null,
  "created_at": "2024-03-01T10:00:00",
  "updated_at": "2024-03-01T10:00:00",
  "subtask_count": 2,
  "latest_prediction": {
    "risk_level": "MEDIUM",
    "probability_score": 0.6543,
    "predicted_at": "2024-03-01T10:00:00"
  }
}
```

#### 4. `TaskCreateResponse`
**Purpose:** Response after creating task (includes prediction)

```python
class TaskCreateResponse(BaseModel):
    task: TaskResponse
    prediction: Optional[PredictionSummary]
```

**Example Response:**
```json
{
  "task": { /* TaskResponse */ },
  "prediction": {
    "risk_level": "MEDIUM",
    "probability_score": 0.6543,
    "predicted_at": "2024-03-01T10:00:00"
  }
}
```

#### 5. `PredictionSummary`
**Purpose:** ML prediction summary

```python
class PredictionSummary(BaseModel):
    risk_level: str
    probability_score: float
    predicted_at: datetime
    
    model_config = {"from_attributes": True}
```

#### 6. `SubtaskResponse`
**Purpose:** Simplified subtask response

```python
class SubtaskResponse(BaseModel):
    id: UUID
    title: str
    deadline: datetime
    status: TaskStatus
    priority: TaskPriority
    
    model_config = {"from_attributes": True}
```

#### 7. `PasswordChangeRequest`
**Purpose:** Change password

```python
class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=100)
    
    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        # Same validation as RegisterRequest
```

---

## 🔄 Schema Conversion Flow

### Request → Database
```python
1. Client sends JSON
   ↓
2. Pydantic validates (TaskCreate schema)
   ↓
3. Convert to SQLAlchemy model (Task)
   ↓
4. Save to database
```

### Database → Response
```python
1. Query database (SQLAlchemy Task model)
   ↓
2. Convert to Pydantic (TaskResponse schema)
   ↓
3. Serialize to JSON
   ↓
4. Send to client
```

---

## ✅ Validation Features

### Type Validation
```python
email: EmailStr  # Must be valid email
deadline: datetime  # Must be valid datetime
priority: TaskPriority  # Must be LOW/MEDIUM/HIGH
```

### Range Validation
```python
password: str = Field(min_length=8, max_length=100)  # Length constraints
estimated_effort_hours: float = Field(gt=0, le=1000)  # Value constraints
daily_hours_available: float = Field(ge=1.0, le=24.0)  # Range constraints
```

### Custom Validation
```python
@field_validator("password")
@classmethod
def password_strength(cls, v):
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain at least one uppercase letter")
    return v
```

### Optional Fields
```python
description: Optional[str] = None  # Can be null
category: Optional[str] = Field(default=None)  # Can be omitted
```

---

## 🎯 Common Patterns

### Base Schema + Extensions
```python
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    daily_hours_available: float

class UserResponse(UserBase):
    id: UUID
    completion_rate: float
    created_at: datetime
```

### ORM Conversion
```python
model_config = {"from_attributes": True}  # Allow conversion from SQLAlchemy models
```

### Nested Schemas
```python
class TaskResponse(BaseModel):
    # ... task fields
    latest_prediction: Optional[PredictionSummary] = None  # Nested schema
```

---

## 🐛 Common Validation Errors

### 422 Unprocessable Entity
**Cause:** Request doesn't match schema

**Examples:**

#### Missing Required Field
```json
// Missing "title"
{
  "deadline": "2024-12-31T23:59:59",
  "estimated_effort_hours": 8.0
}
```
**Error:** `field required`

#### Wrong Type
```json
{
  "title": "Task",
  "deadline": "not-a-datetime",  // Should be ISO format
  "estimated_effort_hours": "eight"  // Should be number
}
```
**Error:** `value is not a valid datetime` / `value is not a valid float`

#### Validation Failed
```json
{
  "email": "john@example.com",
  "password": "short",  // Too short (< 8 chars)
  "full_name": "John Doe"
}
```
**Error:** `ensure this value has at least 8 characters`

#### Out of Range
```json
{
  "title": "Task",
  "deadline": "2024-12-31T23:59:59",
  "estimated_effort_hours": -5  // Must be > 0
}
```
**Error:** `ensure this value is greater than 0`

---

## 🛠 Adding New Schema

### Step 1: Define Schema
```python
# app/schemas/tasks.py

class TaskArchiveRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)
    archive_subtasks: bool = True
```

### Step 2: Use in Endpoint
```python
# app/api/v1/endpoints/tasks.py

@router.post("/tasks/{task_id}/archive")
async def archive_task(
    task_id: UUID,
    data: TaskArchiveRequest,  # ← Validates request body
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # data.reason and data.archive_subtasks are validated
    ...
```

### Step 3: Test
```bash
POST /api/v1/tasks/{id}/archive
{
  "reason": "Project completed",
  "archive_subtasks": true
}
```

---

## 📊 Schema vs Model Comparison

| Aspect | Schema (Pydantic) | Model (SQLAlchemy) |
|--------|-------------------|-------------------|
| **Purpose** | API validation | Database structure |
| **Location** | `app/schemas/` | `app/models/` |
| **Used for** | Request/Response | Database queries |
| **Validation** | Automatic | Manual |
| **Serialization** | JSON ↔ Python | Python ↔ Database |
| **Example** | `TaskCreate` | `Task` |

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `app/models/models.py` | Database models |
| `app/api/v1/endpoints/` | Endpoints using schemas |
| `app/services/` | Business logic |

---

## 📚 Pydantic Documentation

- [Pydantic Models](https://docs.pydantic.dev/latest/concepts/models/)
- [Field Validation](https://docs.pydantic.dev/latest/concepts/validators/)
- [JSON Schema](https://docs.pydantic.dev/latest/concepts/json_schema/)

---

**Pro Tip:** Use `response_model` in FastAPI endpoints to automatically validate and serialize responses!

```python
@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(...):
    # FastAPI automatically validates response matches TaskResponse
```
