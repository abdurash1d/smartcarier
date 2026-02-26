"""add_saved_jobs

Revision ID: 006_add_saved_jobs
Revises: 005_add_performance_indexes
Create Date: 2026-02-24

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_add_saved_jobs'
down_revision = '005_performance_indexes'
branch_labels = None
depends_on = None


def upgrade():
    from alembic import op as _op
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'saved_jobs' not in existing_tables:
        op.create_table(
            'saved_jobs',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('job_id', sa.String(36), sa.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.UniqueConstraint('user_id', 'job_id', name='uq_saved_jobs_user_job'),
        )

    # Indexes (create if not exists)
    existing_indexes = [idx['name'] for idx in inspector.get_indexes('saved_jobs')] if 'saved_jobs' in existing_tables else []
    if 'idx_saved_jobs_user' not in existing_indexes:
        op.create_index('idx_saved_jobs_user', 'saved_jobs', ['user_id'])
    if 'idx_saved_jobs_job' not in existing_indexes:
        op.create_index('idx_saved_jobs_job', 'saved_jobs', ['job_id'])


def downgrade():
    op.drop_index('idx_saved_jobs_job', table_name='saved_jobs')
    op.drop_index('idx_saved_jobs_user', table_name='saved_jobs')
    op.drop_table('saved_jobs')
