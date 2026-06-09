from datetime import datetime

from ..extensions import db


class BreederProfile(db.Model):
    __tablename__ = 'breeder_profiles'

    __table_args__ = (
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
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

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

def is_verified(self):
    return self.certification_status == "verified"

def can_create_listing(self):
    return self.is_verified()

def to_dict(self):
    return {
        "id": self.id,
        "user_id": self.user_id,
        "business_name": self.business_name,
        "bio": self.bio,
        "location": self.location,
        "certification_status": self.certification_status,
        "certification_document_url": self.certification_document_url,
        "certification_admin_comment": self.certification_admin_comment,
        "verified_at": self.verified_at.isoformat() if self.verified_at else None,
        "created_at": self.created_at.isoformat() if self.created_at else None,
        "updated_at": self.updated_at.isoformat() if self.updated_at else None,
    }
