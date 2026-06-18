"""add listing reports

Revision ID: 4f6d8a1b9c20
Revises: 3222339d302f
Create Date: 2026-06-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4f6d8a1b9c20'
down_revision = '3222339d302f'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'listing_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('listing_id', sa.Integer(), nullable=False),
        sa.Column('reporter_id', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=50), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('admin_comment', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint(
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
        sa.CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected')",
            name='ck_listing_reports_status_valid',
        ),
        sa.ForeignKeyConstraint(
            ['listing_id'],
            ['cat_listings.id'],
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['reporter_id'],
            ['users.id'],
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['reviewed_by'],
            ['users.id'],
            ondelete='SET NULL',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'reporter_id',
            'listing_id',
            name='uq_listing_report_reporter_listing',
        ),
    )


def downgrade():
    op.drop_table('listing_reports')
