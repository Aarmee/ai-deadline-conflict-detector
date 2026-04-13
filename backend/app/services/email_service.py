"""
Email Service
─────────────
Sends transactional emails using aiosmtplib (async SMTP).
All sends are fire-and-forget — failures are logged, never raised.

Emails sent:
  1. Welcome email       — on user registration
  2. Conflict alert      — when conflicts are detected for a user
  3. Nightly report      — daily summary of tasks + risk levels (scheduled)
  4. Deadline reminder   — 1 day before task deadline (scheduled)
"""

import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import date
from typing import List

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


# ─── Core send function ───────────────────────────────────
async def _send(to: str, subject: str, html: str) -> None:
    """Send a single HTML email. Silently logs on failure."""
    if not settings.EMAILS_ENABLED:
        logger.info(f"[EMAIL DISABLED] Would send '{subject}' to {to}")
        return
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured — skipping email")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"DeadlineIQ <{settings.SMTP_USER}>"
    msg["To"]      = to
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True,   # port 465 SSL — works on Render free tier
        )
        logger.info(f"Email sent: '{subject}' → {to}")
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")


# ─── HTML helpers ─────────────────────────────────────────
def _base_template(title: str, body: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0A0A14; color: #F0F0FF; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: #12121E; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #4F35F3, #00D4FF); padding: 32px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; color: white; }}
        .header p {{ margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }}
        .body {{ padding: 32px; }}
        .body h2 {{ font-size: 18px; margin-top: 0; color: #F0F0FF; }}
        .body p {{ color: #8888AA; font-size: 14px; line-height: 1.6; }}
        .badge {{ display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }}
        .badge-high   {{ background: rgba(255,92,92,0.2);  color: #FF5C5C; border: 1px solid rgba(255,92,92,0.4); }}
        .badge-medium {{ background: rgba(255,184,0,0.2);  color: #FFB800; border: 1px solid rgba(255,184,0,0.4); }}
        .badge-low    {{ background: rgba(168,255,62,0.2); color: #A8FF3E; border: 1px solid rgba(168,255,62,0.4); }}
        .task-row {{ padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #4F35F3; }}
        .task-title {{ font-size: 14px; font-weight: 600; color: #F0F0FF; }}
        .task-meta  {{ font-size: 12px; color: #555570; margin-top: 4px; }}
        .btn {{ display: inline-block; padding: 12px 28px; background: #4F35F3; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 20px; }}
        .footer {{ padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; }}
        .footer p {{ color: #555570; font-size: 12px; margin: 0; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ DeadlineIQ</h1>
          <p>AI-Powered Deadline Management</p>
        </div>
        <div class="body">
          {body}
        </div>
        <div class="footer">
          <p>DeadlineIQ · You're receiving this because you have an account with us.</p>
        </div>
      </div>
    </body>
    </html>
    """


# ─── 1. Welcome Email ─────────────────────────────────────
async def send_welcome_email(to: str, full_name: str) -> None:
    body = f"""
    <h2>Welcome to DeadlineIQ, {full_name}! 🎉</h2>
    <p>Your account has been created successfully. Here's what you can do:</p>
    <div class="task-row">
      <div class="task-title">📋 Create & manage tasks</div>
      <div class="task-meta">Add deadlines, priorities, and estimated effort hours</div>
    </div>
    <div class="task-row">
      <div class="task-title">🤖 AI Risk Prediction</div>
      <div class="task-meta">Our ML model predicts which tasks are at risk of missing deadlines</div>
    </div>
    <div class="task-row">
      <div class="task-title">⚠️ Conflict Detection</div>
      <div class="task-meta">Automatically detects schedule conflicts and overloads</div>
    </div>
    <div class="task-row">
      <div class="task-title">📅 Smart Scheduling</div>
      <div class="task-meta">Get AI-powered schedule recommendations based on urgency</div>
    </div>
    <a href="http://localhost:5173/dashboard" class="btn">Go to Dashboard →</a>
    """
    await _send(to, "Welcome to DeadlineIQ ⚡", _base_template("Welcome", body))


# ─── 2. Conflict Alert Email ──────────────────────────────
async def send_conflict_alert_email(
    to: str,
    full_name: str,
    conflict_count: int,
    critical_count: int,
) -> None:
    severity_note = (
        f'<span class="badge badge-high">{critical_count} CRITICAL</span>'
        if critical_count > 0 else
        '<span class="badge badge-medium">WARNING level</span>'
    )
    body = f"""
    <h2>⚠️ Schedule Conflicts Detected</h2>
    <p>Hi {full_name}, our conflict detection engine found <strong>{conflict_count} conflict(s)</strong>
    in your schedule. {severity_note}</p>
    <div class="task-row">
      <div class="task-title">What this means</div>
      <div class="task-meta">
        Your tasks may have overlapping deadlines, workload overloads, or dependency issues
        that could cause you to miss deadlines.
      </div>
    </div>
    <div class="task-row">
      <div class="task-title">What to do</div>
      <div class="task-meta">
        Visit the Conflicts page to review details and use the AI Schedule Recommendation
        to get an optimized task order.
      </div>
    </div>
    <a href="http://localhost:5173/conflicts" class="btn">Review Conflicts →</a>
    """
    await _send(
        to,
        f"⚠️ {conflict_count} Schedule Conflict(s) Detected — DeadlineIQ",
        _base_template("Conflict Alert", body),
    )


# ─── 3. Deadline Reminder Email ───────────────────────────
async def send_deadline_reminder_email(
    to: str,
    full_name: str,
    tasks_due_tomorrow: list,
) -> None:
    task_rows = ""
    for t in tasks_due_tomorrow:
        risk = t.get("risk_level", "MEDIUM").lower()
        task_rows += f"""
        <div class="task-row">
          <div class="task-title">{t['title']} <span class="badge badge-{risk}">{t.get('risk_level','MEDIUM')}</span></div>
          <div class="task-meta">Due tomorrow · {t.get('estimated_effort_hours', 0)}h estimated · {t.get('priority','MEDIUM')} priority</div>
        </div>
        """
    body = f"""
    <h2>📅 Tasks Due Tomorrow</h2>
    <p>Hi {full_name}, you have <strong>{len(tasks_due_tomorrow)} task(s)</strong> due tomorrow.
    Make sure you're on track!</p>
    {task_rows}
    <a href="http://localhost:5173/tasks" class="btn">View Tasks →</a>
    """
    await _send(
        to,
        f"📅 Reminder: {len(tasks_due_tomorrow)} Task(s) Due Tomorrow — DeadlineIQ",
        _base_template("Deadline Reminder", body),
    )


# ─── 4. Nightly Report Email ──────────────────────────────
async def send_nightly_report_email(
    to: str,
    full_name: str,
    total_active: int,
    high_risk_count: int,
    conflicts_count: int,
    due_this_week: int,
    workload_score: float,
) -> None:
    workload_color = "#FF5C5C" if workload_score > 80 else "#FFB800" if workload_score > 60 else "#A8FF3E"
    workload_label = "Overloaded" if workload_score > 80 else "Busy" if workload_score > 60 else "Healthy"

    body = f"""
    <h2>🌙 Your Daily Summary</h2>
    <p>Hi {full_name}, here's your DeadlineIQ report for today — {date.today().strftime('%B %d, %Y')}.</p>

    <div class="task-row">
      <div class="task-title">📋 Active Tasks</div>
      <div class="task-meta">{total_active} tasks currently in progress or pending</div>
    </div>
    <div class="task-row">
      <div class="task-title">🔴 High Risk Tasks</div>
      <div class="task-meta">{high_risk_count} task(s) predicted to miss their deadline</div>
    </div>
    <div class="task-row">
      <div class="task-title">⚠️ Active Conflicts</div>
      <div class="task-meta">{conflicts_count} unresolved schedule conflict(s)</div>
    </div>
    <div class="task-row">
      <div class="task-title">📆 Due This Week</div>
      <div class="task-meta">{due_this_week} task(s) have deadlines in the next 7 days</div>
    </div>
    <div class="task-row">
      <div class="task-title">💪 Workload Score</div>
      <div class="task-meta" style="color: {workload_color};">{workload_score:.0f}% — {workload_label}</div>
    </div>

    <a href="http://localhost:5173/dashboard" class="btn">Open Dashboard →</a>
    """
    await _send(
        to,
        f"🌙 Your DeadlineIQ Daily Report — {date.today().strftime('%b %d')}",
        _base_template("Daily Report", body),
    )
