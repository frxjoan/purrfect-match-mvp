from flask import Blueprint, jsonify

listings_bp = Blueprint('listings', __name__, url_prefix='/api/v1/listings')


@listings_bp.get('')
def list_listings():
  return jsonify({'message': 'Listings routes placeholder', 'resource': 'listings'})
