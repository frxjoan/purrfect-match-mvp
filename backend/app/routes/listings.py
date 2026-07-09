"""Listing API routes for browsing, creating, reporting, and deleting listings."""

from typing import Any


from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User
from app.models.cat_listing import CatListing
from app.models.listing_report import ALLOWED_REPORT_REASONS, ListingReport
from app.models.listing_image import ListingImage
from app.services.cloudinary_service import upload_listing_image

listings_bp: Blueprint = Blueprint("listings", __name__, url_prefix="/api/v1/listings")


@listings_bp.get("")
def list_listings() -> Response | tuple[Response, int]:
    """Return non-archived listings filtered by query parameters."""

    query = CatListing.query.filter(CatListing.status != "archived")

    breed = request.args.get("breed")
    location = request.args.get("location")
    min_price = request.args.get("min_price")
    max_price = request.args.get("max_price")
    age_max = request.args.get("age_max")
    gender = request.args.get("gender")
    status = request.args.get("status")
    sort = request.args.get("sort", "newest")

    if breed:
        query = query.filter(CatListing.breed.ilike(f"%{breed}%"))

    if location:
        query = query.filter(CatListing.location.ilike(f"%{location}%"))

    if gender:
        if gender not in ["male", "female"]:
            return jsonify({
                "success": False,
                "error": {"message": "Gender must be 'male' or 'female'."}
            }), 400

        query = query.filter(CatListing.gender == gender)

    if min_price:
        try:
            min_price = float(min_price)
            if min_price < 0:
                raise ValueError
            query = query.filter(CatListing.price >= min_price)
        except ValueError:
            return jsonify({
                "success": False,
                "error": {"message": "min_price must be a positive number."}
            }), 400

    if max_price:
        try:
            max_price = float(max_price)
            if max_price < 0:
                raise ValueError
            query = query.filter(CatListing.price <= max_price)
        except ValueError:
            return jsonify({
                "success": False,
                "error": {"message": "max_price must be a positive number."}
            }), 400

    if age_max:
        try:
            age_max = int(age_max)
            if age_max < 0:
                raise ValueError
            query = query.filter(CatListing.age_months <= age_max)
        except ValueError:
            return jsonify({
                "success": False,
                "error": {"message": "age_max must be a positive integer."}
            }), 400

    if status:
        allowed_statuses = ["available", "reserved", "sold"]

        if status not in allowed_statuses:
            return jsonify({
                "success": False,
                "error": {
                    "message": "Status must be available, reserved or sold."
                }
            }), 400

        query = query.filter(CatListing.status == status)

    if sort == "price_asc":
        query = query.order_by(CatListing.price.asc())
    elif sort == "price_desc":
        query = query.order_by(CatListing.price.desc())
    elif sort == "oldest":
        query = query.order_by(CatListing.created_at.asc())
    else:
        query = query.order_by(CatListing.created_at.desc())

    listings = query.all()

    return jsonify({
        "success": True,
        "data": {
            "count": len(listings),
            "listings": [listing.to_dict() for listing in listings]
        }
    }), 200


@listings_bp.get("/<int:listing_id>")
def get_listing(listing_id: int) -> Response | tuple[Response, int]:
    """Return a public listing by identifier."""
    listing = db.session.get(CatListing, listing_id)

    if not listing or listing.status == "archived":
        return jsonify({"success": False, "error": {"message": "Listing not found."}}), 404

    return jsonify({"success": True, "data": listing.to_dict()}), 200


