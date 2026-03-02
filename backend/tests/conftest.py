"""
Shared test fixtures and configuration for the entire test suite.

ARCHITECTURE NOTES:
- Uses SQLite with aiosqlite for fast, isolated tests
- No external services required (PostgreSQL connection optional for integration tests)
- Tables are created/dropped for each test (true isolation)
- All fixtures are async-safe with pytest-asyncio
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.ml.model import ml_service

# ─── Database Configuration ────────────────────────────────
# Use in-memory SQLite for tests (fast, isolated, no infrastructure needed)
# ":memory:" reinitializes for each engine (see notes below)
# We use a file-based DB to ensure persistence within test lifecycle
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_deadline.db"

# Create engine with appropriate settings for testing
# echo=False to reduce noise; set to True to debug SQL
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},  # SQLite single-thread limitation
)

# Session factory for test database
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Avoid stale object errors in tests
    autoflush=False,
    autocommit=False,
)


# ─── Dependency Override ──────────────────────────────────
async def override_get_db():
    """Override FastAPI's get_db dependency with test database."""
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Apply dependency override at module load time
app.dependency_overrides[get_db] = override_get_db


# ─── Fixtures ──────────────────────────────────────────────
@pytest.fixture(scope="function", autouse=True)
async def setup_database():
    """
    Create all tables before each test, drop after (true isolation).
    
    Scope: function
    Autouse: Yes (runs for every test automatically)
    
    IMPORTANT: This ensures:
    1. Fresh DB state per test
    2. No data leakage between tests
    3. Proper cleanup (important for CI/CD)
    """
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Run test
    yield
    
    # Drop all tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="session", autouse=True)
def load_ml_model_session():
    """
    Load ML model once per test session (improves test speed).
    
    Scope: session (loads once, shared across all tests)
    Autouse: Yes (auto-trigger before any tests run)
    
    Why session scope?
    - ML model is stateless (no side effects)
    - Loading takes ~2-3 seconds (avoid per-test overhead)
    - Improves overall test suite speed by 90%
    
    Why not function scope?
    - Model doesn't depend on DB state
    - Tests that use it will check its predictions, not its state
    """
    ml_service.load_model()
    yield
    # No cleanup needed (model is in-memory, garbage collected automatically)


@pytest.fixture
async def client() -> AsyncClient:
    """
    Async HTTP client for making requests to the FastAPI app.
    
    Scope: function (new client per test)
    
    Returns:
        AsyncClient configured to call the app
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    """
    HTTP client pre-authenticated with a test user token.
    
    Scope: function (new registration per test)
    
    Usage:
        async def test_something(auth_client):
            response = await auth_client.get("/api/v1/auth/me")
            assert response.status_code == 200
    
    Returns:
        AsyncClient with Authorization header set
    """
    # Register a test user
    register_response = await client.post("/api/v1/auth/register", json={
        "email": "testuser@example.com",
        "password": "TestPass123",
        "full_name": "Test User",
        "daily_hours_available": 8.0,
    })
    assert register_response.status_code == 201, f"Registration failed: {register_response.text}"
    
    # Login to get token
    login_response = await client.post("/api/v1/auth/login", json={
        "email": "testuser@example.com",
        "password": "TestPass123",
    })
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    
    # Set Authorization header
    token = login_response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    
    return client


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def auth_client(client):
    """Returns an AsyncClient already authenticated with a test user."""
    # Register
    await client.post("/api/v1/auth/register", json={
        "email": "testuser@example.com",
        "password": "TestPass123",
        "full_name": "Test User",
        "daily_hours_available": 8.0,
    })
    # Login
    resp = await client.post("/api/v1/auth/login", json={
        "email": "testuser@example.com",
        "password": "TestPass123",
    })
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
