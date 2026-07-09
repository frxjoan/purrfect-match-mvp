"""Message model for buyer and breeder conversations."""

from typing import Any


from datetime import datetime, timezone

from ..extensions import db

class Message(db.Model):
    """Represent one message sent inside a conversation."""

    __tablename__: str = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    conversation = db.relationship(
        'Conversation',
        back_populates='messages',
    )
    sender = db.relationship(
        'User',
        back_populates='messages',
        foreign_keys=[sender_id],
    )

    def to_dict(self) -> dict[str, Any]:
        """Serialize the model instance into an API-friendly dictionary."""
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "sender_id": self.sender_id,
            "content": self.content,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
