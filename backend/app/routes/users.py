from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.cat_listing import CatListing
from app.models.saved_listing import SavedListing
from app.models.user import User

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")


def get_current_user():
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id))


def serialize_saved_listings(user):
    saved_items = (
        SavedListing.query.join(CatListing)
        .filter(
            SavedListing.user_id == user.id,
            CatListing.status != "archived",
        )
        .order_by(SavedListing.created_at.desc())
        .all()
    )

    listings = [saved_item.listing.to_dict() for saved_item in saved_items]

    return {
        "count": len(saved_items),
        "saved_listing_ids": [saved_item.listing_id for saved_item in saved_items],
        "saved_listings": [saved_item.to_dict() for saved_item in saved_items],
        "listings": listings,
    }


@users_bp.get("/me")
@jwt_required()
def get_own_profile():
    user = get_current_user()

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
    user = get_current_user()

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


@users_bp.get("/me/saved-listings")
@jwt_required()
def list_saved_listings():
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    return jsonify({
        "success": True,
        "data": serialize_saved_listings(user),
    }), 200


@users_bp.post("/me/saved-listings")
@jwt_required()
def save_listing():
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    data = request.get_json() or {}
    listing_id = data.get("listing_id")

    try:
        listing_id = int(listing_id)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": {"message": "listing_id must be an integer."},
        }), 400

    listing = db.session.get(CatListing, listing_id)

    if not listing or listing.status == "archived":
        return jsonify({
            "success": False,
            "error": {"message": "Listing not found."},
        }), 404

    saved_listing = SavedListing.query.filter_by(
        user_id=user.id,
        listing_id=listing.id,
    ).first()

    if not saved_listing:
        saved_listing = SavedListing(user_id=user.id, listing_id=listing.id)
        db.session.add(saved_listing)
        db.session.commit()

    return jsonify({
        "success": True,
        "data": serialize_saved_listings(user),
    }), 200


@users_bp.delete("/me/saved-listings/<int:listing_id>")
@jwt_required()
def unsave_listing(listing_id):
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    saved_listing = SavedListing.query.filter_by(
        user_id=user.id,
        listing_id=listing_id,
    ).first()

    if saved_listing:
        db.session.delete(saved_listing)
        db.session.commit()

    return jsonify({
        "success": True,
        "data": serialize_saved_listings(user),
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
