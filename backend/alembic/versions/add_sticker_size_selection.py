"""Add sticker size selection

Revision ID: add_sticker_size_selection
Revises: add_print_orders
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_sticker_size_selection'
down_revision = 'add_print_orders'
branch_labels = None
depends_on = None


def upgrade():
    # Aggiungi il campo selected_size alla tabella print_order_items
    op.add_column('print_order_items', sa.Column('selected_size', sa.String(50), nullable=True, default='size_5x8'))
    
    # Aggiorna i record esistenti con il valore di default
    op.execute("UPDATE print_order_items SET selected_size = 'size_5x8' WHERE selected_size IS NULL")


def downgrade():
    # Rimuovi il campo selected_size
    op.drop_column('print_order_items', 'selected_size')
