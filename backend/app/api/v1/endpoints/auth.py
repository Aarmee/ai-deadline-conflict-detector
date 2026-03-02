from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse, UserUpdate
from app.schemas.tasks import PasswordChangeRequest
from app.services.user_service import UserService
from app.core.security import (
    verify_password, hash_password, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─────────────────────────────────────────────────────────
#  POST /auth/register
# ─────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED,
             summary="Register a new user")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Creates a new user account. Password must be 8+ chars with at least
    one uppercase letter and one digit. Returns JWT access + refresh tokens immediately.
    """
    existing = await UserService.get_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = await UserService.create(db, data)
    return TokenResponse(
        access_token=create_access_token({"sub": str(user.id)}),
        refresh_token=create_refresh_token({"sub": str(user.id)}),
    )


# ─────────────────────────────────────────────────────────
#  POST /auth/login
# ─────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse, summary="Login and get tokens")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Validates email + password. Returns a short-lived access_token (60 min)
    and a long-lived refresh_token (7 days). Frontend should store both.
    """
    user = await UserService.get_by_email(db, data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return TokenResponse(
        access_token=create_access_token({"sub": str(user.id)}),
        refresh_token=create_refresh_token({"sub": str(user.id)}),
    )


# ─────────────────────────────────────────────────────────
#  POST /auth/refresh
# ─────────────────────────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """
    Accepts a refresh_token and issues a new access_token + refresh_token pair.
    Frontend calls this automatically when access token expires (401 response).
    """
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type — must be refresh token")

    user = await UserService.get_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return TokenResponse(
        access_token=create_access_token({"sub": str(user.id)}),
        refresh_token=create_refresh_token({"sub": str(user.id)}),
    )


# ─────────────────────────────────────────────────────────
#  GET /auth/me
# ─────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the full profile of the currently authenticated user."""
    return current_user


# ─────────────────────────────────────────────────────────
#  PATCH /auth/me
# ─────────────────────────────────────────────────────────
@router.patch("/me", response_model=UserResponse, summary="Update profile")
async def update_profile(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates name and/or daily_hours_available.
    daily_hours_available is critical — it's used by the ML model
    and conflict detection to calculate workload capacity.
    """
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.flush()
    await db.refresh(current_user)
    return current_user


# ─────────────────────────────────────────────────────────
#  POST /auth/change-password
# ─────────────────────────────────────────────────────────
@router.post("/change-password", status_code=status.HTTP_200_OK, summary="Change password")
async def change_password(
    data: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Changes the user's password. Requires the current password for verification.
    After changing, all existing tokens remain valid (stateless JWT — no server-side invalidation).
    """
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(data.new_password)
    await db.flush()
    return {"message": "Password changed successfully"}


# ─────────────────────────────────────────────────────────
#  DELETE /auth/me  — Deactivate account
# ─────────────────────────────────────────────────────────
@router.delete("/me", status_code=status.HTTP_200_OK, summary="Deactivate account")
async def deactivate_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft-deletes the account by setting is_active=False.
    The user cannot login after this. Data is preserved in DB.
    """
    current_user.is_active = False
    await db.flush()
    return {"message": "Account deactivated successfully"}