@listings_bp.post("/<int:listing_id>/reports")
@jwt_required()
def report_listing(listing_id: int) -> Response | tuple[Response, int]:
    """Create a moderation report for a listing."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    listing = db.session.get(CatListing, listing_id)

    if not listing or listing.status == "archived":
        return jsonify({
            "success": False,
            "error": {"message": "Listing not found."},
        }), 404

    if user.breeder_profile and listing.breeder_id == user.breeder_profile.id:
        return jsonify({
            "success": False,
            "error": {"message": "You cannot report your own listing."},
        }), 403

    data: dict[str, Any] = request.get_json() or {}
    reason: Any = data.get("reason")

    if reason not in ALLOWED_REPORT_REASONS:
        return jsonify({
            "success": False,
            "error": {"message": "Invalid report reason."},
        }), 400

    existing_report = ListingReport.query.filter_by(
        reporter_id=user.id,
        listing_id=listing.id,
    ).first()

    if existing_report:
        return jsonify({
            "success": False,
            "error": {"message": "You have already reported this listing."},
        }), 409

    comment: Any = data.get("comment")
    if isinstance(comment, str):
        comment = comment.strip() or None

    report = ListingReport(
        listing_id=listing.id,
        reporter_id=user.id,
        reason=reason,
        comment=comment,
    )

    db.session.add(report)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "report": report.to_dict(),
        },
    }), 201


@listings_bp.delete("/<int:listing_id>")
@jwt_required()
def delete_own_listing(listing_id: int) -> Response | tuple[Response, int]:
    """Archive a listing owned by the authenticated breeder."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({
            "success": False,
            "error": {"message": "User not found."},
        }), 404

    if not user.breeder_profile:
        return jsonify({
            "success": False,
            "error": {"message": "Breeder profile required."},
        }), 403

    listing = db.session.get(CatListing, listing_id)

    if not listing or listing.status == "archived":
        return jsonify({
            "success": False,
            "error": {"message": "Listing not found."},
        }), 404

    if listing.breeder_id != user.breeder_profile.id:
        return jsonify({
            "success": False,
            "error": {"message": "You can only delete your own listings."},
        }), 403

    listing.status = "archived"
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": "Listing deleted successfully.",
            "listing": listing.to_dict(),
        },
    }), 200


@listings_bp.post("")
@jwt_required()
def create_listing() -> Response | tuple[Response, int]:
    """Create a new listing for a verified breeder."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    if not user.breeder_profile:
        return jsonify({"success": False, "error": {"message": "Breeder profile required."}}), 403

    if user.breeder_profile.certification_status != "verified":
        return jsonify({"success": False, "error": {"message": "Only verified breeders can create listings."}}), 403

    data = request.form

    required_fields: list[str] = ["title", "breed", "age_months", "gender", "price", "location"]
    missing_fields = [field for field in required_fields if not data.get(field)]

    if missing_fields:
        return jsonify({
            "success": False,
            "error": {
                "message": "Missing required fields.",
                "fields": missing_fields,
            },
        }), 400

    images: list[Any] = request.files.getlist("images")

    if not images:
        return jsonify({"success": False, "error": {"message": "At least one image is required."}}), 400

    try:
        age_months: int = int(data.get("age_months"))
        price: float = float(data.get("price"))
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": {"message": "age_months and price must be valid numbers."},
        }), 400

    if age_months < 0 or price < 0:
        return jsonify({
            "success": False,
            "error": {"message": "age_months and price must be positive values."},
        }), 400

    if data.get("gender") not in ["male", "female"]:
        return jsonify({
            "success": False,
            "error": {"message": "Gender must be 'male' or 'female'."},
        }), 400

    try:
        listing = CatListing(
            breeder_id=user.breeder_profile.id,
            title=data.get("title").strip(),
            breed=data.get("breed").strip(),
            age_months=age_months,
            gender=data.get("gender"),
            price=price,
            location=data.get("location").strip(),
            description=data.get("description"),
            status="available",
        )

        db.session.add(listing)
        db.session.flush()

        for index, image in enumerate(images):
            image_url: str = upload_listing_image(image)

            listing_image = ListingImage(
                listing_id=listing.id,
                image_url=image_url,
                is_main=index == 0,
            )

            db.session.add(listing_image)

        db.session.commit()

        return jsonify({
            "success": True,
            "data": listing.to_dict(),
        }), 201

    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": {"message": "Listing creation failed."},
        }), 500
