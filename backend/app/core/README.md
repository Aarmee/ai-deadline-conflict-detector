# ⚙️ Core Directory

> Application configuration, security, and shared utilities

## 📁 Directory Structure

```
core/
├── config.py         # Environment configuration and settings
├── security.py       # JWT authentication and password hashing
└── __init__.py       # Package initialization
```

---

## 📄 Files Explained

### `config.py`
**Purpose:** Centralized configuration management using environment variables

**What it does:**
- Loads settings from `.env` file
- Provides type-safe configuration access
- Manages environment-specific settings
- Validates required configuration

**Key Settings:**

#### Application Settings
```python
APP_NAME: str = "Deadline Conflict Detection System"
APP_VERSION: str = "1.0.0"
DEBUG: bool = False
```

#### Database Configuration
```python
DATABASE_URL: str  # Required - PostgreSQL connection string
# Example: postgresql+asyncpg://user:pass@localhost:5432/deadline_db
```

#### JWT Security
```python
SECRET_KEY: str  # Required - JWT signing key (min 32 chars)
ALGORITHM: str = "HS256"  # JWT algorithm
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # Access token lifetime
REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # Refresh token lifetime
```

#### CORS Configuration
```python
CORS_ORIGINS: str = "http://localhost:3000"  # Allowed frontend URLs
# Comma-separated: "http://localhost:3000,http://localhost:5173"
```

#### ML Configuration
```python
ML_MODEL_PATH: str = "app/ml/models/deadline_risk_model.pkl"
ML_MODEL_VERSION: str = "rf_v1.0"
```

**How it works:**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str  # Loaded from .env
    SECRET_KEY: str
    
    class Config:
        env_file = ".env"  # Read from .env file
        case_sensitive = True

# Singleton pattern - only one instance
@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

**Usage in code:**
```python
from app.core.config import settings

# Access settings
db_url = settings.DATABASE_URL
is_debug = settings.DEBUG
```

**When to edit:**
- Adding new configuration options
- Changing default values
- Adding environment-specific settings

**Environment Variables (.env):**
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/deadline_db
SECRET_KEY=your-super-secret-key-min-32-chars
DEBUG=False
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

### `security.py`
**Purpose:** Authentication, authorization, and password security

**What it does:**
- Password hashing with bcrypt
- JWT token creation and validation
- User authentication dependency
- Secure password handling (supports passwords > 72 bytes)

**Key Functions:**

#### 1. Password Hashing
```python
def hash_password(password: str) -> str
```
**What it does:**
- Hashes passwords using bcrypt (cost factor 12)
- Handles passwords > 72 bytes with SHA-256 pre-hashing
- Returns bcrypt hash string

**Why SHA-256 pre-hashing?**
- Bcrypt has 72-byte limit
- Long passwords would be truncated
- SHA-256 compresses to 64-char hex (< 72 bytes)
- Maintains security for any password length

**Example:**
```python
hashed = hash_password("SecurePass123")
# Returns: $2b$12$abc123...xyz789
```

#### 2. Password Verification
```python
def verify_password(plain_password: str, hashed_password: str) -> bool
```
**What it does:**
- Verifies password against stored hash
- Applies same SHA-256 logic as hashing
- Returns True if match, False otherwise

**Example:**
```python
is_valid = verify_password("SecurePass123", stored_hash)
# Returns: True or False
```

#### 3. JWT Token Creation
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str
def create_refresh_token(data: dict) -> str
```
**What they do:**
- Create signed JWT tokens
- Access token: Short-lived (60 min default)
- Refresh token: Long-lived (7 days default)
- Include expiration and token type

**Token Structure:**
```json
{
  "sub": "user-uuid",           // Subject (user ID)
  "exp": 1234567890,            // Expiration timestamp
  "type": "access"              // Token type
}
```

**Example:**
```python
access_token = create_access_token({"sub": str(user.id)})
refresh_token = create_refresh_token({"sub": str(user.id)})
```

#### 4. Token Decoding
```python
def decode_token(token: str) -> dict
```
**What it does:**
- Validates JWT signature
- Checks expiration
- Returns payload if valid
- Raises HTTPException if invalid

**Example:**
```python
try:
    payload = decode_token(token)
    user_id = payload["sub"]
except HTTPException:
    # Token invalid or expired
```

#### 5. Get Current User (Dependency)
```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
) -> User
```
**What it does:**
- Extracts JWT from Authorization header
- Validates token
- Fetches user from database
- Returns User object
- Raises 401 if invalid

**Usage in endpoints:**
```python
@router.get("/tasks")
async def list_tasks(
    current_user: User = Depends(get_current_user)  # ← Injects authenticated user
):
    # current_user is automatically available
    tasks = await TaskService.get_all_for_user(db, current_user.id)
```

**Authentication Flow:**
```
1. Client sends: Authorization: Bearer <token>
   ↓
2. get_current_user() extracts token
   ↓
3. decode_token() validates signature & expiration
   ↓
