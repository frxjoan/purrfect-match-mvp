from datetime import datetime, timezone

from ..extensions import db


class SavedListing(db.Model):
    __tablename__ = 'saved_listings'

    __table_args__ = (
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

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "listing_id": self.listing_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
