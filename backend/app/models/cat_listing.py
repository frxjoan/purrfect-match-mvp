from datetime import datetime

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
    )

    id = db.Column(db.Integer, primary_key=True)
    breeder_id = db.Column(db.Integer, db.ForeignKey('breeder_profiles.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    breed = db.Column(db.String(150), nullable=False)
    age_months = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='available')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
