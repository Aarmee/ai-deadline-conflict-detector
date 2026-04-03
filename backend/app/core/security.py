import hashlib
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Union
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db

bearer_scheme = HTTPBearer()


# ─── Password Utilities ────────────────────────────────────
# CRITICAL: bcrypt has a 72-byte limit. Passwords > 72 bytes are silently truncated.
# Solution: Use SHA-256 to condense the input before hashing.
# This is safe because: SHA-256 output (64-char hex) + bcrypt (72 bytes) = secure combination
def hash_password(password: str) -> str:
    """
    Hash password using bcrypt with SHA-256 pre-hashing for long passwords.
    
    This approach is production-safe and recommended by bcrypt maintainers:
    - Pre-hash with SHA-256 for inputs > 72 bytes
    - Prevents silent truncation attacks
    - Maintains backward compatibility with standard bcrypt
    - All hashes are < 72 bytes after SHA-256 (64-char hex string)
    
    Args:
        password: Plain text password (any length supported by Pydantic)
        
    Returns:
        bcrypt hash string (starts with $2b$...)
    """
    # Convert to UTF-8 bytes
    password_bytes = password.encode('utf-8')
    
    # If password is longer than 72 bytes, use SHA-256 to compress it
    if len(password_bytes) > 72:
        # Convert SHA-256 digest to hex string for bcrypt (64 chars < 72 bytes)
        password_to_hash = hashlib.sha256(password_bytes).hexdigest()
    else:
        # Use original password string for bcrypt
        password_to_hash = password
    
    # Hash with bcrypt directly (cost factor 12)
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_to_hash.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against bcrypt hash, handling SHA-256 pre-hashing.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: bcrypt hash from database
        
    Returns:
        True if password matches, False otherwise
    """
    password_bytes = plain_password.encode('utf-8')
    
    # Apply same pre-hashing as hash_password() if needed
    if len(password_bytes) > 72:
        # Convert SHA-256 digest to hex string for bcrypt
        password_to_verify = hashlib.sha256(password_bytes).hexdigest()
    else:
        # Use original password string for bcrypt
        password_to_verify = plain_password
    
    # Verify with bcrypt directly
    return bcrypt.checkpw(password_to_verify.encode('utf-8'), hashed_password.encode('utf-8'))


# ─── JWT Token Utilities ──────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─── Dependency: Get Current User ─────────────────────────
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    from app.services.user_service import UserService
    from uuid import UUID

    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id_str: str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    # Convert string UUID to UUID object for SQLAlchemy
    try:
        user_id = UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
        )

    user = await UserService.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


# ─── Dependency: Get Current Admin ────────────────────────
def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    """Validates that the JWT has role: admin claim. No DB lookup needed."""
    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return payload
