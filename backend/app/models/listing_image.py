from datetime import datetime, timezone

from ..extensions import db

class ListingImage(db.Model):
    __tablename__ = 'listing_images'

    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('cat_listings.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.Text, nullable=False)
    is_main = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    listing = db.relationship(
        'CatListing',
        back_populates='images',
    )

    def to_dict(self):
        return {
            "id": self.id,
            "listing_id": self.listing_id,
            "image_url": self.image_url,
            "is_main": self.is_main,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
