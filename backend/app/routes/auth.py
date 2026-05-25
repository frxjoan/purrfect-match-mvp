from flask import Blueprint, jsonify

auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')


@auth_bp.get('')
def auth_index():
  return jsonify({'message': 'Authentication routes placeholder', 'resource': 'auth'})


@auth_bp.post('/login')
def login():
  return jsonify({'message': 'Login endpoint placeholder', 'resource': 'auth'})


@auth_bp.post('/register')
def register():
  return jsonify({'message': 'Register endpoint placeholder', 'resource': 'auth'})
