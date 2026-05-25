from flask import Blueprint, jsonify

breeders_bp = Blueprint('breeders', __name__, url_prefix='/api/v1/breeders')


@breeders_bp.get('')
def list_breeders():
  return jsonify({'message': 'Breeders routes placeholder', 'resource': 'breeders'})
