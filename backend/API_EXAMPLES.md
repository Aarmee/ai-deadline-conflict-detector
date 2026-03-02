# 📡 API Examples & Testing Guide

> Copy-paste ready examples for testing all endpoints

## 🔐 Authentication

### Register New User
```http
POST http://localhost:8000/api/v1/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "daily_hours_available": 8.0
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Login
```http
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

### Get Current User
```http
GET http://localhost:8000/api/v1/auth/me
Authorization: Bearer <your_access_token>
```

### Update Profile
```http
PATCH http://localhost:8000/api/v1/auth/me
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "full_name": "John Smith",
  "daily_hours_available": 6.0
}
```

---

## 📋 Task Management

### Create Task
```http
POST http://localhost:8000/api/v1/tasks
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "title": "Complete project report",
  "description": "Write and submit the final project report",
  "deadline": "2024-12-31T23:59:59",
  "estimated_effort_hours": 8.0,
  "priority": "HIGH",
  "category": "Academic"
}
```

**Response includes ML prediction:**
```json
{
  "task": {
    "id": "uuid-here",
    "title": "Complete project report",
    "status": "PENDING",
    "priority": "HIGH",
    "deadline": "2024-12-31T23:59:59",
    "estimated_effort_hours": 8.0,
    "latest_prediction": {
      "risk_level": "MEDIUM",
      "probability_score": 0.6543
    }
  },
  "prediction": {
    "risk_level": "MEDIUM",
    "probability_score": 0.6543,
    "predicted_at": "2024-03-02T10:30:00"
  }
}
```

### List All Tasks
```http
GET http://localhost:8000/api/v1/tasks
Authorization: Bearer <your_access_token>
```

**With filters:**
```http
GET http://localhost:8000/api/v1/tasks?status=PENDING&priority=HIGH&category=Academic
Authorization: Bearer <your_access_token>
```

### Get Single Task
```http
GET http://localhost:8000/api/v1/tasks/{task_id}
Authorization: Bearer <your_access_token>
```

### Update Task
```http
PATCH http://localhost:8000/api/v1/tasks/{task_id}
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "title": "Updated title",
  "deadline": "2024-12-25T23:59:59",
  "priority": "MEDIUM"
}
```

### Mark Task as Complete
```http
POST http://localhost:8000/api/v1/tasks/{task_id}/complete
Authorization: Bearer <your_access_token>
```

### Mark Task as In Progress
```http
POST http://localhost:8000/api/v1/tasks/{task_id}/start
Authorization: Bearer <your_access_token>
```

### Delete Task
```http
DELETE http://localhost:8000/api/v1/tasks/{task_id}
Authorization: Bearer <your_access_token>
```

### Create Subtask
```http
POST http://localhost:8000/api/v1/tasks/{parent_task_id}/subtasks
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "title": "Research phase",
  "deadline": "2024-12-20T23:59:59",
  "estimated_effort_hours": 3.0,
  "priority": "HIGH",
  "category": "Academic"
}
```

### List Subtasks
```http
GET http://localhost:8000/api/v1/tasks/{parent_task_id}/subtasks
Authorization: Bearer <your_access_token>
```

---

## 🤖 ML & Intelligence

### Get Dashboard Data
```http
GET http://localhost:8000/api/v1/predictions/dashboard
Authorization: Bearer <your_access_token>
```

**Response:**
```json
{
  "workload_score": 0.75,
  "risk_summary": {
    "high_risk_count": 2,
    "medium_risk_count": 5,
    "low_risk_count": 8
  },
  "upcoming_deadlines": [...],
  "active_conflicts": [...]
}
```

### Get Prediction History for Task
```http
GET http://localhost:8000/api/v1/predictions/task/{task_id}
Authorization: Bearer <your_access_token>
```

---

## ⚠️ Conflict Detection

### List Active Conflicts
```http
GET http://localhost:8000/api/v1/conflicts
Authorization: Bearer <your_access_token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "conflict_type": "DEADLINE_OVERLAP",
    "severity": "HIGH",
    "description": "Tasks 'Project Report' and 'Final Exam' have overlapping deadlines",
    "task_ids": ["uuid1", "uuid2"],
    "detected_at": "2024-03-02T10:00:00",
    "is_resolved": false
  }
]
```

