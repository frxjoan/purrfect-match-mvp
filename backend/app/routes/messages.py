from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User
from app.models.message import Message

messages_bp = Blueprint(
    "messages",
    __name__,
    url_prefix="/api/v1/messages",
)


def can_access_conversation(user, conversation):
    if conversation.customer_id == user.id:
        return True

    if user.breeder_profile and conversation.breeder_id == user.breeder_profile.id:
        return True

    return False


@messages_bp.patch("/<int:message_id>/read")
@jwt_required()
def mark_message_as_read(message_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    message = db.session.get(Message, message_id)

    if not message:
        return jsonify({
            "success": False,
            "error": {"message": "Message not found."},
        }), 404

    if not can_access_conversation(user, message.conversation):
        return jsonify({
            "success": False,
            "error": {"message": "Unauthorized to read this message."},
        }), 403

    if message.sender_id == user.id:
        return jsonify({
            "success": False,
            "error": {"message": "You cannot mark your own message as read."},
        }), 400

    message.is_read = True
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": message.to_dict(),
        },
    }), 200
