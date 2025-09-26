"""Add conversation limits to users table

Revision ID: add_conversation_limits
Revises: add_guardian_service
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_conversation_limits'
down_revision = 'add_guardian_service'
branch_labels = None
depends_on = None


def upgrade():
    # Aggiungi nuovi campi alla tabella users per i limiti delle conversazioni
    op.add_column('users', sa.Column('conversations_limit', sa.Integer(), default=20))
    op.add_column('users', sa.Column('conversations_used', sa.Integer(), default=0))
    op.add_column('users', sa.Column('conversations_reset_date', sa.DateTime()))
    
    # Aggiungi campi per il free trial delle conversazioni
    op.add_column('users', sa.Column('free_trial_conversations_limit', sa.Integer(), default=5))
    op.add_column('users', sa.Column('free_trial_conversations_used', sa.Integer(), default=0))


def downgrade():
    # Rimuovi i campi aggiunti
    op.drop_column('users', 'free_trial_conversations_used')
    op.drop_column('users', 'free_trial_conversations_limit')
    op.drop_column('users', 'conversations_reset_date')
    op.drop_column('users', 'conversations_used')
    op.drop_column('users', 'conversations_limit')
