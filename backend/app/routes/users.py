from flask import Blueprint, jsonify

users_bp = Blueprint('users', __name__, url_prefix='/api/v1/users')


@users_bp.get('')
def list_users():
  return jsonify({'message': 'Users routes placeholder', 'resource': 'users'})
