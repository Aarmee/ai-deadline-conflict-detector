# 🔄 Alembic Directory

> Database migrations - Version control for your database schema

## 📁 Directory Structure

```
alembic/
├── versions/                    # Migration files
│   ├── .gitkeep                # Keep folder in git
│   ├── 001_initial.py          # Initial schema migration
│   └── ...                     # Future migrations
├── env.py                      # Alembic environment configuration
└── __pycache__/                # Python cache
```

---

## 🎯 What is Alembic?

**Alembic** is a database migration tool for SQLAlchemy:
- **Version control** for database schema
- **Track changes** to tables, columns, indexes
- **Apply/rollback** migrations
- **Team collaboration** - Share schema changes via git

**Think of it as Git for your database!**

---

## 📄 Files Explained

### `env.py`
**Purpose:** Alembic environment configuration

**What it does:**
- Connects to database
- Configures migration context
- Handles async operations
- Imports models for auto-generation

**Key Configuration:**
```python
# Import models for auto-detection
from app.models.models import Base
target_metadata = Base.metadata

# Database URL from config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Async engine support
connectable = create_async_engine(settings.DATABASE_URL)
```

**When to edit:**
- Rarely - only for advanced configuration
- Adding custom migration logic
- Changing connection settings

---

### `versions/001_initial.py`
**Purpose:** Initial database schema migration

**What it does:**
- Creates all tables on first setup
- Defines initial schema
- Sets up relationships and constraints

**Structure:**
```python
"""Initial schema

Revision ID: 001_initial
Revises: 
Create Date: 2024-03-01 10:00:00
"""

def upgrade():
    # Create tables
    op.create_table('users', ...)
    op.create_table('tasks', ...)
    # ...

def downgrade():
    # Drop tables (reverse order)
    op.drop_table('tasks')
    op.drop_table('users')
    # ...
```

**Tables Created:**
1. `users` - User accounts
2. `tasks` - Tasks with deadlines
3. `predictions` - ML predictions
4. `conflicts` - Scheduling conflicts
5. `recommendations` - AI recommendations
6. `notifications` - User notifications

---

## 🚀 Common Commands

### Apply All Migrations
```bash
alembic upgrade head
```
**What it does:** Applies all pending migrations

**When to use:**
- First setup
- After pulling new migrations
- Deploying to production

**Output:**
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial, Initial schema
```

---

### Create New Migration (Auto-generate)
```bash
alembic revision --autogenerate -m "Add column to users"
```
**What it does:** Detects model changes and generates migration

**Process:**
1. Compares current models to database
2. Detects differences
3. Generates migration file
4. Saves to `versions/`

**Example Output:**
```
INFO  [alembic.autogenerate.compare] Detected added column 'users.phone_number'
Generating /path/to/alembic/versions/abc123_add_column_to_users.py ... done
```

**Generated File:**
```python
"""Add column to users

Revision ID: abc123
Revises: 001_initial
Create Date: 2024-03-02 10:00:00
"""

def upgrade():
    op.add_column('users', sa.Column('phone_number', sa.String(20), nullable=True))

def downgrade():
    op.drop_column('users', 'phone_number')
```

---

### Create Empty Migration (Manual)
```bash
alembic revision -m "Custom migration"
```
**What it does:** Creates empty migration for manual edits

**When to use:**
- Data migrations
- Complex schema changes
- Custom SQL

---

### Rollback One Migration
```bash
alembic downgrade -1
```
**What it does:** Reverts last migration

**When to use:**
- Undo recent change
- Fix migration error
- Testing migrations

---

### Rollback to Specific Version
```bash
alembic downgrade abc123
```
**What it does:** Reverts to specific migration

---

### View Migration History
```bash
alembic history
```
**Output:**
```
001_initial -> abc123 (head), Add column to users
<base> -> 001_initial, Initial schema
```

---

### View Current Version
```bash
alembic current
```
**Output:**
```
abc123 (head)
```

---

### Check Pending Migrations
```bash
alembic heads
```
**Shows:** Latest migration version

---

## 🔄 Migration Workflow

### Adding a New Column

#### Step 1: Update Model
```python
# app/models/models.py

class User(Base):
    __tablename__ = "users"
    # ... existing columns
    phone_number: Mapped[str] = mapped_column(String(20), nullable=True)  # ← New
```

#### Step 2: Generate Migration
```bash
alembic revision --autogenerate -m "Add phone_number to users"
```

#### Step 3: Review Generated File
```python
# alembic/versions/abc123_add_phone_number_to_users.py

def upgrade():
    op.add_column('users', sa.Column('phone_number', sa.String(20), nullable=True))

def downgrade():
    op.drop_column('users', 'phone_number')
```

#### Step 4: Apply Migration
```bash
alembic upgrade head
```

#### Step 5: Verify
```bash
alembic current
# Should show: abc123 (head)
```

---

### Removing a Column

#### Step 1: Remove from Model
```python
# app/models/models.py

class User(Base):
    __tablename__ = "users"
    # phone_number removed
```

#### Step 2: Generate Migration
```bash
alembic revision --autogenerate -m "Remove phone_number from users"
```

#### Step 3: Review & Apply
```bash
# Review generated file
# Then apply
alembic upgrade head
```

---

### Renaming a Column

**⚠️ Warning:** Auto-generate sees this as drop + add!

#### Manual Migration Required:
```python
def upgrade():
    op.alter_column('users', 'old_name', new_column_name='new_name')

