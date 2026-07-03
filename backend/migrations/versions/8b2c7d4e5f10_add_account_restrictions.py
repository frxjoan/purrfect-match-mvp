"""add account restrictions

Revision ID: 8b2c7d4e5f10
Revises: 4f6d8a1b9c20
Create Date: 2026-06-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8b2c7d4e5f10'
down_revision = '4f6d8a1b9c20'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=20), nullable=False, server_default='active'))
        batch_op.add_column(sa.Column('suspended_until', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('moderation_reason', sa.Text(), nullable=True))
        batch_op.create_check_constraint(
            'ck_users_status_valid',
            "status IN ('active', 'suspended', 'banned')",
        )

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('status', server_default=None)

    op.create_table(
        'account_restrictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('restriction_type', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "restriction_type IN ('suspension', 'ban')",
            name='ck_account_restrictions_type_valid',
        ),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )


def downgrade():
    op.drop_table('account_restrictions')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('ck_users_status_valid', type_='check')
        batch_op.drop_column('moderation_reason')
        batch_op.drop_column('suspended_until')
        batch_op.drop_column('status')
