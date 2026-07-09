"""Listing report model used by customers and admins for moderation."""

from typing import Any


from datetime import datetime, timezone

from ..extensions import db


ALLOWED_REPORT_REASONS: tuple[str, ...] = (
    "misleading_information",
    "inappropriate_content",
    "suspected_scam",
    "animal_abuse_or_neglect",
    "duplicate_listing",
    "wrong_category",
    "other",
)

REPORT_STATUSES: tuple[str, ...] = ("pending", "accepted", "rejected")


class ListingReport(db.Model):
    """Represent a moderation report created for a listing."""

    __tablename__: str = 'listing_reports'

    __table_args__: tuple[Any, ...] = (
        db.CheckConstraint(
            "reason IN ("
            "'misleading_information', "
            "'inappropriate_content', "
            "'suspected_scam', "
            "'animal_abuse_or_neglect', "
            "'duplicate_listing', "
            "'wrong_category', "
            "'other'"
            ")",
            name='ck_listing_reports_reason_valid',
        ),
        db.CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected')",
            name='ck_listing_reports_status_valid',
        ),
        db.UniqueConstraint(
            'reporter_id',
            'listing_id',
            name='uq_listing_report_reporter_listing',
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(
        db.Integer,
        db.ForeignKey('cat_listings.id', ondelete='CASCADE'),
        nullable=False,
    )
    reporter_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
    )
    reason = db.Column(db.String(50), nullable=False)
    comment = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='pending')
    admin_comment = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(
        db.Integer,
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
    )
    reviewed_at = db.Column(db.DateTime, nullable=True)
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

    listing = db.relationship(
        'CatListing',
        back_populates='reports',
    )
    reporter = db.relationship(
        'User',
        back_populates='listing_reports',
        foreign_keys=[reporter_id],
    )
    reviewer = db.relationship(
        'User',
        back_populates='reviewed_listing_reports',
        foreign_keys=[reviewed_by],
    )

    def to_dict(self) -> dict[str, Any]:
        """Serialize the model instance into an API-friendly dictionary."""
        return {
            "id": self.id,
            "listing_id": self.listing_id,
            "reporter_id": self.reporter_id,
            "reason": self.reason,
            "comment": self.comment,
            "status": self.status,
            "admin_comment": self.admin_comment,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
