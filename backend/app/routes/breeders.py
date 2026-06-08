from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import BreederProfile

breeders_bp = Blueprint('breeders', __name__, url_prefix='/api/v1/breeders')


@breeders_bp.get('')
def list_breeders():
  return jsonify({'message': 'Breeders routes placeholder', 'resource': 'breeders'})

@breeders_bp.get('/me')
@jwt_required()
def get_own_breeder_profile():
    user_id = get_jwt_identity()
    breeder_profile = db.session.query(BreederProfile).filter_by(user_id=user_id).first()

    if not breeder_profile:
        return jsonify({
            "success": False,
            "error": {
                "code": "BREEDER_PROFILE_NOT_FOUND",
                "message": "Breeder profile not found for the current user.",
            },
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "breeder_profile": breeder_profile.to_dict(),
        },
    }), 200

