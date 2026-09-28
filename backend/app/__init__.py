"""Flask application factory for the Purrfect Match backend."""

from typing import Any


from flask import Flask, Response, jsonify, request

from . import models
from .config.settings import get_config
from .extensions import (
    db,
    migrate,
    jwt,
    cors,
    limiter,
    configure_cloudinary
)
from .routes import register_blueprints


def _validate_runtime_security(app: Flask) -> None:
    """Refuse an unsafe production configuration before serving requests."""

    if app.config.get("TESTING") or not app.config.get("JWT_COOKIE_SECURE"):
        return

    secret = app.config.get("JWT_SECRET_KEY")
    weak_secrets = {
        "",
        "change-me",
        "change-this-secret-key-to-at-least-32-characters",
    }
    if not isinstance(secret, str) or len(secret) < 32 or secret in weak_secrets:
        raise RuntimeError(
            "JWT_SECRET_KEY must be a unique secret of at least 32 characters "
            "in production."
        )

    if not app.config.get("CORS_ORIGINS"):
        raise RuntimeError(
            "FRONTEND_URL or CORS_ORIGINS must be configured in production."
        )


def create_app(test_config: Any = None) -> Any:
    """Create and configure the Flask application instance."""

    app = Flask(__name__)

    # Load configuration
    app.config.from_object(get_config())

    # Override config for tests
    if test_config:
        app.config.update(test_config)

    if (
        app.config.get("TESTING")
        and "RATELIMIT_ENABLED" not in (test_config or {})
    ):
        app.config["RATELIMIT_ENABLED"] = False

    _validate_runtime_security(app)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    @jwt.token_in_blocklist_loader
    def is_token_blocked(
        _jwt_header: dict[str, Any],
        jwt_payload: dict[str, Any],
    ) -> bool:
        """Reject tokens that no longer belong to an active account."""

        identity = jwt_payload.get("sub")

        if isinstance(identity, bool):
            return True

        try:
            user_id = int(identity)
        except (TypeError, ValueError):
            return True

        if user_id <= 0 or str(user_id) != str(identity):
            return True

        from .models import User

        user = db.session.get(User, user_id)
        return user is None or user.status != "active"

    jwt.init_app(app)
    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": [
                    "Authorization",
                    "Content-Type",
                    "X-CSRF-TOKEN",
                ],
                "supports_credentials": True,
                "max_age": 600,
            },
        },
    )
    limiter.init_app(app)

    # External services
    configure_cloudinary(app)

    # Register blueprints
    register_blueprints(app)

    @app.errorhandler(413)
    def request_too_large(_error: Exception) -> tuple[Response, int]:
        """Return JSON when a request exceeds the configured body limit."""
        return jsonify({
            "success": False,
            "error": {"message": "Request body is too large."},
        }), 413

    @app.errorhandler(429)
    def rate_limit_exceeded(_error: Exception) -> tuple[Response, int]:
        """Return the standard API envelope for throttled requests."""
        response = jsonify({
            "success": False,
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Too many requests. Please try again later.",
            },
        })
        response.headers["Retry-After"] = "60"
        return response, 429

    @app.after_request
    def add_security_headers(response: Response) -> Response:
        """Attach browser security headers to every API response."""

        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
        )
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), geolocation=(), microphone=()",
        )

        if request.headers.get("Authorization") or request.endpoint in {
            "auth.login",
            "auth.logout",
            "auth.refresh",
            "auth.get_refresh_csrf",
            "auth.get_current_user",
        }:
            response.headers.setdefault("Cache-Control", "no-store")

        if app.config["SECURITY_HSTS_ENABLED"]:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )

        return response

    return app
