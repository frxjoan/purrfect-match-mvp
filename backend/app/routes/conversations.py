from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_

from app.extensions import db
from app.models.user import User
from app.models.cat_listing import CatListing
from app.models.conversation import Conversation
from app.models.message import Message

conversations_bp = Blueprint(
    "conversations",
    __name__,
    url_prefix="/api/v1/conversations",
)


def get_current_user():
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id))


def can_access_conversation(user, conversation):
    if conversation.customer_id == user.id:
        return True

    if user.breeder_profile and conversation.breeder_id == user.breeder_profile.id:
        return True

    return False


@conversations_bp.get("")
@jwt_required()
def list_conversations():
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    query = Conversation.query.filter(Conversation.customer_id == user.id)

    if user.breeder_profile:
        query = Conversation.query.filter(
            or_(
                Conversation.customer_id == user.id,
                Conversation.breeder_id == user.breeder_profile.id,
            )
        )

    conversations = query.order_by(Conversation.updated_at.desc()).all()

    return jsonify({
        "success": True,
        "data": {
            "count": len(conversations),
            "conversations": [
                conversation.to_dict() for conversation in conversations
            ],
        },
    }), 200


@conversations_bp.post("")
@jwt_required()
def start_conversation():
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    data = request.get_json() or {}
    listing_id = data.get("listing_id")

    if not listing_id:
        return jsonify({
            "success": False,
            "error": {"message": "listing_id is required."},
        }), 400

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

    if user.breeder_profile and listing.breeder_id == user.breeder_profile.id:
        return jsonify({
            "success": False,
            "error": {"message": "You cannot start a conversation on your own listing."},
        }), 403

    existing_conversation = Conversation.query.filter_by(
        customer_id=user.id,
        breeder_id=listing.breeder_id,
        listing_id=listing.id,
    ).first()

    if existing_conversation:
        return jsonify({
            "success": True,
            "data": {
                "conversation": existing_conversation.to_dict(include_messages=True),
            },
        }), 200

    conversation = Conversation(
        customer_id=user.id,
        breeder_id=listing.breeder_id,
        listing_id=listing.id,
    )

    db.session.add(conversation)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "conversation": conversation.to_dict(include_messages=True),
        },
    }), 201


@conversations_bp.get("/<int:conversation_id>")
@jwt_required()
def get_conversation(conversation_id):
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    conversation = db.session.get(Conversation, conversation_id)

    if not conversation:
        return jsonify({
            "success": False,
            "error": {"message": "Conversation not found."},
        }), 404

    if not can_access_conversation(user, conversation):
        return jsonify({
            "success": False,
            "error": {"message": "Unauthorized to access this conversation."},
        }), 403

    return jsonify({
        "success": True,
        "data": {
            "conversation": conversation.to_dict(include_messages=True),
        },
    }), 200


@conversations_bp.get("/<int:conversation_id>/messages")
@jwt_required()
def list_messages(conversation_id):
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    conversation = db.session.get(Conversation, conversation_id)

    if not conversation:
        return jsonify({
            "success": False,
            "error": {"message": "Conversation not found."},
        }), 404

    if not can_access_conversation(user, conversation):
        return jsonify({
            "success": False,
            "error": {"message": "Unauthorized to access this conversation."},
        }), 403

    return jsonify({
        "success": True,
        "data": {
            "messages": [message.to_dict() for message in conversation.messages],
        },
    }), 200


@conversations_bp.post("/<int:conversation_id>/messages")
@jwt_required()
def send_message(conversation_id):
    user = get_current_user()

    if not user:
        return jsonify({"success": False, "error": {"message": "User not found."}}), 404

    conversation = db.session.get(Conversation, conversation_id)

    if not conversation:
        return jsonify({
            "success": False,
            "error": {"message": "Conversation not found."},
        }), 404

    if not can_access_conversation(user, conversation):
        return jsonify({
            "success": False,
            "error": {"message": "Unauthorized to send a message in this conversation."},
        }), 403

    data = request.get_json() or {}
    content = data.get("content", "").strip()

    if not content:
        return jsonify({
            "success": False,
            "error": {"message": "Message content is required."},
        }), 400

    message = Message(
        conversation_id=conversation.id,
        sender_id=user.id,
        content=content,
    )

    conversation.updated_at = datetime.now(datetime.UTC)()

    db.session.add(message)
    db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "message": message.to_dict(),
        },
    }), 201
