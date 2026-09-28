"""Authentication API routes for registration, login, and current-user lookup."""

from datetime import datetime, timezone
import re
from typing import Any

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_csrf_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    set_refresh_cookies,
    unset_jwt_cookies,
)

from app.extensions import db, limiter
from app.models.account_restriction import AccountRestriction
from app.models.user import User

auth_bp: Blueprint = Blueprint("auth", __name__, url_prefix="/api/v1/auth")
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MAX_EMAIL_LENGTH = 254
MAX_NAME_LENGTH = 100
MAX_PASSWORD_LENGTH = 128
MAX_PHONE_LENGTH = 30
MAX_LOCATION_LENGTH = 150


def validation_error(message: str) -> tuple[Any, int]:
    """Build a consistent validation-error response."""
    return jsonify({
        "success": False,
        "error": {"code": "VALIDATION_ERROR", "message": message},
    }), 400


def now_utc() -> Any:
    """Return the current timezone-aware UTC datetime."""

    return datetime.now(timezone.utc)


def as_aware_utc(value: Any) -> Any:
    """Ensure a datetime value is timezone-aware in UTC."""
    if value and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def get_active_email_restriction(email: Any) -> Any:
    """Return the active account restriction for an email address, if one exists."""
    restriction = AccountRestriction.query.filter_by(email=email).first()

    if restriction and restriction.is_active():
        return restriction

    return None


def moderation_error(message: Any) -> Any:
    """Build a standardized moderation error response."""
    return jsonify({
        "success": False,
        "error": {"message": message},
    }), 403


def get_user_from_jwt_identity() -> User | None:
    identity = get_jwt_identity()

    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None

    if user_id <= 0 or str(user_id) != str(identity):
        return None

    return db.session.get(User, user_id)


def token_response(user: User) -> Any:
    identity = str(user.id)
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)

    response = jsonify({
        'success': True,
        'data': {
            'access_token': access_token,
            # Temporary compatibility alias for existing frontend consumers.
            'token': access_token,
            'user': user.to_dict(),
            'refresh_csrf_token': get_csrf_token(refresh_token),
        },
    })
    response.headers['Cache-Control'] = 'no-store'
    response.headers['Pragma'] = 'no-cache'
    set_refresh_cookies(response, refresh_token)
    return response


@auth_bp.get("")
def auth_index() -> Any:
    """Return a lightweight description of the authentication resource."""
    return jsonify({"message": "Authentication routes", "resource": "auth"}), 200


