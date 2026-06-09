from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.breeder_profile import BreederProfile
from app.models.user import User

admin_bp = Blueprint('admin', __name__, url_prefix='/api/v1/admin')


def get_current_admin():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user or not user.is_admin():
        return None
    return user

@admin_bp.get("/certifications")
@jwt_required()
def get_certification_applications():
    admin = get_current_admin()
    if not admin:
        return jsonify({
            "success": False,
            "error": {"message": "Admin access required."},
        }), 403
    pending_breeders = BreederProfile.query.filter_by(
        certification_status="pending"
    ).all()

    return jsonify({
        "success": True,
        "data": {
            "certifications": [
                breeder.to_dict() for breeder in pending_breeders
            ]
        },
    }), 200

@admin_bp.get("/certifications/<int:breeder_id>")
@jwt_required()
def get_certification_application(breeder_id):
    admin = get_current_admin()
    if not admin:
        return jsonify({
            "success": False,
            "error": {"message": "Admin access required."},
        }), 403
    
    breeder = db.session.get(BreederProfile, breeder_id)
    if not breeder:
        return jsonify({
            "success": False,
            "error": {"message": "Breeder profile not found."},
        }), 404
    
    return jsonify({
        "success": True,
        "data": {
            "breeder_profile": breeder.to_dict(),
        },
    }), 200

@admin_bp.post("/certifications/<int:breeder_id>/approve")
@jwt_required()
def approve_certification(breeder_id):
    admin = get_current_admin()
    if not admin:
        return jsonify({
            "success": False,
            "error": {"message": "Admin access required."},
        }), 403
    
    breeder = db.session.get(BreederProfile, breeder_id)
    if not breeder:
        return jsonify({
            "success": False,
            "error": {"message": "Breeder profile not found."},
        }), 404
    
    data = request.get_json() or {}

    breeder.certification_status = "verified"
    breeder.verified_at = datetime.utcnow()
    breeder.certification_admin_comment = data.get("comment")

    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "breeder_profile": breeder.to_dict(),
        },
    }), 200

@admin_bp.post("/certifications/<int:breeder_id>/reject")
@jwt_required()
def reject_certification(breeder_id):
    admin = get_current_admin()
    if not admin:
        return jsonify({
            "success": False,
            "error": {"message": "Admin access required."},
        }), 403
    
    breeder = db.session.get(BreederProfile, breeder_id)
    if not breeder:
        return jsonify({
            "success": False,
            "error": {"message": "Breeder profile not found."},
        }), 404
    
    data = request.get_json() or {}

    comment = data.get("comment", "").strip()

    if not comment:
        return jsonify({
            "success": False,
            "error": {
                "message": "A rejection comment is required.",
            },
        }), 400

    breeder.certification_status = "rejected"
    breeder.verified_at = None
    breeder.certification_admin_comment = comment

    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "breeder_profile": breeder.to_dict(),
        },
    }), 200
