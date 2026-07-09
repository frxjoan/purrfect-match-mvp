"""Admin API routes for dashboard stats, moderation, certifications, and users."""

from typing import Any


from datetime import datetime, timezone

from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func, or_

from app.extensions import db
from app.models.account_restriction import AccountRestriction, RESTRICTION_TYPES
from app.models.breeder_profile import BreederProfile
from app.models.cat_listing import CatListing
from app.models.conversation import Conversation
from app.models.listing_report import REPORT_STATUSES, ListingReport
from app.models.message import Message
from app.models.reviews import Review
from app.models.user import User

admin_bp: Blueprint = Blueprint('admin', __name__, url_prefix='/api/v1/admin')


def get_current_admin() -> User | None:
    """Return the authenticated admin user, if available."""

    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user or not user.is_admin():
        return None
    return user


def admin_required_response() -> tuple[Response, int]:
    """Build a standardized admin-only error response."""
    return jsonify({
        "success": False,
        "error": {"message": "Admin access required."},
    }), 403


def parse_datetime(value: Any) -> datetime | None:
    """Parse an ISO datetime string into a timezone-aware datetime."""
    if not value:
        return None

    if not isinstance(value, str):
        return None

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed


def archive_breeder_listings(user: User) -> int:
    """Archive all active listings for a breeder user."""
    if not user.breeder_profile:
        return 0

    updated = CatListing.query.filter(
        CatListing.breeder_id == user.breeder_profile.id,
        CatListing.status != "archived",
    ).update({"status": "archived"}, synchronize_session=False)

    return updated


def apply_account_restriction(
    user: User,
    admin: User,
    restriction_type: str,
    reason: str,
    expires_at: datetime | None = None,
) -> tuple[AccountRestriction, int]:
    """Apply a suspension or ban to a user account."""
    user.email = user.email.strip().lower()

    restriction = AccountRestriction.query.filter_by(email=user.email).first()

    if not restriction:
        restriction = AccountRestriction(email=user.email)
        db.session.add(restriction)

    restriction.user_id = user.id
    restriction.restriction_type = restriction_type
    restriction.reason = reason
    restriction.admin_id = admin.id
    restriction.expires_at = expires_at

    user.moderation_reason = reason

    archived_count = 0
    if restriction_type == "ban":
        user.status = "banned"
        user.suspended_until = None
        archived_count = archive_breeder_listings(user)
    else:
        user.status = "suspended"
        user.suspended_until = expires_at

    return restriction, archived_count


def count_rows(model: Any) -> int:
    """Return the total row count for a model."""
    return db.session.query(func.count(model.id)).scalar() or 0


def count_users_by_role(role: str) -> int:
    """Return the number of users for a specific role."""
    return (
        db.session.query(func.count(User.id))
        .filter(User.role == role)
        .scalar()
        or 0
    )


def count_listings_by_status(status: str) -> int:
    """Return the number of listings for a specific status."""
    return (
        db.session.query(func.count(CatListing.id))
        .filter(CatListing.status == status)
        .scalar()
        or 0
    )


@admin_bp.get("/stats")
@jwt_required()
def get_admin_stats() -> Response | tuple[Response, int]:
    """Return aggregate dashboard statistics for admins."""
    admin = get_current_admin()
    if not admin:
        return admin_required_response()

    pending_certifications = (
        db.session.query(func.count(BreederProfile.id))
        .filter(BreederProfile.certification_status == "pending")
        .scalar()
        or 0
    )
    pending_reports = (
        db.session.query(func.count(ListingReport.id))
        .filter(ListingReport.status == "pending")
        .scalar()
        or 0
    )

    return jsonify({
        "success": True,
        "data": {
            "stats": {
                "total_users": count_rows(User),
                "total_customers": count_users_by_role("customer"),
                "total_breeders": count_users_by_role("breeder"),
                "total_admins": count_users_by_role("admin"),
                "total_listings": count_rows(CatListing),
                "active_listings": (
                    count_rows(CatListing) - count_listings_by_status("archived")
                ),
                "available_listings": count_listings_by_status("available"),
                "reserved_listings": count_listings_by_status("reserved"),
                "sold_listings": count_listings_by_status("sold"),
                "archived_listings": count_listings_by_status("archived"),
                "pending_certifications": pending_certifications,
                "pending_reports": pending_reports,
                "total_reviews": count_rows(Review),
                "total_conversations": count_rows(Conversation),
                "total_messages": count_rows(Message),
            },
        },
    }), 200

