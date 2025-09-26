"""Add desired_plan field to users table

Revision ID: add_desired_plan
Revises: add_conversation_limits
Create Date: 2024-01-15 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_desired_plan'
down_revision = 'add_conversation_limits'
branch_labels = None
depends_on = None


def upgrade():
    # Aggiungi campo desired_plan alla tabella users
    op.add_column('users', sa.Column('desired_plan', sa.String(50)))


def downgrade():
    # Rimuovi il campo desired_plan
    op.drop_column('users', 'desired_plan')
