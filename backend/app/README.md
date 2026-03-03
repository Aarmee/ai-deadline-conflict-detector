# 📦 App Directory

> Core application code - All business logic, APIs, and services live here

## 📁 Directory Structure

```
app/
├── api/              # API routes and endpoints
├── core/             # Core configuration and security
├── db/               # Database connection and session
├── models/           # SQLAlchemy database models
├── schemas/          # Pydantic request/response schemas
├── services/         # Business logic layer
├── ml/               # Machine learning models and inference
├── main.py           # FastAPI application entry point
└── __init__.py       # Package initialization
```

---

## 📄 Files in This Directory

### `main.py`
**Purpose:** FastAPI application entry point and configuration

**What it does:**
- Creates the FastAPI app instance
- Configures CORS middleware for frontend communication
- Registers all API routers
- Defines lifespan events (startup/shutdown)
- Loads ML model on startup
- Provides health check and root endpoints

**When to edit:**
- Adding new middleware
- Changing CORS settings
- Adding global exception handlers
- Modifying startup/shutdown logic

**Example:**
```python
from fastapi import FastAPI
from app.api.v1.router import api_router

app = FastAPI(title="My API")
app.include_router(api_router)
```

---

### `__init__.py`
**Purpose:** Makes `app` a Python package

**What it does:**
- Allows importing from `app` directory
- Can contain package-level initialization code
- Usually empty or minimal

**When to edit:**
- Rarely - only for package-level exports

---

## 📂 Subdirectories

### `api/` - API Layer
Contains all HTTP endpoints and route definitions.
- [See api/README.md](api/README.md)

### `core/` - Core Configuration
Application settings, security, and shared utilities.
- [See core/README.md](core/README.md)

### `db/` - Database Layer
Database connection and session management.
- [See db/README.md](db/README.md)

### `models/` - Data Models
SQLAlchemy ORM models (database tables).
- [See models/README.md](models/README.md)

### `schemas/` - Data Schemas
Pydantic models for request/response validation.
- [See schemas/README.md](schemas/README.md)

### `services/` - Business Logic
Core business logic and data operations.
- [See services/README.md](services/README.md)

### `ml/` - Machine Learning
ML models, training, and inference.
- [See ml/README.md](ml/README.md)

---

## 🏗 Architecture Pattern

This app follows a **layered architecture**:

```
┌─────────────────────────────────────┐
│   API Layer (api/)                  │  ← HTTP endpoints
├─────────────────────────────────────┤
│   Schema Layer (schemas/)           │  ← Validation
├─────────────────────────────────────┤
│   Service Layer (services/)         │  ← Business logic
├─────────────────────────────────────┤
│   Model Layer (models/)             │  ← Database
├─────────────────────────────────────┤
│   ML Layer (ml/)                    │  ← Predictions
└─────────────────────────────────────┘
```

**Request Flow:**
1. Client → API endpoint (`api/`)
2. Validate with Pydantic (`schemas/`)
3. Process in service (`services/`)
4. Query database (`models/`)
5. Run ML prediction if needed (`ml/`)
6. Return response

---

## 🎯 Quick Reference

| Need to... | Edit this... |
|------------|-------------|
| Add new endpoint | `api/v1/endpoints/` |
| Change database table | `models/models.py` |
| Add validation rules | `schemas/` |
| Add business logic | `services/` |
| Configure app settings | `core/config.py` |
| Modify authentication | `core/security.py` |
| Train ML model | `ml/model.py` |
| Change CORS settings | `main.py` |

---

## 🔗 Related Documentation

- [Main README](../README.md) - Full project documentation
- [API Examples](../API_EXAMPLES.md) - Testing endpoints
- [Quick Start](../QUICK_START.md) - Setup guide

---

**Questions?** Check the README in each subdirectory for detailed explanations.
