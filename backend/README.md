# 🎯 AI-Driven Smart Deadline Conflict Detection System - Backend

> FastAPI + PostgreSQL + SQLAlchemy + Scikit-learn ML Pipeline

A production-ready REST API that uses machine learning to predict task deadline risks, detect scheduling conflicts, and provide intelligent task recommendations.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Architecture Overview](#-architecture-overview)
- [API Endpoints](#-api-endpoints)
- [Troubleshooting](#-troubleshooting)
- [Team Guide](#-team-guide)

---

## ✨ Features

### Core Functionality
- **JWT Authentication** - Secure user registration, login with access/refresh tokens
- **Task Management** - Full CRUD operations with subtask support
- **ML Risk Prediction** - Random Forest model predicts deadline miss probability (LOW/MEDIUM/HIGH)
- **Conflict Detection** - Identifies 3 types of conflicts:
  - Deadline Overlap (tasks with overlapping deadlines)
  - Workload Overload (capacity exceeded)
  - Dependency Blocking (parent tasks blocking subtasks)
- **Schedule Optimizer** - AI-powered task prioritization with urgency scoring
- **Analytics Dashboard** - Real-time workload metrics, productivity stats, risk summaries
- **Notifications System** - Automated alerts for conflicts and recommendations

### Technical Features
- Async/await throughout (SQLAlchemy async, FastAPI async)
- Database migrations with Alembic
- Comprehensive test suite (37 tests, 100% passing)
- OpenAPI/Swagger documentation
- CORS support for frontend integration
- Secure password hashing with bcrypt
- Production-ready error handling

---

## 🛠 Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | FastAPI | 0.111.0 |
| **Server** | Uvicorn | 0.29.0 |
| **Database** | PostgreSQL | 14+ |
| **ORM** | SQLAlchemy (async) | 2.0.30 |
| **Migrations** | Alembic | 1.13.1 |
| **Auth** | JWT (python-jose) | 3.3.0 |
| **Password** | Bcrypt (passlib) | 1.7.4 |
| **ML** | Scikit-learn | 1.6.1 |
| **Data** | Pandas, NumPy | 2.2.2, 2.2.4 |
| **Validation** | Pydantic | 2.7.1 |
| **Testing** | Pytest, Pytest-asyncio | 8.2.0, 0.23.6 |

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py              # Authentication endpoints
│   │       │   ├── tasks.py             # Task CRUD endpoints
│   │       │   └── intelligence.py      # ML/Analytics endpoints
│   │       └── router.py                # API router aggregator
│   ├── core/
│   │   ├── config.py                    # Environment config
│   │   └── security.py                  # JWT + password hashing
│   ├── db/
│   │   └── session.py                   # Database session management
│   ├── models/
│   │   └── models.py                    # SQLAlchemy models (User, Task, etc.)
│   ├── schemas/
│   │   ├── auth.py                      # Pydantic schemas for auth
│   │   └── tasks.py                     # Pydantic schemas for tasks
│   ├── services/
│   │   ├── user_service.py              # User business logic
│   │   ├── task_service.py              # Task business logic
│   │   ├── prediction_service.py        # ML prediction logic
│   │   ├── conflict_service.py          # Conflict detection engine
│   │   └── optimizer_service.py         # Schedule optimization
│   ├── ml/
│   │   ├── model.py                     # ML model training & inference
│   │   └── models/
│   │       └── deadline_risk_model.pkl  # Trained Random Forest model
│   └── main.py                          # FastAPI app entry point
├── alembic/
│   ├── versions/
│   │   └── 001_initial.py               # Initial database schema
│   └── env.py                           # Alembic configuration
├── tests/
│   ├── test_api/
│   │   ├── test_auth.py                 # Auth endpoint tests
│   │   ├── test_tasks.py                # Task endpoint tests
│   │   └── test_intelligence.py         # ML/Analytics tests
│   ├── test_services/
│   │   └── test_ml.py                   # ML model tests
│   └── conftest.py                      # Pytest fixtures
├── .env                                 # Environment variables (create this)
├── .gitignore                           # Git ignore rules
├── alembic.ini                          # Alembic config
├── pytest.ini                           # Pytest config
├── requirements.txt                     # Python dependencies
└── README.md                            # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Recommended
- **VS Code** - [Download](https://code.visualstudio.com/)
- **Postman** or **Insomnia** - For API testing (optional, Swagger UI included)

### VS Code Extensions (Optional but Recommended)
- Python (Microsoft)
- Pylance
- REST Client
- GitLens

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd backend
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This takes 2-3 minutes on first install.

### 4. Create PostgreSQL Database

Open **pgAdmin** or **psql** and run:

```sql
CREATE DATABASE deadline_db;
```

Or via command line:

```bash
# Windows (PowerShell)
psql -U postgres -c "CREATE DATABASE deadline_db;"

# macOS/Linux
createdb deadline_db
```

### 5. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Copy example and edit
cp .env.example .env  # If example exists
# OR create new file
touch .env  # macOS/Linux
type nul > .env  # Windows
```

Add the following to `.env`:

```env
# Application
APP_NAME=Deadline Conflict Detection System
APP_VERSION=1.0.0
DEBUG=False

# Database (PostgreSQL)
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/deadline_db

# JWT Security
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS (Frontend URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# ML Model
ML_MODEL_PATH=app/ml/models/deadline_risk_model.pkl
ML_MODEL_VERSION=rf_v1.0
```

**Important:** Replace `your_password` with your PostgreSQL password!

### 6. Run Database Migrations

```bash
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial, Initial schema
```

This creates all tables: `users`, `tasks`, `predictions`, `conflicts`, `recommendations`, `notifications`.

### 7. Start the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**First startup** trains the ML model (20-30 seconds):
```
Starting Deadline Conflict Detection System v1.0.0
Model not found. Training new model...
✓ ML Model trained successfully
  - Accuracy: 0.8742
  - Precision: 0.8654
  - Recall: 0.8821
✓ ML Model loaded from: app/ml/models/deadline_risk_model.pkl
ML model ready.
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Subsequent startups** load the existing model (instant):
```
✓ ML Model loaded from: app/ml/models/deadline_risk_model.pkl
ML model ready.
```

### 8. Verify Installation

Open your browser:
- **API Docs (Swagger):** http://localhost:8000/docs
- **API Docs (ReDoc):** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

Expected health check response:
```json
{
  "status": "healthy",
  "app": "Deadline Conflict Detection System",
  "version": "1.0.0",
  "ml_model_loaded": true
}
```

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `SECRET_KEY` | ✅ Yes | - | JWT signing key (min 32 chars) |
| `ALGORITHM` | No | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | 60 | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | 7 | Refresh token lifetime |
| `CORS_ORIGINS` | No | http://localhost:3000 | Allowed frontend origins (comma-separated) |
| `ML_MODEL_PATH` | No | app/ml/models/deadline_risk_model.pkl | ML model file path |
| `DEBUG` | No | False | Enable debug mode |

### Generating a Secure SECRET_KEY

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32
```

---

## 💾 Database Setup

### PostgreSQL Connection Formats

```env
# Local PostgreSQL
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/deadline_db

# Docker PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/deadline_db

# Cloud PostgreSQL (e.g., Supabase, Neon)
DATABASE_URL=postgresql+asyncpg://user:pass@host.region.provider.com:5432/dbname
```

### Database Schema

The system uses 6 main tables:

1. **users** - User accounts with authentication
2. **tasks** - Tasks with deadlines, priorities, subtasks
3. **predictions** - ML risk predictions for tasks
4. **conflicts** - Detected scheduling conflicts
5. **recommendations** - AI-generated schedule suggestions
6. **notifications** - User notifications

### Migration Commands

```bash
# Apply all migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# Create new migration (after model changes)
alembic revision --autogenerate -m "description"
```

---

## 🏃 Running the Application

### Development Mode (with auto-reload)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Different Ports

```bash
# Port 8001
uvicorn app.main:app --reload --port 8001

# Port 5000
uvicorn app.main:app --reload --port 5000
```

### Docker (Optional)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t deadline-backend .
docker run -p 8000:8000 --env-file .env deadline-backend
```

---

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI:** http://localhost:8000/docs
  - Interactive API testing
  - Try endpoints directly in browser
  - See request/response schemas

- **ReDoc:** http://localhost:8000/redoc
  - Clean, readable documentation
  - Better for sharing with team

### Authentication Flow

1. **Register** a new account:
   ```bash
   POST /api/v1/auth/register
   {
     "email": "user@example.com",
     "password": "SecurePass123",
     "full_name": "John Doe",
     "daily_hours_available": 8.0
   }
   ```

2. **Copy** the `access_token` from response

3. **Authorize** in Swagger:
   - Click green "Authorize" button (top right)
   - Paste token in format: `Bearer <your_token>`
   - Click "Authorize"

4. **Test** any protected endpoint

### Password Requirements

- Minimum 8 characters
- Maximum 100 characters
- At least 1 uppercase letter
- At least 1 digit

---

## 🧪 Testing

### Run All Tests

```bash
# Basic test run
pytest

# Verbose output
pytest -v

# With coverage report
pytest --cov=app --cov-report=term-missing

# Specific test file
pytest tests/test_api/test_auth.py -v

# Specific test function
pytest tests/test_api/test_auth.py::test_register_success -v
```

### Test Results

```
37 tests passing (100% success rate)
- 8 authentication tests
- 12 task management tests
- 12 intelligence/ML tests
- 5 ML model tests
```

### Test Database

Tests use **SQLite in-memory** database - no PostgreSQL required for testing.

Configuration in `tests/conftest.py`:
```python
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_deadline.db"
```

---

## 🏗 Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────┐
│   API Layer (FastAPI Routes)       │  ← HTTP requests/responses
├─────────────────────────────────────┤
│   Service Layer (Business Logic)   │  ← Core functionality
├─────────────────────────────────────┤
│   Data Layer (SQLAlchemy Models)   │  ← Database operations
├─────────────────────────────────────┤
│   ML Layer (Scikit-learn)          │  ← Predictions & analytics
└─────────────────────────────────────┘
```

### Request Flow

```
1. Client Request → FastAPI Endpoint
2. Endpoint → Pydantic Schema Validation
3. Endpoint → Service Layer (business logic)
4. Service → Database (SQLAlchemy async)
5. Service → ML Model (if needed)
6. Response ← Pydantic Schema Serialization
7. Client ← JSON Response
```

### ML Pipeline

```
Task Created → Extract Features → ML Prediction → Save to DB
                                       ↓
                              Risk Level (LOW/MEDIUM/HIGH)
                              Probability Score (0-1)
```

### Conflict Detection Engine

Runs automatically after task creation/update:

1. **Deadline Overlap** - Checks for tasks with overlapping deadlines
2. **Workload Overload** - Compares total workload vs. user capacity
3. **Dependency Blocking** - Identifies parent tasks blocking subtasks

---

## 🔌 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Create new account | No |
| POST | `/login` | Login, get JWT tokens | No |
| POST | `/refresh` | Refresh access token | No |
| GET | `/me` | Get current user profile | Yes |
| PATCH | `/me` | Update profile | Yes |
| POST | `/change-password` | Change password | Yes |
| DELETE | `/me` | Deactivate account | Yes |

### Tasks (`/api/v1/tasks`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List all tasks (with filters) | Yes |
| POST | `/` | Create task + ML prediction | Yes |
| GET | `/{task_id}` | Get single task | Yes |
| PATCH | `/{task_id}` | Update task | Yes |
| DELETE | `/{task_id}` | Delete task | Yes |
| POST | `/{task_id}/complete` | Mark as completed | Yes |
| POST | `/{task_id}/start` | Mark as in progress | Yes |
| GET | `/{task_id}/subtasks` | List subtasks | Yes |
| POST | `/{task_id}/subtasks` | Create subtask | Yes |

### Predictions (`/api/v1/predictions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Full dashboard data | Yes |
| GET | `/task/{task_id}` | Prediction history for task | Yes |

### Conflicts (`/api/v1/conflicts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List active conflicts | Yes |
| POST | `/detect` | Run conflict detection | Yes |
| POST | `/{conflict_id}/resolve` | Mark conflict resolved | Yes |

### Recommendations (`/api/v1/recommendations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/schedule` | Get AI schedule recommendation | Yes |
| POST | `/{rec_id}/accept` | Accept recommendation | Yes |

### Analytics (`/api/v1/analytics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/productivity` | Completion rate stats | Yes |
| GET | `/workload-chart` | Workload over time | Yes |
| GET | `/summary` | Overall analytics summary | Yes |

### Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List notifications | Yes |
| POST | `/mark-all-read` | Mark all as read | Yes |

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Connection refused" on startup

**Problem:** PostgreSQL is not running

**Solution:**
```bash
# Windows - Check Services
services.msc → PostgreSQL → Start

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

#### 2. "Password authentication failed"

**Problem:** Wrong database credentials in `.env`

**Solution:**
- Check your PostgreSQL username/password
- Update `DATABASE_URL` in `.env`
- Restart the server

#### 3. "Module not found" errors

**Problem:** Virtual environment not activated or dependencies not installed

**Solution:**
```bash
# Activate venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Reinstall dependencies
pip install -r requirements.txt
```

#### 4. "alembic: command not found"

**Problem:** Alembic not installed or venv not activated

**Solution:**
```bash
# Activate venv first
venv\Scripts\activate

# Install alembic
pip install alembic
```

#### 5. Port 8000 already in use

**Problem:** Another process using port 8000

**Solution:**
```bash
# Use different port
uvicorn app.main:app --reload --port 8001

# Or kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or kill process (macOS/Linux)
lsof -ti:8000 | xargs kill -9
```

#### 6. ML model training fails

**Problem:** Insufficient data or scikit-learn version mismatch

**Solution:**
- Check scikit-learn version: `pip show scikit-learn`
- Reinstall: `pip install --upgrade scikit-learn==1.6.1`
- Delete old model: `rm app/ml/models/deadline_risk_model.pkl`
- Restart server to retrain

#### 7. Tests failing

**Problem:** Database state or async issues

**Solution:**
```bash
# Clean test databases
rm test.db test_deadline.db

# Run tests with verbose output
pytest -v --tb=short

# Run specific failing test
pytest tests/test_api/test_auth.py::test_register_success -v
```

---

## 👥 Team Guide

### For Backend Developers

**Your responsibilities:**
- API endpoint development (`app/api/v1/endpoints/`)
- Database models (`app/models/models.py`)
- Business logic services (`app/services/`)
- Authentication & security (`app/core/security.py`)
- Database migrations (`alembic/versions/`)

**Key files to know:**
- `app/main.py` - App entry point, CORS, startup
- `app/core/config.py` - Environment configuration
- `app/models/models.py` - All database tables
- `app/services/task_service.py` - Task CRUD logic

### For ML Engineers

**Your responsibilities:**
- ML model training & inference (`app/ml/model.py`)
- Feature engineering (`extract_features()`)
- Conflict detection logic (`app/services/conflict_service.py`)
- Schedule optimization (`app/services/optimizer_service.py`)
- Analytics endpoints (`app/api/v1/endpoints/intelligence.py`)

**Key files to know:**
- `app/ml/model.py` - ML pipeline
- `app/services/prediction_service.py` - Prediction logic
- `app/services/conflict_service.py` - Conflict detection
- `tests/test_services/test_ml.py` - ML tests

### For Frontend Developers

**What you need:**
- Base URL: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Authentication: JWT Bearer token in `Authorization` header
- CORS: Already configured for `localhost:3000` and `localhost:5173`

**Authentication flow:**
1. POST `/api/v1/auth/register` or `/login`
2. Store `access_token` and `refresh_token`
3. Add header: `Authorization: Bearer <access_token>`
4. Refresh token when access token expires (60 min)

### For QA/Testers

**Testing endpoints:**
- Use Swagger UI: http://localhost:8000/docs
- Or Postman collection (create from OpenAPI spec)
- Run automated tests: `pytest tests/ -v`

**Test accounts:**
- Create via `/api/v1/auth/register`
- Password must have: 8+ chars, 1 uppercase, 1 digit

---

## 📝 Development Workflow

### Adding a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-endpoint
   ```

2. **Add database model** (if needed)
   ```python
   # app/models/models.py
   class NewModel(Base):
       __tablename__ = "new_table"
       # ... fields
   ```

3. **Create migration**
   ```bash
   alembic revision --autogenerate -m "Add new_table"
   alembic upgrade head
   ```

4. **Add Pydantic schemas**
   ```python
   # app/schemas/new_schema.py
   class NewSchema(BaseModel):
       # ... fields
   ```

5. **Create service layer**
   ```python
   # app/services/new_service.py
   class NewService:
       @staticmethod
       async def create(...):
           # ... logic
   ```

6. **Add API endpoint**
   ```python
   # app/api/v1/endpoints/new_endpoint.py
   @router.post("/")
   async def create_item(...):
       # ... endpoint logic
   ```

7. **Write tests**
   ```python
   # tests/test_api/test_new_endpoint.py
   async def test_create_item(auth_client):
       # ... test logic
   ```

8. **Run tests**
   ```bash
   pytest tests/ -v
   ```

9. **Commit and push**
   ```bash
   git add .
   git commit -m "Add new endpoint"
   git push origin feature/new-endpoint
   ```

---

## 🚀 Deployment

### Environment Setup

1. Set `DEBUG=False` in production
2. Use strong `SECRET_KEY` (32+ characters)
3. Configure production database URL
4. Set appropriate `CORS_ORIGINS`

### Deployment Platforms

**Railway / Render / Fly.io:**
```bash
# Build command
pip install -r requirements.txt

# Start command
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Docker:**
```bash
docker build -t deadline-backend .
docker run -p 8000:8000 --env-file .env deadline-backend
```

**Heroku:**
```bash
# Procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 📄 License

[Your License Here]

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

