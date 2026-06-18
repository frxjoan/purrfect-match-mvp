from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.reviews import Review
from app.models.user import User
from app.routes.breeders import parse_rating

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api/v1/reviews")


def get_current_user():
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id))


def get_review_or_404(review_id):
    review = db.session.get(Review, review_id)

    if not review:
        return None, (
            jsonify({
                "success": False,
                "error": {"message": "Review not found."},
            }),
            404,
        )

    return review, None


def ensure_review_author(user, review):
    if review.reviewer_id != user.id:
        return (
            jsonify({
                "success": False,
                "error": {"message": "Unauthorized to modify this review."},
            }),
            403,
        )

    return None


@reviews_bp.patch("/<int:review_id>")
@jwt_required()
def update_review(review_id):
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    review, error_response = get_review_or_404(review_id)
    if error_response:
        return error_response

    author_error = ensure_review_author(user, review)
    if author_error:
        return author_error

    data = request.get_json() or {}

    if "rating" not in data and "comment" not in data:
        return jsonify({
            "success": False,
            "error": {"message": "rating or comment is required."},
        }), 400

    if "rating" in data:
        rating = parse_rating(data.get("rating"))

        if rating is None:
            return jsonify({
                "success": False,
                "error": {"message": "rating must be an integer between 1 and 5."},
            }), 400

        review.rating = rating

    if "comment" in data:
        comment = data.get("comment")
        if isinstance(comment, str):
            comment = comment.strip() or None
        review.comment = comment

    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "review": review.to_dict(),
        },
    }), 200


@reviews_bp.delete("/<int:review_id>")
@jwt_required()
def delete_review(review_id):
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    review, error_response = get_review_or_404(review_id)
    if error_response:
        return error_response

    author_error = ensure_review_author(user, review)
    if author_error:
        return author_error

    db.session.delete(review)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": "Review deleted successfully.",
        },
    }), 200
