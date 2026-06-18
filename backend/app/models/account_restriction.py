from datetime import datetime, timezone

from ..extensions import db


RESTRICTION_TYPES = ("suspension", "ban")


class AccountRestriction(db.Model):
    __tablename__ = 'account_restrictions'

    __table_args__ = (
        db.CheckConstraint(
            "restriction_type IN ('suspension', 'ban')",
            name='ck_account_restrictions_type_valid',
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
    )
    restriction_type = db.Column(db.String(20), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    admin_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
    )
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship(
        'User',
        back_populates='account_restrictions',
        foreign_keys=[user_id],
    )
    admin = db.relationship(
        'User',
        back_populates='issued_account_restrictions',
        foreign_keys=[admin_id],
    )

    def is_active(self):
        if not self.expires_at:
            return True

        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        return expires_at > datetime.now(timezone.utc)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "user_id": self.user_id,
            "restriction_type": self.restriction_type,
            "reason": self.reason,
            "admin_id": self.admin_id,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
