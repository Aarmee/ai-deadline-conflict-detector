import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tasksAPI, dashboardAPI, conflictsAPI } from '../../services/api'
import { MessageCircle, X, Send, Minimize2, Sparkles, Bot, User } from 'lucide-react'
import styles from './AIAssistant.module.css'

const QUICK_PROMPTS = [
  "What should I work on today?",
  "Why are my tasks high risk?",
  "How can I reduce conflicts?",
  "Give me a productivity tip",
]

function TypingIndicator() {
  return (
    <div className={styles.typingBubble}>
      <span /><span /><span />
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`${styles.msgRow} ${isUser ? styles.userRow : styles.aiRow}`}>
      {!isUser && (
        <div className={styles.aiAvatar}>
          <Sparkles size={12} />
        </div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
      {isUser && (
        <div className={styles.userAvatar}>
          <User size={12} />
        </div>
      )}
    </div>
  )
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your DeadlineIQ AI assistant 🧠\n\nI know all your tasks, risks, and deadlines. Ask me anything — like what to work on today, why something is high risk, or how to optimize your schedule.",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const { data: tasksData }    = useQuery({ queryKey: ['tasks'], queryFn: () => tasksAPI.list({ limit: 50 }) })
  const { data: dashData }     = useQuery({ queryKey: ['dashboard'], queryFn: dashboardAPI.get })
  const { data: conflictsData }= useQuery({ queryKey: ['conflicts-all'], queryFn: () => conflictsAPI.list() })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [open, minimized])

  const buildContext = () => {
    const tasks = tasksData?.data || []
    const dash  = dashData?.data || {}
    const conflicts = conflictsData?.data || []

    const taskSummary = tasks.map(t =>
      `- "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Deadline: ${t.deadline} | Effort: ${t.estimated_effort_hours}h | Risk: ${t.latest_prediction?.risk_level || 'unknown'} | Risk Score: ${t.latest_prediction ? Math.round(t.latest_prediction.probability_score * 100) + '%' : 'N/A'}`
    ).join('\n')

    const conflictSummary = conflicts.map(c =>
      `- ${c.conflict_type}: ${c.description} (Severity: ${c.severity})`
    ).join('\n') || 'None'

    return `You are DeadlineIQ, an intelligent AI assistant embedded in a smart deadline management system. You have full context of the user's tasks and schedule.

TODAY'S DATE: ${new Date().toDateString()}

USER'S TASKS (${tasks.length} total):
${taskSummary || 'No tasks yet'}

DASHBOARD STATS:
- Active Tasks: ${dash.total_active_tasks || 0}
- Workload Score: ${dash.workload_score || 0}%
- Tasks Due This Week: ${dash.tasks_due_this_week || 0}
- Active Conflicts: ${dash.active_conflicts || 0}
- Risk Breakdown: HIGH=${dash.risk_summary?.HIGH || 0}, MEDIUM=${dash.risk_summary?.MEDIUM || 0}, LOW=${dash.risk_summary?.LOW || 0}

ACTIVE CONFLICTS:
${conflictSummary}

INSTRUCTIONS:
- Be concise, direct, and actionable. Max 4-5 sentences per response.
- Use bullet points for lists.
- Reference specific task names when relevant.
- If all tasks are HIGH risk, explain what factors are driving it.
- Suggest concrete actions, not vague advice.
- Use emojis sparingly but naturally.
- Never say you "don't have access" — you have full context above.`
  }

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    setInput('')
    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildContext(),
          messages: newMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        }),
      })

      const data = await response.json()
      const reply = data.content?.[0]?.text || "Sorry, I couldn't process that. Try again!"
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection error. Make sure you're connected to the internet." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button className={styles.fab} onClick={() => setOpen(true)}>
          <div className={styles.fabInner}>
            <Sparkles size={22} />
          </div>
          <div className={styles.fabPing} />
          <span className={styles.fabLabel}>Ask AI</span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className={`${styles.window} ${minimized ? styles.minimized : ''}`}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}><Sparkles size={14} /></div>
              <div>
                <div className={styles.headerTitle}>DeadlineIQ Assistant</div>
                <div className={styles.headerStatus}>
                  <span className={styles.statusDot} />
                  AI-powered · knows your tasks
                </div>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button onClick={() => setMinimized(m => !m)} className={styles.iconBtn} title="Minimize">
                <Minimize2 size={14} />
              </button>
              <button onClick={() => setOpen(false)} className={styles.iconBtn} title="Close">
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className={styles.messages}>
                {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                {loading && (
                  <div className={`${styles.msgRow} ${styles.aiRow}`}>
                    <div className={styles.aiAvatar}><Sparkles size={12} /></div>
                    <TypingIndicator />
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts */}
              {messages.length <= 1 && (
                <div className={styles.quickPrompts}>
                  {QUICK_PROMPTS.map(q => (
                    <button key={q} className={styles.quickBtn} onClick={() => sendMessage(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className={styles.inputRow}>
                <textarea
                  ref={inputRef}
                  className={styles.input}
                  placeholder="Ask about your tasks, risks, schedule…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <button
                  className={`${styles.sendBtn} ${input.trim() && !loading ? styles.sendActive : ''}`}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
