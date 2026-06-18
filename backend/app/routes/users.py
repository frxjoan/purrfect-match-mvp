from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")


@users_bp.get("/me")
@jwt_required()
def get_own_profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({
            "success": False,
            "error": {
                "code": "USER_NOT_FOUND",
                "message": "User not found.",
            },
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "user": user.to_dict(),
        },
    }), 200


@users_bp.patch("/me")
@jwt_required()
def update_own_profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({
            "success": False,
            "error": {
                "code": "USER_NOT_FOUND",
                "message": "User not found.",
            },
        }), 404

    data = request.get_json() or {}

    allowed_fields = [
        "first_name",
        "last_name",
        "phone_number",
        "location",
        "profile_picture_url",
    ]

    for field in allowed_fields:
        if field in data:
            value = data[field]
            if isinstance(value, str):
                value = value.strip()
            setattr(user, field, value)

    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": "Profile updated successfully.",
            "user": user.to_dict(),
        },
    }), 200


@users_bp.get("/<int:user_id>")
def get_public_user_profile(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "error": {
                "code": "USER_NOT_FOUND",
                "message": "User not found.",
            },
        }), 404

    public_user = {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "location": user.location,
        "profile_picture_url": user.profile_picture_url,
        "role": user.role,
    }

    return jsonify({
        "success": True,
        "data": {
            "user": public_user,
        },
    }), 200
