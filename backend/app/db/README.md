# 💾 DB Directory

> Database connection and session management

## 📁 Directory Structure

```
db/
├── session.py        # Database session configuration
└── __init__.py       # Package initialization
```

---

## 📄 Files Explained

### `session.py`
**Purpose:** Configure database connection and session management

**What it does:**
- Creates async database engine
- Configures session factory
- Provides database session dependency
- Defines base class for models

---

## 🔧 Key Components

### 1. Database Engine
```python
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_pre_ping=True,   # Check connection health
    pool_size=5,          # Connection pool size
    max_overflow=10       # Max extra connections
)
```

**What it does:**
- Creates connection to PostgreSQL
- Manages connection pool
- Handles async operations

**Configuration:**
- `echo=True` - Logs all SQL queries (useful for debugging)
- `pool_pre_ping=True` - Tests connections before use
- `pool_size=5` - Keep 5 connections ready
- `max_overflow=10` - Allow up to 15 total connections

---

### 2. Session Factory
```python
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Keep objects usable after commit
    autoflush=False,         # Manual flush control
    autocommit=False         # Manual commit control
)
```

**What it does:**
- Creates database sessions
- Configures session behavior
- Manages transactions

**Configuration:**
- `expire_on_commit=False` - Objects remain accessible after commit
- `autoflush=False` - Explicit `await db.flush()` required
- `autocommit=False` - Explicit `await db.commit()` required

---

### 3. Base Class
```python
Base = declarative_base()
```

**What it does:**
- Base class for all SQLAlchemy models
- Provides ORM functionality
- Manages table metadata

**Usage:**
```python
# app/models/models.py
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    # ... columns
```

---

### 4. Database Dependency
```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

**What it does:**
- Provides database session to endpoints
- Automatically commits on success
- Automatically rolls back on error
- Closes session after use

**Usage in endpoints:**
```python
@router.get("/tasks")
async def list_tasks(
    db: AsyncSession = Depends(get_db)  # ← Injected session
):
    result = await db.execute(select(Task))
    return result.scalars().all()
```

---

## 🔄 Session Lifecycle

### Request Flow
```
1. Request arrives
   ↓
2. get_db() creates session
   ↓
3. Endpoint executes
   - Queries database
   - Makes changes
   ↓
4. Success: commit()
   OR
   Error: rollback()
   ↓
5. Session closed
```

### Transaction Example
```python
async def create_task(db: AsyncSession = Depends(get_db)):
    # Session starts
    
    task = Task(title="New Task")
    db.add(task)
    await db.flush()  # Get ID without committing
    
    prediction = Prediction(task_id=task.id)
    db.add(prediction)
    
    # Endpoint returns
    # get_db() automatically commits
    # Session closed
```

---

## 🎯 Database Operations

### Create
```python
async def create_user(db: AsyncSession):
    user = User(email="test@example.com")
    db.add(user)
    await db.flush()  # Get auto-generated ID
    await db.commit()  # Persist to database
    return user
```

### Read
```python
async def get_user(db: AsyncSession, user_id: UUID):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()
```

### Update
```python
async def update_user(db: AsyncSession, user: User):
    user.full_name = "New Name"
    await db.flush()  # Save changes
    await db.commit()
    return user
```

### Delete
```python
async def delete_user(db: AsyncSession, user: User):
    await db.delete(user)
    await db.commit()
```

---

## 🔒 Transaction Management

### Manual Transactions
```python
async def complex_operation(db: AsyncSession):
    try:
        # Multiple operations
        db.add(user)
        await db.flush()
        
        db.add(task)
        await db.flush()
        
        # Commit all at once
        await db.commit()
    except Exception:
        # Rollback on error
        await db.rollback()
        raise
```

### Automatic Transactions (with get_db)
```python
async def endpoint(db: AsyncSession = Depends(get_db)):
    # All operations in one transaction
    db.add(user)
    db.add(task)
    # Automatically committed by get_db()
