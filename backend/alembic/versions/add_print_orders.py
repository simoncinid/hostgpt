"""Add print orders tables

Revision ID: add_print_orders
Revises: add_guardian_service
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_print_orders'
down_revision = 'add_guardian_service'
branch_labels = None
depends_on = None


def upgrade():
    # Create print_orders table
    op.create_table('print_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('chatbot_id', sa.Integer(), nullable=False),
        sa.Column('order_number', sa.String(length=100), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('payment_status', sa.String(length=50), nullable=True),
        sa.Column('stripe_payment_intent_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_session_id', sa.String(length=255), nullable=True),
        sa.Column('shipping_address', sa.JSON(), nullable=True),
        sa.Column('tracking_number', sa.String(length=255), nullable=True),
        sa.Column('tracking_url', sa.String(length=500), nullable=True),
        sa.Column('printful_order_id', sa.String(length=255), nullable=True),
        sa.Column('printful_status', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('shipped_at', sa.DateTime(), nullable=True),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['chatbot_id'], ['chatbots.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_print_orders_id'), 'print_orders', ['id'], unique=False)
    op.create_index(op.f('ix_print_orders_order_number'), 'print_orders', ['order_number'], unique=True)

    # Create print_order_items table
    op.create_table('print_order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_type', sa.String(length=50), nullable=False),
        sa.Column('product_name', sa.String(length=255), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('total_price', sa.Float(), nullable=False),
        sa.Column('qr_code_data', sa.Text(), nullable=True),
        sa.Column('design_data', sa.JSON(), nullable=True),
        sa.Column('printful_variant_id', sa.String(length=255), nullable=True),
        sa.Column('printful_product_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['print_orders.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_print_order_items_id'), 'print_order_items', ['id'], unique=False)


def downgrade():
    # Drop print_order_items table
    op.drop_index(op.f('ix_print_order_items_id'), table_name='print_order_items')
    op.drop_table('print_order_items')
    
    # Drop print_orders table
    op.drop_index(op.f('ix_print_orders_order_number'), table_name='print_orders')
    op.drop_index(op.f('ix_print_orders_id'), table_name='print_orders')
    op.drop_table('print_orders')