@admin_bp.get("/certifications")
@jwt_required()
def get_certification_applications() -> Response | tuple[Response, int]:
    """Return pending breeder certification applications."""
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
def get_certification_application(breeder_id: int) -> Response | tuple[Response, int]:
    """Return one breeder certification application."""
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
def approve_certification(breeder_id: int) -> Response | tuple[Response, int]:
    """Approve a breeder certification application."""
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
def reject_certification(breeder_id: int) -> Response | tuple[Response, int]:
    """Reject a breeder certification application with a comment."""
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
def list_listing_reports() -> Response | tuple[Response, int]:
    """Return listing reports filtered by moderation status."""
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
def get_listing_report(report_id: int) -> Response | tuple[Response, int]:
    """Return one listing report for admin review."""
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
def review_listing_report(report_id: int) -> Response | tuple[Response, int]:
    """Accept or reject a listing report."""
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



@admin_bp.delete("/listings/<int:listing_id>")
@jwt_required()
def delete_listing_as_admin(listing_id: int) -> Response | tuple[Response, int]:
    """Archive a listing through admin moderation."""
    admin = get_current_admin()
    if not admin:
        return admin_required_response()

    listing = db.session.get(CatListing, listing_id)

    if not listing:
        return jsonify({
            "success": False,
            "error": {"message": "Listing not found."},
        }), 404

    listing.status = "archived"
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": "Listing archived by admin.",
            "listing": listing.to_dict(),
        },
    }), 200

@admin_bp.get("/users")
@jwt_required()
def list_admin_users() -> Response | tuple[Response, int]:
    """Return users visible from the admin panel."""
    admin = get_current_admin()
    if not admin:
        return admin_required_response()

    role = request.args.get("role")
    status = request.args.get("status")
    search = request.args.get("search")

    query = User.query

    if role:
        if role not in ["customer", "breeder", "admin"]:
            return jsonify({
                "success": False,
                "error": {"message": "Invalid user role."},
            }), 400
        query = query.filter(User.role == role)

    if status:
        if status not in ["active", "suspended", "banned"]:
            return jsonify({
                "success": False,
                "error": {"message": "Invalid user status."},
            }), 400
        query = query.filter(User.status == status)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.email.ilike(pattern),
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
            )
        )

    users = query.order_by(User.created_at.desc()).all()

    return jsonify({
        "success": True,
        "data": {
            "count": len(users),
            "users": [user.to_dict() for user in users],
        },
    }), 200

@admin_bp.post("/users/<int:user_id>/restrictions")
@jwt_required()
def restrict_user(user_id: Any) -> Any:
    """Create or update an account restriction for a user."""
    admin = get_current_admin()
    if not admin:
        return admin_required_response()

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "error": {"message": "User not found."},
        }), 404

    data = request.get_json() or {}
    restriction_type = data.get("restriction_type")

    if restriction_type not in RESTRICTION_TYPES:
        return jsonify({
            "success": False,
            "error": {"message": "restriction_type must be suspension or ban."},
        }), 400

    reason = data.get("reason", "")
    if isinstance(reason, str):
        reason = reason.strip()

    if not reason:
        return jsonify({
            "success": False,
            "error": {"message": "reason is required."},
        }), 400

    expires_at = parse_datetime(data.get("expires_at"))
    if data.get("expires_at") and not expires_at:
        return jsonify({
            "success": False,
            "error": {"message": "expires_at must be a valid ISO datetime."},
        }), 400

    if restriction_type == "ban":
        expires_at = None

    restriction, archived_count = apply_account_restriction(
        user,
        admin,
        restriction_type,
        reason,
        expires_at,
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "restriction": restriction.to_dict(),
            "user": user.to_dict(),
            "archived_listings_count": archived_count,
        },
    }), 201


@admin_bp.delete("/users/<int:user_id>/restrictions")
@jwt_required()
def lift_user_restriction(user_id: Any) -> Any:
    """Remove an account restriction from a user."""
    admin = get_current_admin()
    if not admin:
        return admin_required_response()

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "error": {"message": "User not found."},
        }), 404

    restriction = AccountRestriction.query.filter_by(email=user.email).first()

    if restriction:
        db.session.delete(restriction)

    user.status = "active"
    user.suspended_until = None
    user.moderation_reason = None

    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": "Account restriction lifted.",
            "user": user.to_dict(),
        },
    }), 200
