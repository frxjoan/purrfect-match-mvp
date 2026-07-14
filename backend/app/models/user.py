"""User model for customer, breeder, and admin accounts."""

from typing import Any


from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

from ..extensions import db


class User(db.Model):
    """Represent an application user account."""

    __tablename__: str = 'users'

    __table_args__: tuple[Any, ...] = (
        db.CheckConstraint(
            "role IN ('customer', 'breeder', 'admin')",
            name='ck_users_role_valid',
        ),
        db.CheckConstraint(
            "status IN ('active', 'suspended', 'banned')",
            name='ck_users_status_valid',
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(150), nullable=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer')
    status = db.Column(db.String(20), nullable=False, default='active')
    suspended_until = db.Column(db.DateTime, nullable=True)
    moderation_reason = db.Column(db.Text, nullable=True)
    phone_number = db.Column(db.String(30), nullable=True)
    profile_picture_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    breeder_profile = db.relationship(
        'BreederProfile',
        back_populates='user',
        uselist=False,
        cascade='all, delete-orphan',
        single_parent=True,
    )
    conversations = db.relationship(
        'Conversation',
        back_populates='customer',
        foreign_keys='Conversation.customer_id',
        cascade='all, delete-orphan',
    )
    messages = db.relationship(
        'Message',
        back_populates='sender',
        foreign_keys='Message.sender_id',
        cascade='all, delete-orphan',
    )
    reviews = db.relationship(
        'Review',
        back_populates='reviewer',
        foreign_keys='Review.reviewer_id',
        cascade='all, delete-orphan',
    )
    listing_reports = db.relationship(
        'ListingReport',
        back_populates='reporter',
        foreign_keys='ListingReport.reporter_id',
        cascade='all, delete-orphan',
    )
    reviewed_listing_reports = db.relationship(
        'ListingReport',
        back_populates='reviewer',
        foreign_keys='ListingReport.reviewed_by',
    )
    account_restrictions = db.relationship(
        'AccountRestriction',
        back_populates='user',
        foreign_keys='AccountRestriction.user_id',
    )
    issued_account_restrictions = db.relationship(
        'AccountRestriction',
        back_populates='admin',
        foreign_keys='AccountRestriction.admin_id',
    )
    saved_listings = db.relationship(
        'SavedListing',
        back_populates='user',
        cascade='all, delete-orphan',
    )

    def set_password(self, password: Any) -> None:
        """Hash and store a plain-text password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: Any) -> bool:
        """Return whether a plain-text password matches the stored hash."""
        return check_password_hash(self.password_hash, password)

    def normalize_email(self) -> None:
        """Normalize the user email address for storage and lookup."""
        self.email = self.email.strip().lower()
    
    def get_breeder_certification_status(self):
        if self.role != "breeder":
            return None

        if self.breeder_profile:
            return self.breeder_profile.certification_status

        return "unverified"

    def to_dict(self) -> dict[str, Any]:
        """Serialize the model instance into an API-friendly dictionary."""

        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "status": self.status,
            "suspended_until": (
                self.suspended_until.isoformat()
                if self.suspended_until
                else None
            ),
            "moderation_reason": self.moderation_reason,
            "phone_number": self.phone_number,
            "location": self.location,
            "profile_picture_url": self.profile_picture_url,
            "breeder_certification_status": self.get_breeder_certification_status(),
            "breeder_profile": (
                self.breeder_profile.to_dict()
                if self.breeder_profile
                else None
            ),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def is_admin(self) -> bool:
        """Return whether the user has the admin role."""
        return self.role == "admin"

    def is_breeder(self) -> bool:
        """Return whether the user has the breeder role."""
        return self.role == "breeder"

    def can_access_admin_panel(self) -> bool:
        """Return whether the user can access admin features."""
        return self.is_admin()

    def can_browse_listings(self) -> bool:
        """Return whether the user can browse public listings."""
        return True

    def can_contact_breeder(self) -> bool:
        """Return whether the user can contact breeders."""
        return self.role in ["customer", "breeder"]
