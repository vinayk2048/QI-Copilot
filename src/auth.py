"""
Simple JWT-based authentication for QI Copilot.

Users are configured via environment variables (no database):
  APP_USERS          -> comma-separated pairs "username:password"
  APP_AUTH_SECRET    -> secret used to sign JWTs (set in App Settings / .env)
  JWT_EXPIRY_MINUTES -> token lifetime (default 480)
"""

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Header, HTTPException, status
from pydantic import BaseModel

ALGORITHM = "HS256"


class LoginRequest(BaseModel):
    username: str
    password: str


class _UserStore:
    def __init__(self):
        self.users = {}
        raw = os.getenv("APP_USERS", "").strip()
        for part in raw.split(","):
            part = part.strip()
            if not part:
                continue
            if ":" in part:
                username, password = part.split(":", 1)
                self.users[username.strip()] = password
            else:
                self.users[part] = part

    def verify(self, username: str, password: str) -> bool:
        expected = self.users.get(username)
        if expected is None:
            return False
        return secrets.compare_digest(password.encode("utf-8"), expected.encode("utf-8"))


def _get_secret() -> str:
    secret = os.getenv("APP_AUTH_SECRET", "").strip()
    if not secret:
        raise RuntimeError(
            "APP_AUTH_SECRET is not configured. Add it to .env (dev) or App Settings (Azure)."
        )
    return secret


def _get_expiry_minutes() -> int:
    try:
        return max(5, int(os.getenv("JWT_EXPIRY_MINUTES", "480")))
    except ValueError:
        return 480


_store = _UserStore()


def create_access_token(username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=_get_expiry_minutes())).timestamp()),
    }
    return jwt.encode(payload, _get_secret(), algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, _get_secret(), algorithms=[ALGORITHM])
        return payload.get("sub")
    except (jwt.PyJWTError, ValueError):
        return None


def authenticate_user(username: str, password: str) -> Optional[str]:
    if _store.verify(username, password):
        return create_access_token(username)
    return None


def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )
    username = decode_token(authorization.split(" ", 1)[1].strip())
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return username