from datetime import datetime

from ..extensions import db

class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    breeder_id = db.Column(db.Integer, db.ForeignKey('breeder_profiles.id', ondelete='CASCADE'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('cat_listings.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = db.relationship(
        'User',
        back_populates='conversations',
        foreign_keys=[customer_id],
    )
    breeder = db.relationship(
        'BreederProfile',
        back_populates='conversations',
    )
    listing = db.relationship(
        'CatListing',
        back_populates='conversations',
    )
    messages = db.relationship(
        'Message',
        back_populates='conversation',
        cascade='all, delete-orphan',
    )