@auth_bp.post("/register")
@limiter.limit("3 per minute")
def register() -> Any:
    """Create a new customer account after validating registration data."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return validation_error("A JSON object is required.")

    required_fields = ["email", "password", "first_name", "last_name"]
    missing_fields = [
        field
        for field in required_fields
        if not isinstance(data.get(field), str) or not data[field].strip()
    ]

    if missing_fields:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Missing required fields.",
                "fields": missing_fields,
            },
        }), 400

    email = data["email"].strip().lower()
    password = data["password"]
    first_name = data["first_name"].strip()
    last_name = data["last_name"].strip()
    role_value = data.get("role", "customer")
    phone_number = data.get("phone_number")
    location = data.get("location")

    if not isinstance(role_value, str):
        return validation_error("Role must be customer or breeder.")
    role = role_value.strip().lower()

    if len(email) > MAX_EMAIL_LENGTH or not EMAIL_PATTERN.fullmatch(email):
        return validation_error("A valid email address is required.")

    if len(first_name) > MAX_NAME_LENGTH or len(last_name) > MAX_NAME_LENGTH:
        return validation_error(
            "First and last names must be 100 characters or fewer."
        )

    if phone_number is not None and (
        not isinstance(phone_number, str)
        or len(phone_number.strip()) > MAX_PHONE_LENGTH
    ):
        return validation_error(
            "Phone number must be a string of 30 characters or fewer."
        )

    if location is not None and (
        not isinstance(location, str)
        or len(location.strip()) > MAX_LOCATION_LENGTH
    ):
        return validation_error(
            "Location must be a string of 150 characters or fewer."
        )

    if role not in {"customer", "breeder"}:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Role must be customer or breeder.",
            },
        }), 400

    if len(password) < 8 or len(password) > MAX_PASSWORD_LENGTH:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Password must be between 8 and 128 characters long.",
            },
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "success": False,
            "error": {
                "code": "EMAIL_ALREADY_EXISTS",
                "message": "An account with this email already exists.",
            },
        }), 409

    active_restriction = get_active_email_restriction(email)
    if active_restriction:
        if active_restriction.restriction_type == "ban":
            return moderation_error("This email address is banned.")

        return moderation_error("This email address is currently suspended.")

    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
        phone_number=phone_number.strip() if phone_number else None,
        location=location.strip() if location else None,
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": "Account created successfully.",
            "user": user.to_dict(),
        },
    }), 201


@auth_bp.post("/login")
@limiter.limit("5 per minute")
def login() -> Any:
    """Authenticate a user and return a JWT access token."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return validation_error("A JSON object is required.")

    email_value = data.get("email")
    password = data.get("password", "")

    if (
        not isinstance(email_value, str)
        or not isinstance(password, str)
        or not email_value.strip()
        or not password
    ):
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Email and password are required.",
            },
        }), 400

    email = email_value.strip().lower()
    if len(email) > MAX_EMAIL_LENGTH or len(password) > MAX_PASSWORD_LENGTH:
        return validation_error("Invalid email or password.")

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({
            "success": False,
            "error": {
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password.",
            },
        }), 401

    if user.status == "banned":
        return moderation_error("This account is banned.")

    if user.status == "suspended":
        suspended_until = as_aware_utc(user.suspended_until)

        if not suspended_until or suspended_until > now_utc():
            return moderation_error("This account is currently suspended.")

        user.status = "active"
        user.suspended_until = None
        user.moderation_reason = None
        db.session.commit()

    return token_response(user), 200


@auth_bp.get("/refresh/csrf")
@limiter.limit("60 per minute")
@jwt_required(refresh=True, locations=["cookies"])
def get_refresh_csrf() -> Any:
    """Return the refresh-token CSRF claim through the CORS allowlist."""
    csrf_token = get_jwt().get("csrf")
    if not isinstance(csrf_token, str) or not csrf_token:
        return jsonify({
            "success": False,
            "error": {
                "code": "INVALID_REFRESH_TOKEN",
                "message": "The refresh token has no CSRF claim.",
            },
        }), 401

    response = jsonify({
        "success": True,
        "data": {"refresh_csrf_token": csrf_token},
    })
    response.headers["Cache-Control"] = "no-store"
    return response, 200


@auth_bp.post("/refresh")
@limiter.limit("30 per minute")
@jwt_required(refresh=True, locations=["cookies"])
def refresh() -> Any:
    """Rotate the refresh cookie and return a new bearer access token."""
    user = get_user_from_jwt_identity()

    if not user or user.status != "active":
        response = jsonify({
            "success": False,
            "error": {
                "code": "INVALID_REFRESH_TOKEN",
                "message": "The refresh token is no longer valid.",
            },
        })
        unset_jwt_cookies(response)
        return response, 401

    return token_response(user), 200


@auth_bp.post("/logout")
@limiter.limit("30 per minute")
@jwt_required(refresh=True, locations=["cookies"])
def logout() -> Any:
    """Clear JWT cookies after validating the refresh token and CSRF header."""
    response = jsonify({
        "success": True,
        "data": {"message": "Logged out successfully."},
    })
    response.headers["Cache-Control"] = "no-store"
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.get("/me")
@jwt_required()
def get_current_user() -> Any:
    """Return the authenticated user from the current JWT identity."""
    user = get_user_from_jwt_identity()

    if not user:
        return jsonify({
            "success": False,
            "error": {
                "code": "USER_NOT_FOUND",
                "message": "Authenticated user no longer exists.",
            },
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "user": user.to_dict(),
        },
    }), 200
