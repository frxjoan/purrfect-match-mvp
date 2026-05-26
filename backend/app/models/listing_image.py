from datetime import datetime

from ..extensions import db

class ListingImage(db.Model):
    __tablename__ = 'listing_images'

    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('cat_listings.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.Text, nullable=False)
    is_main = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    listing = db.relationship(
        'CatListing',
        back_populates='images',
    )
