"""remove language column

Revision ID: remove_language_column
Revises: add_message_limits_and_verification
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remove_language_column'
down_revision = 'add_message_limits_and_verification'
branch_labels = None
depends_on = None


def upgrade():
    # Remove the language column from chatbots table
    op.drop_column('chatbots', 'language')


def downgrade():
    # Add back the language column to chatbots table
    op.add_column('chatbots', sa.Column('language', sa.String(10), nullable=True, server_default='it'))
