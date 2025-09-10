"""Update demo chatbot assistant_id

Revision ID: update_demo_chatbot_assistant
Revises: remove_language_column
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_demo_chatbot_assistant'
down_revision = 'remove_language_column'
branch_labels = None
depends_on = None


def upgrade():
    # Aggiorna l'assistant_id del chatbot demo con UUID e413257a-f165-41f2-9f9d-2f244d11d3b4
    op.execute("""
        UPDATE chatbots 
        SET assistant_id = 'asst_UAR8IMhw1n1Tg7tjBmYWcjCC' 
        WHERE uuid = 'e413257a-f165-41f2-9f9d-2f244d11d3b4'
    """)


def downgrade():
    # Ripristina l'assistant_id precedente (se necessario)
    op.execute("""
        UPDATE chatbots 
        SET assistant_id = NULL 
        WHERE uuid = 'e413257a-f165-41f2-9f9d-2f244d11d3b4'
    """)
