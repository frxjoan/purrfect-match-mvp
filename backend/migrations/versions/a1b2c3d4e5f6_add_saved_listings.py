"""add saved listings

Revision ID: a1b2c3d4e5f6
Revises: 8b2c7d4e5f10
Create Date: 2026-06-25 00:00:00.000000

"""
from typing import Any

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '8b2c7d4e5f10'
branch_labels = None
depends_on = None


def upgrade() -> Any:
    """Apply this database migration."""
    op.create_table(
        'saved_listings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('listing_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['listing_id'], ['cat_listings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'listing_id', name='uq_saved_listings_user_listing'),
    )


def downgrade() -> Any:
    """Revert this database migration."""
    op.drop_table('saved_listings')
