from datetime import datetime, timezone

from ..extensions import db


class CatListing(db.Model):
    __tablename__ = 'cat_listings'

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('available', 'reserved', 'sold', 'archived')",
            name='ck_cat_listing_status_valid',
        ),
        db.CheckConstraint(
            "gender IN ('male', 'female')",
            name='ck_cat_gender_valid',
        ),
        db.CheckConstraint(
            "age_months >= 0",
            name='ck_cat_listing_age_positive',
        ),
        db.CheckConstraint(
            "price >= 0",
            name='ck_cat_listing_price_positive',
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    breeder_id = db.Column(db.Integer, db.ForeignKey('breeder_profiles.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    breed = db.Column(db.String(150), nullable=False)
    age_months = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='available')
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    breeder = db.relationship(
        'BreederProfile',
        back_populates='listings',
    )
    images = db.relationship(
        'ListingImage',
        back_populates='listing',
        cascade='all, delete-orphan',
    )
    conversations = db.relationship(
        'Conversation',
        back_populates='listing',
        cascade='all, delete-orphan',
    )

    def to_dict(self):
        return {
            "id": self.id,
            "breeder_id": self.breeder_id,
            "title": self.title,
            "breed": self.breed,
            "age_months": self.age_months,
            "gender": self.gender,
            "price": float(self.price) if self.price is not None else None,
            "location": self.location,
            "description": self.description,
            "status": self.status,
            "images": [image.to_dict() for image in self.images],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
