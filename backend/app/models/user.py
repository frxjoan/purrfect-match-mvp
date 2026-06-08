from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from ..extensions import db


class User(db.Model):
    __tablename__ = 'users'

    __table_args__ = (
        db.CheckConstraint(
            "role IN ('customer', 'breeder', 'admin')",
            name='ck_users_role_valid',
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(150), nullable=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer')
    phone_number = db.Column(db.String(30), nullable=True)
    profile_picture_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

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
