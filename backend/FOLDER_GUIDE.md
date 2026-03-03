# 📂 Folder Structure Guide

> Complete guide to every folder and file in the backend

## 🗺️ Quick Navigation

| Folder | Purpose | README |
|--------|---------|--------|
| [`app/`](#app) | Core application code | [📖 Read](app/README.md) |
| [`app/api/`](#appapi) | API routes and endpoints | [📖 Read](app/api/README.md) |
| [`app/core/`](#appcore) | Configuration and security | [📖 Read](app/core/README.md) |
| [`app/db/`](#appdb) | Database connection | [📖 Read](app/db/README.md) |
| [`app/models/`](#appmodels) | Database tables (SQLAlchemy) | [📖 Read](app/models/README.md) |
| [`app/schemas/`](#appschemas) | Request/response validation (Pydantic) | [📖 Read](app/schemas/README.md) |
| [`app/services/`](#appservices) | Business logic layer | [📖 Read](app/services/README.md) |
| [`app/ml/`](#appml) | Machine learning models | [📖 Read](app/ml/README.md) |
| [`tests/`](#tests) | Test suite | [📖 Read](tests/README.md) |
| [`alembic/`](#alembic) | Database migrations | [📖 Read](alembic/README.md) |

---

## 📁 Detailed Structure

```
backend/
├── 📂 app/                          # Core application
│   ├── 📂 api/                      # API layer
│   │   └── 📂 v1/                   # API version 1
│   │       ├── 📂 endpoints/        # Endpoint modules
│   │       │   ├── auth.py         # Authentication (8 endpoints)
│   │       │   ├── tasks.py        # Tasks (12 endpoints)
│   │       │   └── intelligence.py # ML/Analytics (17 endpoints)
│   │       └── router.py           # Main API router
│   │
│   ├── 📂 core/                     # Core configuration
│   │   ├── config.py               # Environment settings
│   │   └── security.py             # JWT + password hashing
│   │
│   ├── 📂 db/                       # Database layer
│   │   └── session.py              # Connection & session management
│   │
│   ├── 📂 models/                   # Data models
│   │   └── models.py               # All database tables (6 models)
│   │
│   ├── 📂 schemas/                  # Data validation
│   │   ├── auth.py                 # Auth schemas
│   │   └── tasks.py                # Task schemas
│   │
│   ├── 📂 services/                 # Business logic
│   │   ├── user_service.py         # User operations
│   │   ├── task_service.py         # Task operations
│   │   ├── prediction_service.py   # ML predictions
│   │   ├── conflict_service.py     # Conflict detection
│   │   └── optimizer_service.py    # Schedule optimization
│   │
│   ├── 📂 ml/                       # Machine learning
│   │   ├── model.py                # ML training & inference
│   │   └── 📂 models/              # Trained models
│   │       └── deadline_risk_model.pkl
│   │
│   └── main.py                     # FastAPI app entry point
│
├── 📂 alembic/                      # Database migrations
│   ├── 📂 versions/                # Migration files
│   │   └── 001_initial.py         # Initial schema
│   └── env.py                      # Alembic config
│
├── 📂 tests/                        # Test suite (37 tests)
│   ├── 📂 test_api/                # API tests
│   │   ├── test_auth.py           # Auth tests (8)
│   │   ├── test_tasks.py          # Task tests (12)
│   │   └── test_intelligence.py   # ML tests (12)
│   ├── 📂 test_services/           # Service tests
│   │   └── test_ml.py             # ML model tests (5)
│   └── conftest.py                 # Test fixtures
│
├── 📄 .env                          # Environment variables (SECRET!)
├── 📄 .env.example                  # Environment template
├── 📄 .gitignore                    # Git ignore rules
├── 📄 alembic.ini                   # Alembic configuration
├── 📄 pytest.ini                    # Pytest configuration
├── 📄 requirements.txt              # Python dependencies
├── 📄 README.md                     # Main documentation
├── 📄 QUICK_START.md                # 5-minute setup guide
├── 📄 API_EXAMPLES.md               # API testing examples
├── 📄 FOLDER_GUIDE.md               # This file
├── 📄 setup.sh                      # Auto-setup (macOS/Linux)
└── 📄 setup.bat                     # Auto-setup (Windows)
```

---

## 📖 Folder Descriptions

### `app/`
**Purpose:** Core application code

**Contains:**
- API endpoints
- Business logic
- Database models
- ML models
- Configuration

**Key Files:**
- `main.py` - FastAPI app entry point

[📖 Full Documentation](app/README.md)

---

### `app/api/`
**Purpose:** HTTP API layer

**Contains:**
- All REST API endpoints
- Request/response handling
- Route definitions

**Endpoints:**
- Authentication (8)
- Tasks (12)
- Intelligence/ML (17)

**Total:** 37 endpoints

[📖 Full Documentation](app/api/README.md)

---

### `app/core/`
**Purpose:** Core configuration and security

**Contains:**
- Environment configuration
- JWT authentication
- Password hashing
- Security utilities

**Key Files:**
- `config.py` - Settings from .env
- `security.py` - Auth & password handling

[📖 Full Documentation](app/core/README.md)

---

### `app/db/`
**Purpose:** Database connection management

**Contains:**
- Async database engine
- Session factory
- Connection pooling
- Base class for models

**Key Files:**
- `session.py` - Database setup

[📖 Full Documentation](app/db/README.md)

---

### `app/models/`
**Purpose:** Database table definitions

**Contains:**
- SQLAlchemy ORM models
- Table relationships
- Database constraints

**Models (6):**
1. User - User accounts
2. Task - Tasks with deadlines
3. Prediction - ML predictions
4. Conflict - Scheduling conflicts
5. Recommendation - AI recommendations
6. Notification - User notifications

[📖 Full Documentation](app/models/README.md)

---

### `app/schemas/`
**Purpose:** Request/response validation

**Contains:**
- Pydantic models
- Validation rules
- Serialization logic

**Schema Files:**
- `auth.py` - Auth schemas
- `tasks.py` - Task schemas

[📖 Full Documentation](app/schemas/README.md)

---

### `app/services/`
**Purpose:** Business logic layer

**Contains:**
- CRUD operations
- Complex queries
- Business rules
- Data processing

**Services (5):**
1. UserService - User management
2. TaskService - Task operations
3. PredictionService - ML predictions
4. ConflictService - Conflict detection
5. OptimizerService - Schedule optimization

[📖 Full Documentation](app/services/README.md)

---

### `app/ml/`
**Purpose:** Machine learning

**Contains:**
- ML model training
- Prediction inference
- Feature engineering
- Model files

**Key Components:**
- Random Forest classifier
- 10 input features
- 3 risk levels (LOW/MEDIUM/HIGH)
- ~87% accuracy

[📖 Full Documentation](app/ml/README.md)

---

### `tests/`
**Purpose:** Automated testing

**Contains:**
- API endpoint tests
- Service layer tests
- ML model tests
- Test fixtures

**Test Stats:**
- Total: 37 tests
- Status: ✅ 100% passing
- Coverage: High

[📖 Full Documentation](tests/README.md)

---

### `alembic/`
**Purpose:** Database migrations

**Contains:**
- Migration files
- Schema version control
- Upgrade/downgrade scripts

**Key Commands:**
- `alembic upgrade head` - Apply migrations
- `alembic revision --autogenerate` - Create migration

[📖 Full Documentation](alembic/README.md)

---

## 🎯 Finding What You Need

### "I want to add a new API endpoint"
→ Go to [`app/api/v1/endpoints/`](app/api/README.md)

### "I need to change database tables"
→ Go to [`app/models/`](app/models/README.md) + [`alembic/`](alembic/README.md)

### "I want to add validation rules"
→ Go to [`app/schemas/`](app/schemas/README.md)

### "I need to add business logic"
→ Go to [`app/services/`](app/services/README.md)

### "I want to modify the ML model"
→ Go to [`app/ml/`](app/ml/README.md)

### "I need to change configuration"
→ Go to [`app/core/`](app/core/README.md)

### "I want to write tests"
→ Go to [`tests/`](tests/README.md)

### "I need to change database schema"
→ Go to [`alembic/`](alembic/README.md)

---

## 🔄 Request Flow Through Folders

```
1. Client Request
   ↓
2. app/main.py (FastAPI app)
   ↓
3. app/api/v1/endpoints/ (Route handling)
   ↓
4. app/schemas/ (Validate request)
   ↓
5. app/services/ (Business logic)
   ↓
6. app/models/ (Database query)
   ↓
7. app/ml/ (ML prediction if needed)
   ↓
8. app/schemas/ (Validate response)
   ↓
9. Client Response
```

---

## 📊 File Count Summary

| Folder | Python Files | Purpose |
|--------|-------------|---------|
| `app/api/` | 4 | API endpoints |
| `app/core/` | 2 | Configuration |
| `app/db/` | 1 | Database |
| `app/models/` | 1 | Tables |
| `app/schemas/` | 2 | Validation |
| `app/services/` | 5 | Business logic |
| `app/ml/` | 1 | ML model |
| `tests/` | 5 | Tests |
| `alembic/` | 2+ | Migrations |
| **Total** | **23+** | |

---

## 🎓 Learning Path

### For New Team Members

#### Day 1: Understanding Structure
1. Read [Main README](README.md)
2. Read [QUICK_START](QUICK_START.md)
3. Read this file (FOLDER_GUIDE.md)

#### Day 2: Core Concepts
1. Read [app/README.md](app/README.md)
2. Read [app/models/README.md](app/models/README.md)
3. Read [app/schemas/README.md](app/schemas/README.md)

#### Day 3: API & Logic
1. Read [app/api/README.md](app/api/README.md)
2. Read [app/services/README.md](app/services/README.md)
3. Try [API_EXAMPLES.md](API_EXAMPLES.md)

#### Day 4: Advanced Topics
1. Read [app/ml/README.md](app/ml/README.md)
2. Read [app/core/README.md](app/core/README.md)
3. Read [alembic/README.md](alembic/README.md)

#### Day 5: Testing & Practice
1. Read [tests/README.md](tests/README.md)
2. Run tests: `pytest -v`
3. Make a small change and test it

---

## 🔗 External Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Scikit-learn Documentation](https://scikit-learn.org/)

---

## 💡 Pro Tips

### For Backend Developers
- Start with `app/api/` and `app/services/`
- Understand request flow
- Read existing endpoints as examples

### For ML Engineers
- Focus on `app/ml/` and `app/services/prediction_service.py`
- Understand feature engineering
- Check `tests/test_services/test_ml.py`

### For Frontend Developers
- Read `app/api/README.md` for endpoints
- Use [API_EXAMPLES.md](API_EXAMPLES.md) for testing
- Check Swagger UI: http://localhost:8000/docs

### For QA/Testers
- Read `tests/README.md`
- Use [API_EXAMPLES.md](API_EXAMPLES.md)
- Run tests: `pytest -v`

---

## 🆘 Need Help?

1. **Check folder README** - Each folder has detailed docs
2. **Check main README** - [README.md](README.md)
3. **Check API examples** - [API_EXAMPLES.md](API_EXAMPLES.md)
4. **Ask your team lead**
5. **Open an issue on GitHub**

---

**Happy Coding! 🚀**

*Last Updated: March 2024*
