from datetime import datetime

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
