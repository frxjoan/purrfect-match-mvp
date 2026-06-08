from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@auth_bp.get("")
def auth_index():
    return jsonify({"message": "Authentication routes", "resource": "auth"}), 200


@auth_bp.post("/register")
def register():
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

    user = User(
        email=email,
        first_name=data["first_name"].strip(),
        last_name=data["last_name"].strip(),
        role="customer",
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
def login():
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
def get_current_user():
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
