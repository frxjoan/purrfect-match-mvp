"""Saved listing model connecting customers to favorited listings."""

from typing import Any


from datetime import datetime, timezone

from ..extensions import db


class SavedListing(db.Model):
    """Represent a customer favorite listing relationship."""

    __tablename__: str = 'saved_listings'

    __table_args__: tuple[Any, ...] = (
        db.UniqueConstraint('user_id', 'listing_id', name='uq_saved_listings_user_listing'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('cat_listings.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    user = db.relationship(
        'User',
        back_populates='saved_listings',
    )
    listing = db.relationship(
        'CatListing',
        back_populates='saved_by',
    )

    def to_dict(self) -> dict[str, Any]:
        """Serialize the model instance into an API-friendly dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "listing_id": self.listing_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
