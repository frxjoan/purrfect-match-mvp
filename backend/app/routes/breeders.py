from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.breeder_profile import BreederProfile
from app.models.user import User

breeders_bp = Blueprint("breeders", __name__, url_prefix="/api/v1/breeders")


@breeders_bp.post("/apply")
@jwt_required()
def apply_as_breeder():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    if user.breeder_profile:
        return jsonify({
            "success": False,
            "error": {"message": "Breeder profile already exists."},
        }), 409

    data = request.get_json() or {}

    required_fields = ["business_name", "location"]
    missing_fields = [field for field in required_fields if not data.get(field)]

    if missing_fields:
        return jsonify({
            "success": False,
            "error": {
                "message": "Missing required fields.",
                "fields": missing_fields,
            },
        }), 400

    breeder_profile = BreederProfile(
        user_id=user.id,
        business_name=data["business_name"].strip(),
        bio=data.get("bio"),
        location=data["location"].strip(),
        certification_document_url=data.get("certification_document_url"),
        certification_status="pending",
    )

    user.role = "breeder"

    db.session.add(breeder_profile)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": "Breeder application submitted successfully.",
            "breeder_profile": breeder_profile.to_dict(),
        },
    }), 201


@breeders_bp.get("/me")
@jwt_required()
def get_my_breeder_profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user or not user.breeder_profile:
        return jsonify({
            "success": False,
            "error": {"message": "Breeder profile not found."},
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "breeder_profile": user.breeder_profile.to_dict(),
        },
    }), 200


@breeders_bp.patch("/me")
@jwt_required()
def update_my_breeder_profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user or not user.breeder_profile:
        return jsonify({
            "success": False,
            "error": {"message": "Breeder profile not found."},
        }), 404

    data = request.get_json() or {}
    breeder_profile = user.breeder_profile

    allowed_fields = ["business_name", "bio", "location"]

    for field in allowed_fields:
        if field in data:
            value = data[field]
            if isinstance(value, str):
                value = value.strip()
            setattr(breeder_profile, field, value)

    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": "Breeder profile updated successfully.",
            "breeder_profile": breeder_profile.to_dict(),
        },
    }), 200


@breeders_bp.get("/<int:breeder_id>")
def get_public_breeder_profile(breeder_id):
    breeder_profile = db.session.get(BreederProfile, breeder_id)

    if not breeder_profile:
        return jsonify({
            "success": False,
            "error": {"message": "Breeder profile not found."},
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "breeder_profile": breeder_profile.to_dict(),
        },
    }), 200
