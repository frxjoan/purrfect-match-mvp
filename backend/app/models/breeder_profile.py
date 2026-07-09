"""Breeder profile model for certification and public breeder details."""

from typing import Any


from datetime import datetime, timezone

from ..extensions import db


class BreederProfile(db.Model):
    """Represent breeder-specific profile and certification data."""

    __tablename__: str = 'breeder_profiles'

    __table_args__: tuple[Any, ...] = (
        db.CheckConstraint(
            "certification_status IN ('pending', 'verified', 'rejected')",
            name='ck_certification_status_valid',
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    business_name = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(150), nullable=False)
    certification_status = db.Column(db.String(20), nullable=False, default='pending')
    certification_document_url = db.Column(db.Text, nullable=True)
    certification_admin_comment = db.Column(db.Text, nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship(
        'User',
        back_populates='breeder_profile',
    )
    listings = db.relationship(
        'CatListing',
        back_populates='breeder',
        cascade='all, delete-orphan',
    )
    conversations = db.relationship(
        'Conversation',
        back_populates='breeder',
        cascade='all, delete-orphan',
    )
    reviews = db.relationship(
        'Review',
        back_populates='breeder',
        cascade='all, delete-orphan',
    )

    def is_verified(self) -> bool:
        """Return whether the breeder profile is verified."""
        return self.certification_status == "verified"

    def can_create_listing(self) -> bool:
        """Return whether the breeder can create listings."""
        return self.is_verified()

    def to_dict(self) -> dict[str, Any]:
        """Serialize the model instance into an API-friendly dictionary."""
        owner_name = None
        profile_picture_url = None
        user: dict[str, Any] | None = None

        if self.user:
            owner_name: str | None = " ".join(
                value for value in [self.user.first_name, self.user.last_name]
                if value
            ) or None
            profile_picture_url = self.user.profile_picture_url
            user = {
                "id": self.user.id,
                "first_name": self.user.first_name,
                "last_name": self.user.last_name,
                "display_name": owner_name,
                "profile_picture_url": profile_picture_url,
            }

        return {
            "id": self.id,
            "user_id": self.user_id,
            "business_name": self.business_name,
            "display_name": self.business_name,
            "owner_name": owner_name,
            "profile_picture_url": profile_picture_url,
            "bio": self.bio,
            "location": self.location,
            "certification_status": self.certification_status,
            "certification_document_url": self.certification_document_url,
            "certification_admin_comment": self.certification_admin_comment,
            "user": user,
            "verified_at": (
                self.verified_at.isoformat()
                if self.verified_at
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
        }
