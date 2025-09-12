"""Add OTP system for password reset

Revision ID: add_otp_system
Revises: update_demo_chatbot_assistant
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_otp_system'
down_revision = 'update_demo_chatbot_assistant'
branch_labels = None
depends_on = None


def upgrade():
    # Add OTP fields to users table
    op.add_column('users', sa.Column('otp_code', sa.String(6), nullable=True))
    op.add_column('users', sa.Column('otp_expires_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('otp_attempts', sa.Integer(), default=0))
    op.add_column('users', sa.Column('phone_verified', sa.Boolean(), default=False))
    
    # Make phone field required (nullable=False)
    op.alter_column('users', 'phone', nullable=False)


def downgrade():
    # Remove OTP fields
    op.drop_column('users', 'otp_code')
    op.drop_column('users', 'otp_expires_at')
    op.drop_column('users', 'otp_attempts')
    op.drop_column('users', 'phone_verified')
    
    # Make phone field optional again
    op.alter_column('users', 'phone', nullable=True)
