"""
AI Endpoints — powered by Google Gemini (FREE)
Get free key: https://aistudio.google.com/app/apikey
"""

import httpx
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date

from app.db.session import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.models import User, Task, Conflict, Prediction

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

# Updated model name
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]


async def call_gemini(system: str, messages: list) -> str:
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Add GEMINI_API_KEY to .env — free key at aistudio.google.com/app/apikey"
        )

    contents = [
        {"role": "user",  "parts": [{"text": f"SYSTEM:\n{system}\n\nAcknowledge."}]},
        {"role": "model", "parts": [{"text": "Understood. I am DeadlineIQ AI with full task context. Ready to help."}]},
    ]
    for msg in messages:
        contents.append({
            "role": "model" if msg["role"] == "assistant" else "user",
            "parts": [{"text": msg["content"]}],
        })

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{GEMINI_URL}?key={settings.GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": contents,
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1000}
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Gemini error: {response.text[:300]}")

    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected Gemini response")


async def build_context(db: AsyncSession, user: User) -> str:
    tasks_r = await db.execute(
        select(Task).where(Task.user_id == user.id, Task.parent_task_id == None)
        .order_by(Task.deadline.asc()).limit(50)
    )
    tasks = tasks_r.scalars().all()

    lines = []
    for t in tasks:
        pr = await db.execute(
            select(Prediction).where(Prediction.task_id == t.id)
            .order_by(Prediction.predicted_at.desc()).limit(1)
        )
        pred = pr.scalar_one_or_none()
        risk = f"{pred.risk_level} risk ({round(pred.probability_score*100)}%)" if pred else "no prediction"
        dl = t.deadline if isinstance(t.deadline, date) else t.deadline.date()
        lines.append(
            f'- "{t.title}" | {t.status.value} | {t.priority.value} priority '
            f'| Due: {dl} ({(dl - date.today()).days}d) | {t.estimated_effort_hours}h | {risk}'
        )

    cr = await db.execute(
        select(Conflict).where(Conflict.user_id == user.id, Conflict.resolved == False)
    )
    conflicts = cr.scalars().all()
    c_lines = [f"- {c.conflict_type.value}: {c.description}" for c in conflicts] or ["None"]

    active = [t for t in tasks if t.status.value in ["PENDING", "IN_PROGRESS"]]
    effort = sum(t.estimated_effort_hours for t in active)
    cap = user.daily_hours_available * 7

    return f"""TODAY: {date.today().strftime('%A, %B %d %Y')}
USER: {user.full_name} | {user.daily_hours_available}h/day | {round(user.completion_rate*100)}% completion rate

TASKS ({len(active)} active):
{chr(10).join(lines) or 'No tasks yet'}

CONFLICTS:
{chr(10).join(c_lines)}

WORKLOAD: {effort}h / {cap}h weekly capacity ({round(effort/max(cap,1)*100)}%)"""


@router.post("/chat")
async def ai_chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = await build_context(db, current_user)
    system = f"""You are DeadlineIQ, an AI assistant in a smart deadline management system.

{context}

Be concise (max 4-5 sentences), direct, and actionable.
Reference specific task names. Use bullet points for lists.
Never say you lack information — you have full context above."""

    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    reply = await call_gemini(system, messages)
    return {"reply": reply, "model": GEMINI_MODEL}


@router.post("/briefing")
async def ai_briefing(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    context = await build_context(db, current_user)
    name = current_user.full_name.split()[0]

    prompt = f"""Create a daily briefing for {name}.

{context}

Reply with ONLY valid JSON (no markdown, no backticks, no extra text):
{{
  "greeting": "warm 1-sentence greeting",
  "weather_mood": "one emoji",
  "focus_task": "most important task today with reason",
  "top_priorities": ["priority 1", "priority 2", "priority 3"],
  "risk_alert": "high risk warning or null",
  "conflict_alert": "conflict warning or null",
  "productivity_tip": "specific tip for their workload",
  "motivation": "short quote not cliche",
  "schedule_suggestion": "time-blocking suggestion e.g. 9-11am work on X"
}}"""

    reply = await call_gemini(
        "Reply ONLY with valid JSON. No markdown. No backticks. No extra text.",
        [{"role": "user", "content": prompt}]
    )

    try:
        briefing = json.loads(reply.replace("```json","").replace("```","").strip())
    except Exception:
        briefing = {
            "greeting": f"Good morning, {name}! Let's make today productive.",
            "weather_mood": "⚡",
            "focus_task": "Start with your highest priority pending task.",
            "top_priorities": ["Review task deadlines", "Work on high-risk tasks", "Plan your week"],
            "risk_alert": None, "conflict_alert": None,
            "productivity_tip": "Block 2-hour deep work sessions with no interruptions.",
            "motivation": "Discipline is the bridge between goals and accomplishment.",
            "schedule_suggestion": "9-11am: deep work, 2-4pm: reviews and planning.",
        }
    return briefing