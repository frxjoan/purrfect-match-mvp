"""Tests for CORS, cookies, CSRF posture, and HTTP security headers."""

from datetime import timedelta
from typing import Any

import pytest

from flask import Response
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_refresh_cookies,
)

from .. import create_app
from ..config.settings import ProductionConfig
from ..extensions import db
from ..models import User


SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
}


def test_jwt_access_and_refresh_configuration(app: Any) -> None:
    """Access and refresh tokens use the agreed transports and lifetimes."""

    assert app.config["JWT_TOKEN_LOCATION"] == ("headers",)
    assert app.config["JWT_ACCESS_TOKEN_EXPIRES"] == timedelta(minutes=15)
    assert app.config["JWT_REFRESH_TOKEN_EXPIRES"] == timedelta(days=30)
    assert app.config["JWT_COOKIE_CSRF_PROTECT"] is True
    assert app.config["JWT_CSRF_IN_COOKIES"] is False
    assert app.config["JWT_REFRESH_CSRF_COOKIE_PATH"] == "/"
    assert app.config["JWT_REFRESH_COOKIE_PATH"] == "/api/v1/auth"
    assert app.config["JWT_COOKIE_SAMESITE"] == "Lax"


def test_production_refresh_cookie_is_secure_and_scoped(app: Any) -> None:
    """The future refresh endpoint will emit a hardened HttpOnly cookie."""

    app.config.update(
        JWT_COOKIE_SECURE=ProductionConfig.JWT_COOKIE_SECURE,
        JWT_COOKIE_SAMESITE=ProductionConfig.JWT_COOKIE_SAMESITE,
        JWT_REFRESH_COOKIE_PATH=ProductionConfig.JWT_REFRESH_COOKIE_PATH,
    )

    with app.app_context():
        token = create_refresh_token(identity="security-test-user")
        response = Response()
        set_refresh_cookies(response, token)

    refresh_cookie = next(
        cookie
        for cookie in response.headers.getlist("Set-Cookie")
        if cookie.startswith("refresh_token_cookie=")
    )

    assert "HttpOnly" in refresh_cookie
    assert "Secure" in refresh_cookie
    assert "SameSite=None" in refresh_cookie
    assert "Path=/api/v1/auth" in refresh_cookie


def test_cors_allows_credentials_only_for_configured_origins(client: Any) -> None:
    """Credentialed CORS requests must never reflect an untrusted origin."""

    allowed = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": (
                "authorization, content-type, x-csrf-token"
            ),
        },
    )
    denied = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "https://attacker.test",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert allowed.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert allowed.headers["Access-Control-Allow-Credentials"] == "true"
    allowed_headers = allowed.headers["Access-Control-Allow-Headers"].lower()
    assert "authorization" in allowed_headers
    assert "x-csrf-token" in allowed_headers
    assert "Access-Control-Allow-Origin" not in denied.headers
    assert "Access-Control-Allow-Credentials" not in denied.headers


def test_security_headers_cover_success_and_error_responses(client: Any) -> None:
    """Security headers must also cover errors, not only successful responses."""

    for response in (
        client.get("/api/v1/health"),
        client.get("/api/v1/does-not-exist"),
    ):
        for header, expected_value in SECURITY_HEADERS.items():
            assert response.headers[header] == expected_value


def test_production_enables_hsts_and_secure_session_cookies(
    app: Any,
    client: Any,
) -> None:
    """Production-only transport protections stay disabled on local HTTP."""

    assert ProductionConfig.SESSION_COOKIE_HTTPONLY is True
    assert ProductionConfig.SESSION_COOKIE_SAMESITE == "Lax"
    assert ProductionConfig.SESSION_COOKIE_SECURE is True

    app.config["SECURITY_HSTS_ENABLED"] = True
    response = client.get("/api/v1/health")

    assert response.headers["Strict-Transport-Security"] == (
        "max-age=31536000; includeSubDomains"
    )


def test_jwt_rejects_invalid_missing_and_inactive_users(
    app: Any,
    client: Any,
) -> None:
    """JWT revocation follows account existence and status for every role."""

    with app.app_context():
        active_user = User(
            email="active-token@test.com",
            first_name="Active",
            last_name="User",
            role="customer",
            status="active",
        )
        active_user.set_password("password123")
        suspended_user = User(
            email="suspended-token@test.com",
            first_name="Suspended",
            last_name="User",
            role="customer",
            status="suspended",
        )
        suspended_user.set_password("password123")
        banned_admin = User(
            email="banned-admin-token@test.com",
            first_name="Banned",
            last_name="Admin",
            role="admin",
            status="banned",
        )
        banned_admin.set_password("password123")

        db.session.add_all([active_user, suspended_user, banned_admin])
        db.session.commit()

        tokens = {
            "active": create_access_token(identity=str(active_user.id)),
            "suspended": create_access_token(identity=str(suspended_user.id)),
            "banned_admin": create_access_token(identity=str(banned_admin.id)),
            "missing": create_access_token(identity="999999999"),
            "invalid": create_access_token(identity="not-an-integer"),
        }

    def get_current_user(token: str) -> Any:
        return client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert get_current_user(tokens["active"]).status_code == 200

    for rejected_token in (
        tokens["suspended"],
        tokens["banned_admin"],
        tokens["missing"],
        tokens["invalid"],
    ):
        response = get_current_user(rejected_token)

        assert response.status_code == 401
        assert response.get_json()["msg"] == "Token has been revoked"


def test_login_rate_limit_returns_json_429() -> None:
    """Repeated login attempts are throttled with the API error envelope."""
    limited_app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "rate-limit-test-secret-with-32-characters",
        "CORS_ORIGINS": ("http://localhost:5173",),
        "CLOUDINARY_CLOUD_NAME": "demo",
        "CLOUDINARY_API_KEY": "demo-key",
        "CLOUDINARY_API_SECRET": "demo-secret",
        "RATELIMIT_ENABLED": True,
        "RATELIMIT_STORAGE_URI": "memory://",
    })

    with limited_app.app_context():
        db.create_all()

    limited_client = limited_app.test_client()
    responses = [
        limited_client.post(
            "/api/v1/auth/login",
            json={
                "email": "unknown@test.com",
                "password": "password123",
            },
            environ_base={"REMOTE_ADDR": "203.0.113.10"},
        )
        for _attempt in range(6)
    ]

    assert [response.status_code for response in responses[:5]] == [401] * 5
    assert responses[5].status_code == 429
    assert responses[5].get_json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"

    with limited_app.app_context():
        db.session.remove()
        db.drop_all()


def test_production_rejects_a_weak_jwt_secret() -> None:
    """Production startup fails closed when the JWT secret is predictable."""
    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
        create_app({
            "TESTING": False,
            "JWT_COOKIE_SECURE": True,
            "JWT_SECRET_KEY": "change-me",
            "CORS_ORIGINS": ("https://purrfect-match.example",),
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "CLOUDINARY_CLOUD_NAME": "demo",
            "CLOUDINARY_API_KEY": "demo-key",
            "CLOUDINARY_API_SECRET": "demo-secret",
        })
