import { useState, useRef, useEffect } from 'react'
import { aiAPI } from '../../services/api'
import { Sparkles, X, Send, Minimize2, User } from 'lucide-react'
import styles from './AIAssistant.module.css'

const QUICK_PROMPTS = [
  "What should I work on today?",
  "Why are my tasks high risk?",
  "How can I reduce my conflicts?",
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
      {!isUser && <div className={styles.aiAvatar}><Sparkles size={12} /></div>}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
        {msg.content.split('\n').map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
      </div>
      {isUser && <div className={styles.userAvatar}><User size={12} /></div>}
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
  const inputRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { if (open && !minimized) inputRef.current?.focus() }, [open, minimized])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    setInput('')
    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      // Send all messages to backend — backend builds context from DB
      const { data } = await aiAPI.chat(
        newMessages.map(m => ({ role: m.role, content: m.content }))
      )
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Connection error. Is the backend running?"
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${errMsg}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <>
      {!open && (
        <button className={styles.fab} onClick={() => setOpen(true)}>
          <div className={styles.fabInner}><Sparkles size={22} /></div>
          <div className={styles.fabPing} />
          <span className={styles.fabLabel}>Ask AI</span>
        </button>
      )}

      {open && (
        <div className={`${styles.window} ${minimized ? styles.minimized : ''}`}>
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
              <button onClick={() => setMinimized(m => !m)} className={styles.iconBtn}><Minimize2 size={14} /></button>
              <button onClick={() => setOpen(false)} className={styles.iconBtn}><X size={14} /></button>
            </div>
          </div>

          {!minimized && (
            <>
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

              {messages.length <= 1 && (
                <div className={styles.quickPrompts}>
                  {QUICK_PROMPTS.map(q => (
                    <button key={q} className={styles.quickBtn} onClick={() => sendMessage(q)}>{q}</button>
                  ))}
                </div>
              )}

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