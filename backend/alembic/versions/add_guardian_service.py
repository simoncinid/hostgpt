"""Add Guardian service

Revision ID: add_guardian_service
Revises: add_message_limits_and_verification
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_guardian_service'
down_revision = 'add_message_limits_and_verification'
branch_labels = None
depends_on = None


def upgrade():
    # Aggiungi campi Guardian alla tabella users
    op.add_column('users', sa.Column('guardian_subscription_status', sa.String(50), nullable=True, server_default='inactive'))
    op.add_column('users', sa.Column('guardian_subscription_end_date', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('guardian_stripe_subscription_id', sa.String(255), nullable=True))
    
    # Crea tabella guest_satisfaction
    op.create_table('guest_satisfaction',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('chatbot_id', sa.Integer(), nullable=False),
        sa.Column('guest_identifier', sa.String(255), nullable=True),
        sa.Column('satisfaction_score', sa.Float(), nullable=True, server_default='5.0'),
        sa.Column('sentiment_score', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('risk_level', sa.String(20), nullable=True, server_default='low'),
        sa.Column('detected_issues', sa.JSON(), nullable=True),
        sa.Column('resolution_status', sa.String(20), nullable=True, server_default='pending'),
        sa.Column('interventions_made', sa.JSON(), nullable=True),
        sa.Column('recovery_offers', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['chatbot_id'], ['chatbots.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_guest_satisfaction_id'), 'guest_satisfaction', ['id'], unique=False)
    
    # Crea tabella satisfaction_alerts
    op.create_table('satisfaction_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('satisfaction_id', sa.Integer(), nullable=False),
        sa.Column('alert_type', sa.String(50), nullable=True),
        sa.Column('severity', sa.String(20), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('suggested_action', sa.Text(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['satisfaction_id'], ['guest_satisfaction.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_satisfaction_alerts_id'), 'satisfaction_alerts', ['id'], unique=False)


def downgrade():
    # Rimuovi tabelle Guardian
    op.drop_index(op.f('ix_satisfaction_alerts_id'), table_name='satisfaction_alerts')
    op.drop_table('satisfaction_alerts')
    op.drop_index(op.f('ix_guest_satisfaction_id'), table_name='guest_satisfaction')
    op.drop_table('guest_satisfaction')
    
    # Rimuovi campi Guardian dalla tabella users
    op.drop_column('users', 'guardian_stripe_subscription_id')
    op.drop_column('users', 'guardian_subscription_end_date')
    op.drop_column('users', 'guardian_subscription_status')
