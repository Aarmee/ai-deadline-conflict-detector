"""Initial migration - create all tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('full_name', sa.String(100), nullable=False),
        sa.Column('daily_hours_available', sa.Float(), nullable=False, server_default='8.0'),
        sa.Column('completion_rate', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # ── tasks ──────────────────────────────────────────────
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('deadline', sa.Date(), nullable=False),
        sa.Column('estimated_effort_hours', sa.Float(), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='taskpriority'), nullable=False),
        sa.Column('category', sa.String(80), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', name='taskstatus'), nullable=False, server_default='PENDING'),
        sa.Column('parent_task_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_task_id'], ['tasks.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_tasks_user_id', 'tasks', ['user_id'])

    # ── predictions ────────────────────────────────────────
    op.create_table(
        'predictions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('risk_level', sa.Enum('LOW', 'MEDIUM', 'HIGH', name='risklevel'), nullable=False),
        sa.Column('probability_score', sa.Float(), nullable=False),
        sa.Column('model_version', sa.String(20), nullable=False),
        sa.Column('features_snapshot', sa.JSON(), nullable=False),
        sa.Column('predicted_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_predictions_task_id', 'predictions', ['task_id'])

    # ── conflicts ──────────────────────────────────────────
    op.create_table(
        'conflicts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('task_ids', sa.JSON(), nullable=False),
        sa.Column('conflict_type', sa.Enum('DEADLINE_OVERLAP', 'WORKLOAD_OVERLOAD', 'DEPENDENCY_BLOCK', name='conflicttype'), nullable=False),
        sa.Column('severity', sa.Enum('WARNING', 'CRITICAL', name='conflictseverity'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_conflicts_user_id', 'conflicts', ['user_id'])

    # ── schedule_recommendations ───────────────────────────
    op.create_table(
        'schedule_recommendations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recommended_order', sa.JSON(), nullable=False),
        sa.Column('reason_summary', sa.Text(), nullable=False),
        sa.Column('accepted', sa.Boolean(), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── notifications ──────────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('RISK_ALERT', 'CONFLICT_DETECTED', 'DEADLINE_REMINDER', 'SYSTEM', name='notificationtype'), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('schedule_recommendations')
    op.drop_table('conflicts')
    op.drop_table('predictions')
    op.drop_table('tasks')
    op.drop_table('users')

    # Drop enums
    sa.Enum(name='notificationtype').drop(op.get_bind())
    sa.Enum(name='conflictseverity').drop(op.get_bind())
    sa.Enum(name='conflicttype').drop(op.get_bind())
    sa.Enum(name='risklevel').drop(op.get_bind())
    sa.Enum(name='taskstatus').drop(op.get_bind())
    sa.Enum(name='taskpriority').drop(op.get_bind())
