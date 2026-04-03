import { useState } from 'react'
import { format } from 'date-fns'
import { aiAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { Sun, Sparkles, Clock, AlertTriangle, Target, TrendingUp, CheckCircle } from 'lucide-react'
import styles from './BriefingPage.module.css'

export default function BriefingPage() {
  const user = useAuthStore(s => s.user)
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState('')

  const generateBriefing = async () => {
    setLoading(true)
    setError('')
    try {
      // Backend fetches all task context from DB automatically
      const { data } = await aiAPI.briefing()
      setBriefing(data)
      setGenerated(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate briefing. Is the backend running?')
      // Fallback briefing
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
          <div className={styles.sunIcon}><Sun size={28} /></div>
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

      {error && (
        <div style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.3)', color: 'var(--coral)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

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
            <div className={styles.loadStep}>📊 Reading your tasks from database</div>
            <div className={styles.loadStep}>🧠 Calculating risk patterns</div>
            <div className={styles.loadStep}>✨ Crafting your briefing</div>
          </div>
        </div>
      )}

      {generated && briefing && !loading && (
        <div className={styles.briefingGrid}>
          <div className={styles.greetingCard}>
            <div className={styles.greetingEmoji}>{briefing.weather_mood}</div>
            <div className={styles.greetingText}>{briefing.greeting}</div>
            <div className={styles.greetingMotivation}>"{briefing.motivation}"</div>
          </div>

          <div className={`glass ${styles.focusCard}`}>
            <div className={styles.cardLabel}><Target size={14} /> Today's Focus</div>
            <div className={styles.focusText}>{briefing.focus_task}</div>
          </div>

          <div className={`glass ${styles.scheduleCard}`}>
            <div className={styles.cardLabel}><Clock size={14} /> Suggested Schedule</div>
            <div className={styles.scheduleText}>{briefing.schedule_suggestion}</div>
          </div>

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

          <div className={`glass ${styles.tipCard}`}>
            <div className={styles.cardLabel}><TrendingUp size={14} /> Productivity Tip</div>
            <div className={styles.tipText}>{briefing.productivity_tip}</div>
          </div>
        </div>
      )}
    </div>
  )
}
