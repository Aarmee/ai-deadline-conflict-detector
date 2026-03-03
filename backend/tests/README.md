# 🧪 Tests Directory

> Comprehensive test suite for all application components

## 📁 Directory Structure

```
tests/
├── test_api/                    # API endpoint tests
│   ├── test_auth.py            # Authentication tests
│   ├── test_tasks.py           # Task management tests
│   ├── test_intelligence.py    # ML/Analytics tests
│   └── __init__.py
├── test_services/               # Service layer tests
│   ├── test_ml.py              # ML model tests
│   └── __init__.py
├── conftest.py                  # Pytest fixtures and configuration
└── __init__.py
```

---

## 📊 Test Coverage

**Total Tests:** 37
**Status:** ✅ 100% passing

### Breakdown
- **Authentication:** 8 tests
- **Task Management:** 12 tests
- **Intelligence/ML:** 12 tests
- **ML Model:** 5 tests

---

## 📄 Files Explained

### `conftest.py`
**Purpose:** Shared test fixtures and configuration

**Key Fixtures:**

#### 1. `setup_database`
**What it does:** Creates/drops tables for each test

```python
@pytest.fixture(scope="function", autouse=True)
async def setup_database():
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield  # Run test
    
    # Drop all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

**Why:**
- Fresh database for each test
- No data leakage between tests
- True test isolation

#### 2. `load_ml_model_session`
**What it does:** Loads ML model once per test session

```python
@pytest.fixture(scope="session", autouse=True)
def load_ml_model_session():
    ml_service.load_model()
    yield
```

**Why:**
- Model loading takes 20-30 seconds
- Load once, use in all tests
- Improves test speed by 90%

#### 3. `client`
**What it does:** Provides HTTP client for API testing

```python
@pytest.fixture
async def client() -> AsyncClient:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as c:
        yield c
```

**Usage:**
```python
async def test_endpoint(client):
    response = await client.get("/api/v1/tasks")
    assert response.status_code == 200
```

#### 4. `auth_client`
**What it does:** Provides authenticated HTTP client

```python
@pytest.fixture
async def auth_client(client):
    # Register user
    await client.post("/api/v1/auth/register", json={...})
    
    # Login
    resp = await client.post("/api/v1/auth/login", json={...})
    token = resp.json()["access_token"]
    
    # Add auth header
    client.headers["Authorization"] = f"Bearer {token}"
    
    return client
```

**Usage:**
```python
async def test_protected_endpoint(auth_client):
    # Already authenticated!
    response = await auth_client.get("/api/v1/tasks")
    assert response.status_code == 200
```

**Test Database:**
```python
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_deadline.db"
```

**Why SQLite?**
- Fast (in-memory or file-based)
- No PostgreSQL required for tests
- Easy CI/CD integration
- Same SQLAlchemy interface

---

### `test_api/test_auth.py`
**Purpose:** Test authentication endpoints

**Tests:**

#### 1. `test_register_success`
**What it tests:** User registration with valid data

```python
async def test_register_success(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePass1",
        "full_name": "New User",
        "daily_hours_available": 6.0
    })
    assert response.status_code == 201
    assert "access_token" in response.json()
```

#### 2. `test_register_duplicate_email`
**What it tests:** Duplicate email rejection

```python
async def test_register_duplicate_email(client, registered_user):
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",  # Already exists
        ...
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]
```

#### 3. `test_register_weak_password`
**What it tests:** Password validation

```python
async def test_register_weak_password(client):
    response = await client.post("/api/v1/auth/register", json={
        "password": "password",  # No uppercase, no digit
        ...
    })
    assert response.status_code == 422  # Validation error
