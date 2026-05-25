from flask import Blueprint, jsonify

conversations_bp = Blueprint('conversations', __name__, url_prefix='/api/v1/conversations')


@conversations_bp.get('')
def list_conversations():
  return jsonify({'message': 'Conversations routes placeholder', 'resource': 'conversations'})
