"""Add chatbot_guests table

Revision ID: add_chatbot_guests_table
Revises: add_sticker_size_selection
Create Date: 2025-01-25 10:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_chatbot_guests_table'
down_revision = 'add_sticker_size_selection'
branch_labels = None
depends_on = None


def upgrade():
    # Create chatbot_guests table
    op.create_table('chatbot_guests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('chatbot_id', sa.Integer(), nullable=False),
        sa.Column('guest_id', sa.Integer(), nullable=False),
        sa.Column('first_interaction_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['chatbot_id'], ['chatbots.id'], ),
        sa.ForeignKeyConstraint(['guest_id'], ['guests.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chatbot_guests_id'), 'chatbot_guests', ['id'], unique=False)
    
    # Add unique constraint to prevent duplicate chatbot-guest associations
    op.create_unique_constraint('uq_chatbot_guest', 'chatbot_guests', ['chatbot_id', 'guest_id'])


def downgrade():
    # Drop the table
    op.drop_table('chatbot_guests')