### Run Conflict Detection Manually
```http
POST http://localhost:8000/api/v1/conflicts/detect
Authorization: Bearer <your_access_token>
```

### Resolve Conflict
```http
POST http://localhost:8000/api/v1/conflicts/{conflict_id}/resolve
Authorization: Bearer <your_access_token>
```

---

## 💡 Recommendations

### Get Schedule Recommendation
```http
GET http://localhost:8000/api/v1/recommendations/schedule
Authorization: Bearer <your_access_token>
```

**Response:**
```json
{
  "id": "uuid",
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

### Accept Recommendation
```http
POST http://localhost:8000/api/v1/recommendations/{recommendation_id}/accept
Authorization: Bearer <your_access_token>
```

---

## 📊 Analytics

### Get Productivity Stats
```http
GET http://localhost:8000/api/v1/analytics/productivity
Authorization: Bearer <your_access_token>
```

**Response:**
```json
{
  "completion_rate": 0.85,
  "total_tasks": 20,
  "completed_tasks": 17,
  "missed_deadlines": 3,
  "average_completion_time_hours": 6.5
}
```

### Get Workload Chart Data
```http
GET http://localhost:8000/api/v1/analytics/workload-chart
Authorization: Bearer <your_access_token>
```

### Get Analytics Summary
```http
GET http://localhost:8000/api/v1/analytics/summary
Authorization: Bearer <your_access_token>
```

---

## 🔔 Notifications

### List Notifications
```http
GET http://localhost:8000/api/v1/notifications
Authorization: Bearer <your_access_token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "CONFLICT_DETECTED",
    "title": "Schedule Conflict Detected",
    "message": "You have overlapping deadlines for 2 tasks",
    "is_read": false,
    "created_at": "2024-03-02T10:00:00"
  }
]
```

### Mark All Notifications as Read
```http
POST http://localhost:8000/api/v1/notifications/mark-all-read
Authorization: Bearer <your_access_token>
```

---

## 🏥 System Health

### Health Check
```http
GET http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "app": "Deadline Conflict Detection System",
  "version": "1.0.0",
  "ml_model_loaded": true
}
```

---

## 🧪 Testing with cURL

### Register (cURL)
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "full_name": "Test User",
    "daily_hours_available": 8.0
  }'
```

### Create Task (cURL)
```bash
curl -X POST "http://localhost:8000/api/v1/tasks" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "deadline": "2024-12-31T23:59:59",
    "estimated_effort_hours": 5.0,
    "priority": "HIGH",
    "category": "Work"
  }'
```

---

## 🐍 Testing with Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Register
response = requests.post(
    f"{BASE_URL}/api/v1/auth/register",
    json={
        "email": "test@example.com",
        "password": "TestPass123",
        "full_name": "Test User",
        "daily_hours_available": 8.0
    }
)
token = response.json()["access_token"]

# Create task
headers = {"Authorization": f"Bearer {token}"}
response = requests.post(
    f"{BASE_URL}/api/v1/tasks",
    headers=headers,
    json={
        "title": "Test Task",
        "deadline": "2024-12-31T23:59:59",
        "estimated_effort_hours": 5.0,
        "priority": "HIGH",
        "category": "Work"
    }
)
print(response.json())
```

---

## 📝 Notes

### Task Priority Values
- `LOW`
- `MEDIUM`
- `HIGH`

### Task Status Values
- `PENDING` - Not started
- `IN_PROGRESS` - Currently working on
- `COMPLETED` - Finished
- `MISSED` - Deadline passed without completion

### Conflict Types
- `DEADLINE_OVERLAP` - Multiple tasks with overlapping deadlines
- `WORKLOAD_OVERLOAD` - Total workload exceeds user capacity
- `DEPENDENCY_BLOCKING` - Parent task blocking subtasks

### Risk Levels
- `LOW` - Probability < 0.33
- `MEDIUM` - Probability 0.33 - 0.66
- `HIGH` - Probability > 0.66

---

## 🔗 Postman Collection

Import this into Postman:
1. Go to http://localhost:8000/openapi.json
2. Copy the JSON
3. Postman → Import → Raw Text → Paste → Import

---

**Happy Testing! 🚀**
