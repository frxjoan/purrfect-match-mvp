from flask import Blueprint, jsonify

admin_bp = Blueprint('admin', __name__, url_prefix='/api/v1/admin')


@admin_bp.get('')
def admin_index():
  return jsonify({'message': 'Admin routes placeholder', 'resource': 'admin'})
