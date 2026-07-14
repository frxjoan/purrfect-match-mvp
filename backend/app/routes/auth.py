"""Authentication API routes for registration, login, and current-user lookup."""

from typing import Any


from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.extensions import db
from app.models.account_restriction import AccountRestriction
from app.models.user import User

auth_bp: Blueprint = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


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


@auth_bp.get("")
def auth_index() -> Any:
    """Return a lightweight description of the authentication resource."""
    return jsonify({"message": "Authentication routes", "resource": "auth"}), 200


@auth_bp.post("/register")
def register() -> Any:
    """Create a new customer account after validating registration data."""
    data = request.get_json() or {}

    required_fields = ["email", "password", "first_name", "last_name"]
    missing_fields = [field for field in required_fields if not data.get(field)]

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
    role = str(data.get("role", "customer")).strip().lower()

    if role not in {"customer", "breeder"}:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Role must be customer or breeder.",
            },
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Password must be at least 8 characters long.",
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
        first_name=data["first_name"].strip(),
        last_name=data["last_name"].strip(),
        role=role,
        phone_number=data.get("phone_number"),
        location=data.get("location"),
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
def login() -> Any:
    """Authenticate a user and return a JWT access token."""
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Email and password are required.",
            },
        }), 400

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

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "success": True,
        "data": {
            "token": access_token,
            "user": user.to_dict(),
        },
    }), 200


@auth_bp.get("/me")
@jwt_required()
def get_current_user() -> Any:
    """Return the authenticated user from the current JWT identity."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

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