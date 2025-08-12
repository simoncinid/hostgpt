"""Aggiunge limiti messaggi e verifica email

Revision ID: add_message_limits
Revises: 
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_message_limits'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Aggiungi nuovi campi alla tabella users
    op.add_column('users', sa.Column('verification_token', sa.String(255), nullable=True, unique=True))
    op.add_column('users', sa.Column('messages_limit', sa.Integer(), nullable=False, server_default='1000'))
    op.add_column('users', sa.Column('messages_used', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('messages_reset_date', sa.DateTime(), nullable=True))
    
    # Crea indice per verification_token per performance
    op.create_index('ix_users_verification_token', 'users', ['verification_token'], unique=True)
    
    # Aggiorna tutti gli utenti esistenti per impostare is_verified a True (assumendo che siano già verificati)
    op.execute("UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL")
    
    # Imposta messages_reset_date per tutti gli utenti con abbonamento attivo
    op.execute("""
        UPDATE users 
        SET messages_reset_date = NOW() 
        WHERE subscription_status = 'active' 
        AND messages_reset_date IS NULL
    """)


def downgrade():
    # Rimuovi indice
    op.drop_index('ix_users_verification_token', table_name='users')
    
    # Rimuovi colonne
    op.drop_column('users', 'messages_reset_date')
    op.drop_column('users', 'messages_used')
    op.drop_column('users', 'messages_limit')
    op.drop_column('users', 'verification_token')
