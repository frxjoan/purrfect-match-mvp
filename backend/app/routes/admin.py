from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.breeder_profile import BreederProfile
from app.models.listing_report import REPORT_STATUSES, ListingReport
from app.models.user import User

admin_bp = Blueprint('admin', __name__, url_prefix='/api/v1/admin')


def get_current_admin():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user or not user.is_admin():
        return None
    return user


def admin_required_response():
    return jsonify({
        "success": False,
        "error": {"message": "Admin access required."},
    }), 403

@admin_bp.get("/certifications")
@jwt_required()
def get_certification_applications():
    admin = get_current_admin()
    if not admin:
        return admin_required_response()
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
        return admin_required_response()
    
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
        return admin_required_response()
    
    breeder = db.session.get(BreederProfile, breeder_id)
    if not breeder:
        return jsonify({
            "success": False,
            "error": {"message": "Breeder profile not found."},
        }), 404
    
    data = request.get_json() or {}

    breeder.certification_status = "verified"
    breeder.verified_at = datetime.now(timezone.utc)
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
        return admin_required_response()
    
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


@admin_bp.get("/reports")
@jwt_required()
def list_listing_reports():
    admin = get_current_admin()
    if not admin:
        return admin_required_response()

    status = request.args.get("status", "pending")

    query = ListingReport.query
    if status != "all":
        if status not in REPORT_STATUSES:
            return jsonify({
                "success": False,
                "error": {"message": "Invalid report status."},
            }), 400
        query = query.filter_by(status=status)

    reports = query.order_by(ListingReport.created_at.desc()).all()

    return jsonify({
        "success": True,
        "data": {
            "count": len(reports),
            "reports": [report.to_dict() for report in reports],
        },
    }), 200


@admin_bp.get("/reports/<int:report_id>")
@jwt_required()
def get_listing_report(report_id):
    admin = get_current_admin()
    if not admin:
        return admin_required_response()

    report = db.session.get(ListingReport, report_id)

    if not report:
        return jsonify({
            "success": False,
            "error": {"message": "Report not found."},
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "report": report.to_dict(),
        },
    }), 200


@admin_bp.patch("/reports/<int:report_id>")
@jwt_required()
def review_listing_report(report_id):
    admin = get_current_admin()
    if not admin:
        return admin_required_response()

    report = db.session.get(ListingReport, report_id)

    if not report:
        return jsonify({
            "success": False,
            "error": {"message": "Report not found."},
        }), 404

    data = request.get_json() or {}
    decision = data.get("decision")

    if decision not in ["accepted", "rejected"]:
        return jsonify({
            "success": False,
            "error": {"message": "decision must be accepted or rejected."},
        }), 400

    admin_comment = data.get("admin_comment")
    if isinstance(admin_comment, str):
        admin_comment = admin_comment.strip() or None

    report.status = decision
    report.admin_comment = admin_comment
    report.reviewed_by = admin.id
    report.reviewed_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "report": report.to_dict(),
        },
    }), 200
