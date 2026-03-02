# ⚡ Quick Start Guide

> Get up and running in 5 minutes

## 🚀 One-Command Setup

### Windows
```bash
setup.bat
```

### macOS/Linux
```bash
chmod +x setup.sh
./setup.sh
```

---

## 📝 Manual Setup (5 Steps)

### 1. Install Dependencies
```bash
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database password
```

### 3. Create Database
```sql
CREATE DATABASE deadline_db;
```

### 4. Run Migrations
```bash
alembic upgrade head
```

### 5. Start Server
```bash
uvicorn app.main:app --reload
```

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/health |

---

## 🧪 Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=app

# Specific test
pytest tests/test_api/test_auth.py -v
```

---

## 🔐 First API Call

### 1. Register
```bash
POST http://localhost:8000/api/v1/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass123",
  "full_name": "Test User",
  "daily_hours_available": 8.0
}
```

### 2. Use Token
Copy `access_token` from response and add to headers:
```
Authorization: Bearer <your_access_token>
```

---

## 🐛 Common Issues

### Port 8000 in use
```bash
uvicorn app.main:app --reload --port 8001
```

### Database connection failed
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

### Module not found
```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
```

---

## 📚 Full Documentation

See [README.md](README.md) for complete documentation.

---

## 🆘 Need Help?

1. Check [README.md](README.md) - Troubleshooting section
2. Check [API Docs](http://localhost:8000/docs)
3. Ask your team lead
4. Open an issue on GitHub

---

**Happy Coding! 🎉**
