"""Review model storing customer feedback for breeder profiles."""

from typing import Any


from datetime import datetime, timezone

from ..extensions import db


class Review(db.Model):
    """Represent a customer review for a breeder profile."""

    __tablename__: str = 'reviews'

    __table_args__: tuple[Any, ...] = (
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='ck_reviews_rating_range'),
        db.UniqueConstraint('reviewer_id', 'breeder_id', name='uq_reviewer_breeder_review'),
    )

    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    breeder_id = db.Column(db.Integer, db.ForeignKey('breeder_profiles.id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    reviewer = db.relationship(
        'User',
        back_populates='reviews',
        foreign_keys=[reviewer_id],
    )
    breeder = db.relationship(
        'BreederProfile',
        back_populates='reviews',
    )

    def to_dict(self) -> dict[str, Any]:
        """Serialize the model instance into an API-friendly dictionary."""
        reviewer_name = None
        reviewer: dict[str, Any] | None = None

        if self.reviewer:
            reviewer_name = " ".join(
                value for value in [self.reviewer.first_name, self.reviewer.last_name]
                if value
            ) or None
            reviewer = {
                "id": self.reviewer.id,
                "display_name": reviewer_name,
                "profile_picture_url": self.reviewer.profile_picture_url,
            }

        return {
            "id": self.id,
            "reviewer_id": self.reviewer_id,
            "breeder_id": self.breeder_id,
            "rating": self.rating,
            "comment": self.comment,
            "reviewer": reviewer,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