```

---

## 🏊 Connection Pooling

### Pool Configuration
```python
pool_size=5        # 5 connections ready
max_overflow=10    # Up to 15 total connections
```

**How it works:**
1. App starts with 5 connections
2. Requests use connections from pool
3. If all busy, create up to 10 more
4. Connections returned to pool after use
5. Idle connections kept alive

**Benefits:**
- Fast connection reuse
- Handles concurrent requests
- Prevents connection exhaustion

---

## 🐛 Common Issues

### Issue: "Connection refused"
**Cause:** PostgreSQL not running

**Solution:**
```bash
# Windows
services.msc → PostgreSQL → Start

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Issue: "Too many connections"
**Cause:** Connection pool exhausted

**Solution:**
```python
# Increase pool size
engine = create_async_engine(
    url,
    pool_size=10,      # More connections
    max_overflow=20    # Higher overflow
)
```

### Issue: "Session closed"
**Cause:** Accessing session after endpoint returns

**Solution:**
```python
# ❌ Bad - Session closed
@router.get("/tasks")
async def get_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task))
    tasks = result.scalars().all()
    return tasks  # Session closes here

# Later access fails:
# tasks[0].user  # Error: Session closed

# ✅ Good - Eager load relationships
@router.get("/tasks")
async def get_tasks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task).options(selectinload(Task.user))
    )
    tasks = result.scalars().all()
    return tasks  # Relationships already loaded
```

### Issue: "Lazy loading in async"
**Cause:** Accessing relationship without eager loading

**Solution:**
```python
# ❌ Bad - Lazy load
task.user  # Triggers sync query in async context

# ✅ Good - Eager load
result = await db.execute(
    select(Task).options(selectinload(Task.user))
)
task = result.scalar_one()
task.user  # Already loaded
```

---

## 🔧 Configuration

### Environment Variables
```env
# .env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/deadline_db
DEBUG=False
```

### Connection String Format
```
postgresql+asyncpg://username:password@host:port/database

Examples:
- Local: postgresql+asyncpg://postgres:password@localhost:5432/deadline_db
- Docker: postgresql+asyncpg://postgres:postgres@db:5432/deadline_db
- Cloud: postgresql+asyncpg://user:pass@host.region.provider.com:5432/db
```

---

## 📊 Database Architecture

```
┌─────────────────────────────────────┐
│   FastAPI Application               │
└──────────────┬──────────────────────┘
               │
               ↓ get_db()
┌─────────────────────────────────────┐
│   AsyncSession                      │
│   - Transaction management          │
│   - Query execution                 │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   Connection Pool                   │
│   - 5 ready connections             │
│   - Up to 15 total                  │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   PostgreSQL Database               │
│   - Tables, indexes, constraints    │
└─────────────────────────────────────┘
```

---

## 🎯 Best Practices

### 1. Always Use Dependency Injection
```python
# ✅ Good
async def endpoint(db: AsyncSession = Depends(get_db)):
    # Session managed automatically

# ❌ Bad
async def endpoint():
    async with AsyncSessionLocal() as db:
        # Manual session management
```

### 2. Use flush() Before Accessing IDs
```python
# ✅ Good
user = User(email="test@example.com")
db.add(user)
await db.flush()  # Get ID
print(user.id)  # Works!

# ❌ Bad
user = User(email="test@example.com")
db.add(user)
print(user.id)  # None - not flushed yet
```

### 3. Eager Load Relationships
```python
# ✅ Good
result = await db.execute(
    select(Task).options(
        selectinload(Task.user),
        selectinload(Task.predictions)
    )
)

# ❌ Bad
result = await db.execute(select(Task))
task = result.scalar_one()
task.user  # Lazy load - may fail in async
```

### 4. Handle Errors Properly
```python
# ✅ Good
try:
    db.add(user)
    await db.commit()
except IntegrityError:
    await db.rollback()
    raise HTTPException(400, "Email already exists")

# ❌ Bad
db.add(user)
await db.commit()  # Unhandled error
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `app/models/models.py` | Database models |
| `app/core/config.py` | Database URL configuration |
| `alembic/` | Database migrations |

---

## 🔗 SQLAlchemy Documentation

- [Async SQLAlchemy](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Session Basics](https://docs.sqlalchemy.org/en/20/orm/session_basics.html)
- [Connection Pooling](https://docs.sqlalchemy.org/en/20/core/pooling.html)

---

**Pro Tip:** Use `echo=True` in development to see all SQL queries and debug performance issues!