def downgrade():
    op.alter_column('users', 'new_name', new_column_name='old_name')
```

---

### Adding a Table

#### Step 1: Create Model
```python
# app/models/models.py

class NewTable(Base):
    __tablename__ = "new_table"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100))
```

#### Step 2: Generate & Apply
```bash
alembic revision --autogenerate -m "Add new_table"
alembic upgrade head
```

---

## 🎯 Migration Best Practices

### 1. Always Review Auto-generated Migrations
```bash
# Generate
alembic revision --autogenerate -m "description"

# Review file in alembic/versions/
# Check upgrade() and downgrade()

# Apply only if correct
alembic upgrade head
```

### 2. Test Migrations Locally First
```bash
# Apply
alembic upgrade head

# Test app
python -m pytest

# Rollback if issues
alembic downgrade -1
```

### 3. Write Reversible Migrations
```python
# ✅ Good - Can rollback
def upgrade():
    op.add_column('users', sa.Column('phone', sa.String(20)))

def downgrade():
    op.drop_column('users', 'phone')

# ❌ Bad - Can't rollback
def upgrade():
    op.add_column('users', sa.Column('phone', sa.String(20)))

def downgrade():
    pass  # No rollback!
```

### 4. Use Descriptive Messages
```bash
# ✅ Good
alembic revision --autogenerate -m "Add phone_number to users table"

# ❌ Bad
alembic revision --autogenerate -m "update"
```

### 5. One Change Per Migration
```bash
# ✅ Good
alembic revision -m "Add phone_number to users"
alembic revision -m "Add index on email"

# ❌ Bad
alembic revision -m "Add phone and index and rename column"
```

---

## 🐛 Common Issues

### Issue: "Target database is not up to date"
**Cause:** Pending migrations

**Solution:**
```bash
alembic upgrade head
```

### Issue: "Can't locate revision identified by 'abc123'"
**Cause:** Migration file missing or deleted

**Solution:**
- Restore migration file from git
- Or create new migration

### Issue: "Table already exists"
**Cause:** Migration already applied manually

**Solution:**
```bash
# Mark as applied without running
alembic stamp head
```

### Issue: "Column already exists"
**Cause:** Partial migration or manual change

**Solution:**
```bash
# Rollback and reapply
alembic downgrade -1
alembic upgrade head
```

### Issue: "Auto-generate detects no changes"
**Cause:** Models not imported in env.py

**Solution:**
```python
# alembic/env.py
from app.models.models import Base  # ← Ensure this exists
target_metadata = Base.metadata
```

---

## 📊 Migration States

```
Database State:
┌─────────────────────────────────────┐
│   No tables                         │  ← Initial state
└─────────────────────────────────────┘
              ↓ alembic upgrade head
┌─────────────────────────────────────┐
│   All tables created                │  ← After 001_initial
└─────────────────────────────────────┘
              ↓ alembic upgrade head
┌─────────────────────────────────────┐
│   New column added                  │  ← After abc123
└─────────────────────────────────────┘
              ↓ alembic downgrade -1
┌─────────────────────────────────────┐
│   Column removed                    │  ← Rolled back
└─────────────────────────────────────┘
```

---

## 🔧 Configuration

### `alembic.ini`
**Location:** `backend/alembic.ini`

**Key Settings:**
```ini
[alembic]
script_location = alembic
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d_%%(rev)s_%%(slug)s

[loggers]
level = INFO
```

**When to edit:**
- Change migration file naming
- Adjust logging level
- Configure multiple databases

---

## 📚 Alembic Operations

### Column Operations
```python
# Add column
op.add_column('table', sa.Column('name', sa.String(50)))

# Drop column
op.drop_column('table', 'name')

# Alter column
op.alter_column('table', 'name', type_=sa.String(100))

# Rename column
op.alter_column('table', 'old_name', new_column_name='new_name')
```

### Table Operations
```python
# Create table
op.create_table('table',
    sa.Column('id', sa.Integer, primary_key=True),
    sa.Column('name', sa.String(50))
)

# Drop table
op.drop_table('table')

# Rename table
op.rename_table('old_name', 'new_name')
```

### Index Operations
```python
# Create index
op.create_index('idx_name', 'table', ['column'])

# Drop index
op.drop_index('idx_name')
```

### Constraint Operations
```python
# Add foreign key
op.create_foreign_key('fk_name', 'table', 'other_table', ['col'], ['other_col'])

# Drop foreign key
op.drop_constraint('fk_name', 'table')

# Add unique constraint
op.create_unique_constraint('uq_name', 'table', ['column'])
```

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `alembic.ini` | Alembic configuration |
| `app/models/models.py` | Database models |
| `app/db/session.py` | Database connection |
| `app/core/config.py` | Database URL |

---

## 📖 Alembic Documentation

- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [Auto-generation](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)
- [Operations Reference](https://alembic.sqlalchemy.org/en/latest/ops.html)

---

## 🎓 Quick Reference

| Command | What It Does |
|---------|-------------|
| `alembic upgrade head` | Apply all migrations |
| `alembic downgrade -1` | Rollback one migration |
| `alembic revision --autogenerate -m "msg"` | Create migration |
| `alembic history` | View migration history |
| `alembic current` | Show current version |
| `alembic stamp head` | Mark as up-to-date without running |

---

**Pro Tip:** Always commit migration files to git so your team can apply the same schema changes!

```bash
git add alembic/versions/abc123_add_column.py
git commit -m "Add phone_number column to users"
git push
```
