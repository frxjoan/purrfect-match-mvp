from datetime import datetime

from ..extensions import db


class Review(db.Model):
    __tablename__ = 'reviews'

    __table_args__ = (
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='ck_reviews_rating_range'),
    )

    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    breeder_id = db.Column(db.Integer, db.ForeignKey('breeder_profiles.id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    db.UniqueConstraint('reviewer_id', 'breeder_id', name='uq_reviewer_breeder_review')

    reviewer = db.relationship(
        'User',
        back_populates='reviews',
        foreign_keys=[reviewer_id],
    )
    breeder = db.relationship(
        'BreederProfile',
        back_populates='reviews',
    )
    