4. Extract user_id from token payload
   ↓
5. Query database for user
   ↓
6. Return User object to endpoint
```

---

## 🔐 Security Best Practices

### Password Requirements
Enforced in `schemas/auth.py`:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 digit
- Maximum 100 characters

### Password Storage
- Never store plain text passwords
- Always use `hash_password()` before saving
- Bcrypt automatically salts each password
- Cost factor 12 = ~100-200ms per hash (good balance)

### JWT Security
- Tokens are signed with SECRET_KEY
- Cannot be forged without the key
- Expiration enforced server-side
- Refresh tokens allow seamless re-authentication

### Token Expiration Strategy
- **Access Token (60 min):** Short-lived for security
- **Refresh Token (7 days):** Long-lived for convenience
- Frontend refreshes access token automatically

---

## 🔄 Authentication Workflow

### Registration
```python
1. User submits email + password
2. Validate password strength (Pydantic)
3. Hash password with bcrypt
4. Save user to database
5. Create access + refresh tokens
6. Return tokens to client
```

### Login
```python
1. User submits email + password
2. Find user by email
3. Verify password with bcrypt
4. Create access + refresh tokens
5. Return tokens to client
```

### Protected Endpoint Access
```python
1. Client sends: Authorization: Bearer <access_token>
2. get_current_user() validates token
3. Endpoint executes with authenticated user
4. Return response
```

### Token Refresh
```python
1. Access token expires (60 min)
2. Client sends refresh token
3. Validate refresh token
4. Issue new access + refresh tokens
5. Client continues with new tokens
```

---

## 🛠 Configuration Management

### Loading Settings
```python
from app.core.config import settings

# Access any setting
database_url = settings.DATABASE_URL
secret_key = settings.SECRET_KEY
is_debug = settings.DEBUG
```

### Environment-Specific Settings
```python
# Development (.env)
DEBUG=True
DATABASE_URL=postgresql+asyncpg://localhost/deadline_db_dev

# Production (.env)
DEBUG=False
DATABASE_URL=postgresql+asyncpg://prod-host/deadline_db
```

### Validating Configuration
Pydantic automatically validates:
- Required fields are present
- Types are correct
- Values are valid

```python
# Missing required field
DATABASE_URL not set → ValidationError

# Wrong type
DEBUG=not_a_boolean → ValidationError
```

---

## 🎯 Common Tasks

### Change Token Expiration
```python
# config.py
ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 2 hours instead of 1
REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days instead of 7
```

### Add New Configuration
```python
# config.py
class Settings(BaseSettings):
    # ... existing settings
    
    # New setting
    MAX_UPLOAD_SIZE_MB: int = 10
    ENABLE_EMAIL_NOTIFICATIONS: bool = True
```

```env
# .env
MAX_UPLOAD_SIZE_MB=50
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Change Password Hashing Cost
```python
# security.py
# Higher = more secure but slower
salt = bcrypt.gensalt(rounds=14)  # Default is 12
```

### Add OAuth Provider
```python
# security.py
# Add Google OAuth, GitHub OAuth, etc.
# Requires additional dependencies and configuration
```

---

## 🐛 Common Issues

### Issue: "SECRET_KEY not set"
**Cause:** Missing SECRET_KEY in .env

**Solution:**
```bash
# Generate secure key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Add to .env
SECRET_KEY=generated-key-here
```

### Issue: "Invalid token"
**Cause:** Token expired or SECRET_KEY changed

**Solution:**
- Use refresh token to get new access token
- Don't change SECRET_KEY in production (invalidates all tokens)

### Issue: "Password too weak"
**Cause:** Password doesn't meet requirements

**Solution:** Ensure password has:
- 8+ characters
- 1 uppercase letter
- 1 digit

---

## 📊 Security Architecture

```
┌─────────────────────────────────────┐
│   Client (Frontend)                 │
│   - Stores access + refresh tokens  │
│   - Sends Authorization header      │
└──────────────┬──────────────────────┘
               │
               ↓ Authorization: Bearer <token>
┌─────────────────────────────────────┐
│   FastAPI Middleware                │
│   - Extracts token from header      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   get_current_user()                │
│   - Validates JWT signature         │
│   - Checks expiration               │
│   - Fetches user from DB            │
└──────────────┬──────────────────────┘
               │
               ↓ User object
┌─────────────────────────────────────┐
│   Endpoint Function                 │
│   - Executes with authenticated user│
└─────────────────────────────────────┘
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `app/schemas/auth.py` | Password validation rules |
| `app/services/user_service.py` | User CRUD operations |
| `app/api/v1/endpoints/auth.py` | Auth endpoints |

---

## 🔗 External Dependencies

- **pydantic-settings** - Configuration management
- **python-jose** - JWT creation/validation
- **bcrypt** - Password hashing
- **passlib** - Password hashing wrapper (removed in favor of direct bcrypt)

---

**Security Note:** Never commit `.env` file to version control! Always use `.env.example` as template.
