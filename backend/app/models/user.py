from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

from ..extensions import db


class User(db.Model):
    __tablename__ = 'users'

    __table_args__ = (
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

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def normalize_email(self):
        self.email = self.email.strip().lower()

    def to_dict(self):
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
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def is_admin(self):
        return self.role == "admin"

    def is_breeder(self):
        return self.role == "breeder"

    def can_access_admin_panel(self):
        return self.is_admin()

    def can_browse_listings(self):
        return True

    def can_contact_breeder(self):
        return self.role in ["customer", "breeder"]
