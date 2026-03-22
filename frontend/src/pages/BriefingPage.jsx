import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { tasksAPI, dashboardAPI, conflictsAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { Sun, Sparkles, RefreshCw, Clock, AlertTriangle, Target, TrendingUp, CheckCircle } from 'lucide-react'
import styles from './BriefingPage.module.css'

export default function BriefingPage() {
  const user = useAuthStore(s => s.user)
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const { data: tasksData }     = useQuery({ queryKey: ['tasks', '', ''], queryFn: () => tasksAPI.list({ limit: 50 }) })
  const { data: dashData }      = useQuery({ queryKey: ['dashboard'], queryFn: dashboardAPI.get })
  const { data: conflictsData } = useQuery({ queryKey: ['conflicts-all'], queryFn: () => conflictsAPI.list() })

  const generateBriefing = async () => {
    setLoading(true)
    const tasks = tasksData?.data || []
    const dash  = dashData?.data || {}
    const conflicts = conflictsData?.data || []

    const today = new Date()
    const todayStr = format(today, 'EEEE, MMMM d yyyy')
    const dueSoon = tasks.filter(t => {
      const days = Math.ceil((new Date(t.deadline) - today) / 86400000)
      return days >= 0 && days <= 3 && t.status !== 'COMPLETED'
    })
    const highRisk = tasks.filter(t => t.latest_prediction?.risk_level === 'HIGH' && t.status !== 'COMPLETED')

    const prompt = `You are DeadlineIQ's smart daily briefing generator. Create a personalized morning briefing for ${user?.full_name?.split(' ')[0] || 'the user'}.

TODAY: ${todayStr}

CONTEXT:
- Total active tasks: ${tasks.filter(t => !['COMPLETED','MISSED'].includes(t.status)).length}
- Tasks due in next 3 days: ${dueSoon.map(t => `"${t.title}" (${t.deadline}, ${t.estimated_effort_hours}h, ${t.latest_prediction?.risk_level || '?'} risk)`).join(', ') || 'None'}
- HIGH risk tasks: ${highRisk.map(t => `"${t.title}"`).join(', ') || 'None'}
- Active conflicts: ${conflicts.length}
- Workload score: ${dash.workload_score || 0}%

Generate a JSON briefing with EXACTLY this structure (no markdown, pure JSON):
{
  "greeting": "A warm, motivating 1-sentence greeting",
  "weather_mood": "A single emoji representing today's task mood",
  "focus_task": "The single most important task to focus on today with reason (1 sentence)",
  "top_priorities": ["task1 with deadline and why urgent", "task2", "task3"],
  "risk_alert": "1 sentence about high risk tasks or null if none",
  "conflict_alert": "1 sentence about conflicts or null if none",  
  "productivity_tip": "A specific, actionable productivity tip tailored to their workload",
  "motivation": "A short powerful motivational quote (not cliche)",
  "schedule_suggestion": "A specific time-blocking suggestion for today (e.g. '9-11am: work on X, 2-4pm: tackle Y')"
}`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await response.json()
      const text = data.content?.[0]?.text || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setBriefing(parsed)
      setGenerated(true)
    } catch (err) {
      console.error(err)
      setBriefing({
        greeting: `Good morning, ${user?.full_name?.split(' ')[0]}! Ready to crush your deadlines today?`,
        weather_mood: '⚡',
        focus_task: 'Focus on your highest priority task first thing.',
        top_priorities: ['Check your task list', 'Review deadlines', 'Plan your day'],
        risk_alert: null,
        conflict_alert: null,
        productivity_tip: 'Use the Pomodoro technique: 25 min focused work, 5 min break.',
        motivation: 'Small consistent actions create extraordinary results.',
        schedule_suggestion: 'Block 2-3 hour deep work sessions in the morning.',
      })
      setGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'

  return (
    <div className="page">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.sunIcon}>
            <Sun size={28} />
          </div>
          <div>
            <h1 className={styles.title}>Daily Briefing</h1>
            <p className={styles.subtitle}>{format(new Date(), 'EEEE, MMMM d yyyy')} · Good {timeOfDay}</p>
          </div>
        </div>
        <button className={`btn btn-lime ${styles.genBtn}`} onClick={generateBriefing} disabled={loading}>
          {loading
            ? <><span className="spinner" /> Generating…</>
            : <><Sparkles size={15} /> {generated ? 'Regenerate' : 'Generate Briefing'}</>}
        </button>
      </div>

      {!generated && !loading && (
        <div className={styles.placeholder}>
          <div className={styles.placeholderOrb} />
          <Sun size={56} strokeWidth={1} color="var(--amber)" className={styles.placeholderIcon} />
          <h2 className={styles.placeholderTitle}>Start your day with AI</h2>
          <p className={styles.placeholderText}>
            Click "Generate Briefing" to get a personalized AI morning report —<br />
            your focus task, risk alerts, schedule suggestion, and motivation for today.
          </p>
          <button className="btn btn-primary" onClick={generateBriefing} style={{ marginTop: 8 }}>
            <Sparkles size={15} /> Generate My Briefing
          </button>
        </div>
      )}

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingOrbs}>
            <div className={styles.loadOrb1} /><div className={styles.loadOrb2} /><div className={styles.loadOrb3} />
          </div>
          <div className={styles.loadingText}>AI is analyzing your tasks and schedule…</div>
          <div className={styles.loadingSteps}>
            <div className={styles.loadStep}>📊 Reading your 
            {tasksData?.data?.length || 0} tasks</div>
            <div className={styles.loadStep}>🧠 Calculating risk patterns</div>
            <div className={styles.loadStep}>✨ Crafting your briefing</div>
          </div>
        </div>
      )}

      {generated && briefing && !loading && (
        <div className={styles.briefingGrid}>
          {/* Hero greeting card */}
          <div className={styles.greetingCard}>
            <div className={styles.greetingEmoji}>{briefing.weather_mood}</div>
            <div className={styles.greetingText}>{briefing.greeting}</div>
            <div className={styles.greetingMotivation}>"{briefing.motivation}"</div>
          </div>

          {/* Focus task */}
          <div className={`glass ${styles.focusCard}`}>
            <div className={styles.cardLabel}><Target size={14} /> Today's Focus</div>
            <div className={styles.focusText}>{briefing.focus_task}</div>
          </div>

          {/* Schedule suggestion */}
          <div className={`glass ${styles.scheduleCard}`}>
            <div className={styles.cardLabel}><Clock size={14} /> Suggested Schedule</div>
            <div className={styles.scheduleText}>{briefing.schedule_suggestion}</div>
          </div>

          {/* Top priorities */}
          <div className={`glass ${styles.prioritiesCard}`}>
            <div className={styles.cardLabel}><CheckCircle size={14} /> Top Priorities</div>
            <div className={styles.priorityList}>
              {briefing.top_priorities?.map((p, i) => (
                <div key={i} className={styles.priorityItem}>
                  <div className={styles.priorityNum}>{i + 1}</div>
                  <div className={styles.priorityText}>{p}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts row */}
          {(briefing.risk_alert || briefing.conflict_alert) && (
            <div className={styles.alertsRow}>
              {briefing.risk_alert && (
                <div className={styles.alertCard} style={{ borderColor: 'rgba(255,92,92,0.3)', background: 'rgba(255,92,92,0.07)' }}>
                  <AlertTriangle size={15} color="var(--coral)" />
                  <span>{briefing.risk_alert}</span>
                </div>
              )}
              {briefing.conflict_alert && (
                <div className={styles.alertCard} style={{ borderColor: 'rgba(255,184,0,0.3)', background: 'rgba(255,184,0,0.07)' }}>
                  <AlertTriangle size={15} color="var(--amber)" />
                  <span>{briefing.conflict_alert}</span>
                </div>
              )}
            </div>
          )}

          {/* Productivity tip */}
          <div className={`glass ${styles.tipCard}`}>
            <div className={styles.cardLabel}><TrendingUp size={14} /> Productivity Tip</div>
            <div className={styles.tipText}>{briefing.productivity_tip}</div>
          </div>
        </div>
      )}
    </div>
  )
}