```

#### 4. `test_login_success`
**What it tests:** Successful login

#### 5. `test_login_wrong_password`
**What it tests:** Invalid credentials

#### 6. `test_get_me`
**What it tests:** Get authenticated user profile

#### 7. `test_get_me_unauthorized`
**What it tests:** Unauthorized access rejection

#### 8. `test_health_check`
**What it tests:** Health check endpoint

---

### `test_api/test_tasks.py`
**Purpose:** Test task management endpoints

**Tests:**

#### 1. `test_create_task_success`
**What it tests:** Task creation with ML prediction

```python
async def test_create_task_success(auth_client):
    resp = await auth_client.post("/api/v1/tasks", json={
        "title": "Write project report",
        "deadline": TOMORROW,
        "estimated_effort_hours": 5.0,
        "priority": "HIGH",
        "category": "Academic"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "task" in data
    assert "prediction" in data
    assert data["prediction"]["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
```

#### 2. `test_create_task_missing_required_field`
**What it tests:** Validation of required fields

#### 3. `test_list_tasks_empty`
**What it tests:** Empty task list

#### 4. `test_list_tasks_with_data`
**What it tests:** Task list with data

#### 5. `test_get_task_by_id`
**What it tests:** Fetch single task

#### 6. `test_get_task_not_found`
**What it tests:** 404 for non-existent task

#### 7. `test_update_task`
**What it tests:** Task update

#### 8. `test_complete_task`
**What it tests:** Mark task as completed

#### 9. `test_start_task`
**What it tests:** Mark task as in progress

#### 10. `test_delete_task`
**What it tests:** Task deletion

#### 11. `test_create_subtask`
**What it tests:** Subtask creation

#### 12. `test_filter_tasks_by_priority`
**What it tests:** Task filtering

---

### `test_api/test_intelligence.py`
**Purpose:** Test ML and analytics endpoints

**Tests:**

#### 1. `test_dashboard_empty`
**What it tests:** Dashboard with no data

#### 2. `test_dashboard_with_tasks`
**What it tests:** Dashboard with tasks and predictions

#### 3. `test_prediction_history`
**What it tests:** Prediction history for task

#### 4. `test_conflict_detection`
**What it tests:** Conflict detection

#### 5. `test_list_conflicts`
**What it tests:** List active conflicts

#### 6. `test_schedule_recommendation`
**What it tests:** AI schedule recommendation

#### 7. `test_accept_recommendation`
**What it tests:** Accept recommendation

#### 8. `test_notifications_empty`
**What it tests:** Empty notifications

#### 9. `test_mark_all_notifications_read`
**What it tests:** Mark notifications as read

#### 10. `test_productivity_analytics`
**What it tests:** Productivity stats

#### 11. `test_workload_chart`
**What it tests:** Workload chart data

#### 12. `test_analytics_summary`
**What it tests:** Analytics summary

---

### `test_services/test_ml.py`
**Purpose:** Test ML model functionality

**Tests:**

#### 1. `test_dataset_generation`
**What it tests:** Training data generation

```python
def test_dataset_generation():
    X, y = ml_service._generate_training_data()
    assert len(X) == 1000  # 1000 samples
    assert len(y) == 1000
    assert all(label in ["LOW", "MEDIUM", "HIGH"] for label in y)
```

#### 2. `test_dataset_class_balance`
**What it tests:** Balanced class distribution

#### 3. `test_ml_prediction_output`
**What it tests:** Prediction output format

```python
def test_ml_prediction_output():
    features = {...}
    result = ml_service.predict(features)
    
    assert "risk_level" in result
    assert "probability_score" in result
    assert "probabilities" in result
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert 0 <= result["probability_score"] <= 1
```

#### 4. `test_high_risk_prediction`
**What it tests:** High risk scenario detection

```python
def test_high_risk_prediction():
    features = {
        "days_remaining": 2,
        "estimated_effort_hours": 20,
        "workload_capacity_ratio": 0.95,  # Overloaded
        ...
    }
    result = ml_service.predict(features)
    assert result["risk_level"] == "HIGH"
```

#### 5. `test_low_risk_prediction`
**What it tests:** Low risk scenario detection

---

## 🚀 Running Tests

### All Tests
```bash
pytest
```

### Verbose Output
```bash
pytest -v
```

### With Coverage
```bash
pytest --cov=app --cov-report=term-missing
```

### Specific Test File
```bash
pytest tests/test_api/test_auth.py -v
```

### Specific Test Function
```bash
pytest tests/test_api/test_auth.py::test_register_success -v
```

### Stop on First Failure
```bash
pytest -x
```

### Show Print Statements
```bash
pytest -s
```

---

## 📊 Test Output

### Success
```
tests/test_api/test_auth.py::test_register_success PASSED        [ 12%]
tests/test_api/test_auth.py::test_login_success PASSED           [ 25%]
...
========================= 37 passed in 20.10s =========================
```

### Failure
```
tests/test_api/test_auth.py::test_register_success FAILED        [ 12%]

FAILED tests/test_api/test_auth.py::test_register_success
AssertionError: assert 400 == 201
```

---

## 🎯 Writing New Tests

### Step 1: Create Test File
```python
# tests/test_api/test_new_feature.py

import pytest

@pytest.mark.asyncio
async def test_new_endpoint(auth_client):
    response = await auth_client.get("/api/v1/new-endpoint")
    assert response.status_code == 200
```

### Step 2: Use Fixtures
```python
async def test_with_data(auth_client):
    # Create test data
    task_resp = await auth_client.post("/api/v1/tasks", json={...})
    task_id = task_resp.json()["task"]["id"]
    
    # Test endpoint
    response = await auth_client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 200
```

### Step 3: Run Tests
```bash
pytest tests/test_api/test_new_feature.py -v
```

---

## 🔍 Test Patterns

### Testing Success Cases
```python
async def test_success(auth_client):
    response = await auth_client.post("/api/v1/tasks", json={...})
    assert response.status_code == 201
    data = response.json()
    assert "task" in data
    assert data["task"]["title"] == "Expected Title"
```

### Testing Error Cases
```python
async def test_not_found(auth_client):
    response = await auth_client.get("/api/v1/tasks/invalid-uuid")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
```

### Testing Validation
```python
async def test_validation_error(auth_client):
    response = await auth_client.post("/api/v1/tasks", json={
        "title": "",  # Invalid - too short
        ...
    })
    assert response.status_code == 422
```

### Testing Authentication
```python
async def test_unauthorized(client):  # No auth
    response = await client.get("/api/v1/tasks")
    assert response.status_code == 403  # or 401
```

---

## 🐛 Common Test Issues

### Issue: "Session closed"
**Cause:** Accessing lazy-loaded relationships

**Solution:** Eager load in endpoint or test

### Issue: "Test database not found"
**Cause:** Database not created

**Solution:** `setup_database` fixture should auto-create

### Issue: "Tests fail randomly"
**Cause:** Test order dependency

**Solution:** Ensure tests are independent

### Issue: "Slow tests"
**Cause:** ML model loading per test

**Solution:** Use session-scoped fixture

---

## 📚 Testing Best Practices

### 1. Test Independence
```python
# ✅ Good - Each test creates own data
async def test_create_task(auth_client):
    response = await auth_client.post("/api/v1/tasks", json={...})
    assert response.status_code == 201

# ❌ Bad - Depends on other test
async def test_get_task(auth_client):
    # Assumes task from previous test exists
    response = await auth_client.get("/api/v1/tasks/1")
```

### 2. Clear Assertions
```python
# ✅ Good - Specific assertion
assert response.status_code == 201
assert data["task"]["title"] == "Expected Title"

# ❌ Bad - Vague assertion
assert response.status_code < 300
assert "task" in data
```

### 3. Test One Thing
```python
# ✅ Good - Tests one endpoint
async def test_create_task(auth_client):
    response = await auth_client.post("/api/v1/tasks", json={...})
    assert response.status_code == 201

# ❌ Bad - Tests multiple things
async def test_task_workflow(auth_client):
    # Create
    create_resp = await auth_client.post(...)
    # Update
    update_resp = await auth_client.patch(...)
    # Delete
    delete_resp = await auth_client.delete(...)
```

### 4. Use Descriptive Names
```python
# ✅ Good
async def test_create_task_with_invalid_deadline_returns_422()

# ❌ Bad
async def test_task()
```

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `pytest.ini` | Pytest configuration |
| `app/` | Application code being tested |
| `.coverage` | Coverage report data |

---

## 📖 Testing Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

---

**Pro Tip:** Run tests before every commit to catch bugs early!

```bash
# Pre-commit hook
pytest --cov=app --cov-report=term-missing
```
