"""
Tests for Authentication Endpoints
Run with: pytest tests/ -v --cov=app

FIXTURES PROVIDED BY conftest.py:
- client: AsyncClient connected to test API
- auth_client: AsyncClient with authorization headers
- setup_database: Auto-creates/drops tables per test
- load_ml_model_session: Loads ML model once per session
"""
import pytest


@pytest.fixture
async def registered_user(client):
    """Register a test user and return their credentials + tokens."""
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "TestPass123",
        "full_name": "Test User",
        "daily_hours_available": 8.0,
    })
    assert response.status_code == 201
    return {"email": "test@example.com", "password": "TestPass123", **response.json()}


# ─── Auth Tests ───────────────────────────────────────────
@pytest.mark.asyncio
async def test_register_success(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePass1",
        "full_name": "New User",
        "daily_hours_available": 6.0,
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client, registered_user):
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "TestPass123",
        "full_name": "Another User",
        "daily_hours_available": 8.0,
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_weak_password(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "weak@example.com",
        "password": "password",  # no uppercase, no digit
        "full_name": "Weak User",
        "daily_hours_available": 8.0,
    })
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_login_success(client, registered_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "TestPass123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client, registered_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPass999",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client, registered_user):
    token = registered_user["access_token"]
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403  # No token provided


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
