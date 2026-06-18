"""add cascade deletes and review uniqueness

Revision ID: 3222339d302f
Revises: 9c8b1c2a32e2
Create Date: 2026-06-16 12:59:52.584540

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '3222339d302f'
down_revision = '9c8b1c2a32e2'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('breeder_profiles', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('breeder_profiles_user_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(
            batch_op.f('breeder_profiles_user_id_fkey'),
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE',
        )

    with op.batch_alter_table('cat_listings', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('cat_listings_breeder_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(
            batch_op.f('cat_listings_breeder_id_fkey'),
            'breeder_profiles',
            ['breeder_id'],
            ['id'],
            ondelete='CASCADE',
        )

    with op.batch_alter_table('conversations', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('conversations_customer_id_fkey'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f('conversations_breeder_id_fkey'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f('conversations_listing_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(
            batch_op.f('conversations_breeder_id_fkey'),
            'breeder_profiles',
            ['breeder_id'],
            ['id'],
            ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            batch_op.f('conversations_listing_id_fkey'),
            'cat_listings',
            ['listing_id'],
            ['id'],
            ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            batch_op.f('conversations_customer_id_fkey'),
            'users',
            ['customer_id'],
            ['id'],
            ondelete='CASCADE',
        )

    with op.batch_alter_table('listing_images', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('listing_images_listing_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(
            batch_op.f('listing_images_listing_id_fkey'),
            'cat_listings',
            ['listing_id'],
            ['id'],
            ondelete='CASCADE',
        )

    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('messages_conversation_id_fkey'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f('messages_sender_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(
            batch_op.f('messages_conversation_id_fkey'),
            'conversations',
            ['conversation_id'],
            ['id'],
            ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            batch_op.f('messages_sender_id_fkey'),
            'users',
            ['sender_id'],
            ['id'],
            ondelete='CASCADE',
        )

    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('reviews_breeder_id_fkey'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f('reviews_reviewer_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(
            batch_op.f('reviews_breeder_id_fkey'),
            'breeder_profiles',
            ['breeder_id'],
            ['id'],
            ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            batch_op.f('reviews_reviewer_id_fkey'),
            'users',
            ['reviewer_id'],
            ['id'],
            ondelete='CASCADE',
        )
        batch_op.create_unique_constraint(
            batch_op.f('uq_reviewer_breeder_review'),
            ['reviewer_id', 'breeder_id'],
        )


def downgrade():
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('uq_reviewer_breeder_review'), type_='unique')
        batch_op.drop_constraint(batch_op.f('reviews_reviewer_id_fkey'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f('reviews_breeder_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f('reviews_reviewer_id_fkey'), 'users', ['reviewer_id'], ['id'])
        batch_op.create_foreign_key(batch_op.f('reviews_breeder_id_fkey'), 'breeder_profiles', ['breeder_id'], ['id'])

    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('messages_sender_id_fkey'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f('messages_conversation_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f('messages_sender_id_fkey'), 'users', ['sender_id'], ['id'])
        batch_op.create_foreign_key(batch_op.f('messages_conversation_id_fkey'), 'conversations', ['conversation_id'], ['id'])

    with op.batch_alter_table('listing_images', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('listing_images_listing_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f('listing_images_listing_id_fkey'), 'cat_listings', ['listing_id'], ['id'])

    with op.batch_alter_table('conversations', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('conversations_customer_id_fkey'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f('conversations_listing_id_fkey'), type_='foreignkey')
        batch_op.drop_constraint(batch_op.f('conversations_breeder_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f('conversations_listing_id_fkey'), 'cat_listings', ['listing_id'], ['id'])
        batch_op.create_foreign_key(batch_op.f('conversations_breeder_id_fkey'), 'breeder_profiles', ['breeder_id'], ['id'])
        batch_op.create_foreign_key(batch_op.f('conversations_customer_id_fkey'), 'users', ['customer_id'], ['id'])

    with op.batch_alter_table('cat_listings', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('cat_listings_breeder_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f('cat_listings_breeder_id_fkey'), 'breeder_profiles', ['breeder_id'], ['id'])

    with op.batch_alter_table('breeder_profiles', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('breeder_profiles_user_id_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f('breeder_profiles_user_id_fkey'), 'users', ['user_id'], ['id'])
