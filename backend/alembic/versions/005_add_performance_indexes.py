"""add performance indexes

Revision ID: 005
Revises: 004
Create Date: 2026-01-19

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_performance_indexes'
down_revision = '004_notifications_and_saved_searches'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add performance indexes to improve query speed"""
    
    # Note: Some indexes already exist from model definitions
    # Only creating non-duplicate indexes here
    
    try:
        # User indexes (if not exists)
        op.create_index('ix_perf_users_subscription', 'users', ['subscription_tier', 'subscription_expires_at'], unique=False)
    except:
        pass  # Index may already exist
    
    try:
        # Job indexes - using existing columns
        op.create_index('ix_perf_jobs_title', 'jobs', ['title'], unique=False)
        op.create_index('ix_perf_jobs_location_type', 'jobs', ['location', 'job_type'], unique=False)
        op.create_index('ix_perf_jobs_salary', 'jobs', ['salary_min', 'salary_max'], unique=False)
    except:
        pass
    
    try:
        # Resume indexes
        op.create_index('ix_perf_resumes_created', 'resumes', ['created_at'], unique=False)
    except:
        pass
    
    try:
        # Application indexes
        op.create_index('ix_perf_applications_user_status', 'applications', ['user_id', 'status'], unique=False)
    except:
        pass
    
    try:
        # University indexes
        op.create_index('ix_perf_universities_country_ranking', 'universities', ['country', 'world_ranking'], unique=False)
        op.create_index('ix_perf_universities_tuition', 'universities', ['tuition_min', 'tuition_max'], unique=False)
    except:
        pass
    
    try:
        # Scholarship indexes
        op.create_index('ix_perf_scholarships_deadline', 'scholarships', ['application_deadline'], unique=False)
    except:
        pass
    
    try:
        # University Application indexes
        op.create_index('ix_perf_univ_apps_user_status', 'university_applications', ['user_id', 'status'], unique=False)
        op.create_index('ix_perf_univ_apps_deadline', 'university_applications', ['deadline'], unique=False)
    except:
        pass
    
    try:
        # Notification indexes
        op.create_index('ix_perf_notifications_user_read', 'notifications', ['user_id', 'is_read'], unique=False)
    except:
        pass
    
    try:
        # Saved Search indexes
        op.create_index('ix_perf_saved_searches_user_created', 'saved_searches', ['user_id', 'created_at'], unique=False)
    except:
        pass


def downgrade() -> None:
    """Remove performance indexes"""
    
    # Remove indexes in reverse order
    try:
        op.drop_index('ix_perf_saved_searches_user_created', table_name='saved_searches')
    except:
        pass
    
    try:
        op.drop_index('ix_perf_notifications_user_read', table_name='notifications')
    except:
        pass
    
    try:
        op.drop_index('ix_perf_univ_apps_deadline', table_name='university_applications')
        op.drop_index('ix_perf_univ_apps_user_status', table_name='university_applications')
    except:
        pass
    
    try:
        op.drop_index('ix_perf_scholarships_deadline', table_name='scholarships')
    except:
        pass
    
    try:
        op.drop_index('ix_perf_universities_tuition', table_name='universities')
        op.drop_index('ix_perf_universities_country_ranking', table_name='universities')
    except:
        pass
    
    try:
        op.drop_index('ix_perf_applications_user_status', table_name='applications')
    except:
        pass
    
    try:
        op.drop_index('ix_perf_resumes_created', table_name='resumes')
    except:
        pass
    
    try:
        op.drop_index('ix_perf_jobs_salary', table_name='jobs')
        op.drop_index('ix_perf_jobs_location_type', table_name='jobs')
        op.drop_index('ix_perf_jobs_title', table_name='jobs')
    except:
        pass
    
    try:
        op.drop_index('ix_perf_users_subscription', table_name='users')
    except:
        pass
