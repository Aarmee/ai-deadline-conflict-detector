import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { recommendationsAPI } from '../services/api'
import { Sparkles, RefreshCw, Check, X, Clock, TrendingUp } from 'lucide-react'
import styles from './RecommendationsPage.module.css'

const RISK_COLOR = { HIGH: '#FF5C5C', MEDIUM: '#FFB800', LOW: '#A8FF3E' }

export default function RecommendationsPage() {
  const qc = useQueryClient()
  const [current, setCurrent] = useState(null)

  const genMutation = useMutation({
    mutationFn: recommendationsAPI.schedule,
    onSuccess: res => { setCurrent(res.data); toast.success('Schedule generated!') },
    onError: () => toast.error('Failed to generate schedule'),
  })

  const acceptMutation = useMutation({
    mutationFn: id => recommendationsAPI.accept(id),
    onSuccess: () => { qc.invalidateQueries(['rec-history']); toast.success('Schedule accepted ✅') },
  })

  const rejectMutation = useMutation({
    mutationFn: id => recommendationsAPI.reject(id),
    onSuccess: () => { setCurrent(null); toast.success('Schedule rejected') },
  })

  const { data: histData } = useQuery({
    queryKey: ['rec-history'],
    queryFn: recommendationsAPI.history,
  })

  const history = histData?.data || []

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">AI Schedule Optimizer</h1>
            <p className="page-subtitle">Smart task ordering based on urgency, risk, and your capacity</p>
          </div>
          <button className="btn btn-lime" onClick={() => genMutation.mutate()} disabled={genMutation.isPending}>
            {genMutation.isPending
              ? <><span className="spinner" /> Generating…</>
              : <><Sparkles size={15} /> Generate Schedule</>}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className={`glass ${styles.howItWorks}`}>
        <div className={styles.howTitle}><TrendingUp size={15} /> How the optimizer works</div>
        <div className={styles.howGrid}>
          <div className={styles.howItem}>
            <div className={styles.howNum}>40%</div>
            <div className={styles.howLabel}>Priority Weight</div>
          </div>
          <div className={styles.howItem}>
            <div className={styles.howNum}>35%</div>
            <div className={styles.howLabel}>Deadline Urgency</div>
          </div>
          <div className={styles.howItem}>
            <div className={styles.howNum}>25%</div>
            <div className={styles.howLabel}>ML Risk Score</div>
          </div>
        </div>
      </div>

      {/* Current recommendation */}
      {current && (
        <div className={`glass ${styles.recCard}`}>
          <div className={styles.recHeader}>
            <div>
              <div className={styles.recTitle}>📅 Recommended Schedule</div>
              <div className={styles.recSummary}>{current.reason_summary}</div>
            </div>
            {current.accepted === null || current.accepted === undefined ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" style={{ padding: '8px 16px' }}
                  onClick={() => rejectMutation.mutate(current.id)} disabled={rejectMutation.isPending}>
                  <X size={14} /> Reject
                </button>
                <button className="btn btn-lime"
                  onClick={() => acceptMutation.mutate(current.id)} disabled={acceptMutation.isPending}>
                  <Check size={14} /> Accept
                </button>
              </div>
            ) : (
              <span className={`badge ${current.accepted ? 'badge-low' : 'badge-high'}`}>
                {current.accepted ? '✓ Accepted' : '✗ Rejected'}
              </span>
            )}
          </div>

          <div className={styles.taskOrder}>
            {(current.recommended_order || []).map((item, idx) => (
              <div key={idx} className={styles.orderItem}>
                <div className={styles.orderNum}>{idx + 1}</div>
                <div className={styles.orderInfo}>
                  <div className={styles.orderTitle}>{item.title || `Task ${idx + 1}`}</div>
                  <div className={styles.orderMeta}>
                    <Clock size={11} /> Start: {item.suggested_start_date}
                    <span>· Urgency: {typeof item.urgency_score === 'number' ? item.urgency_score.toFixed(2) : '—'}</span>
                  </div>
                </div>
                {item.risk_level && (
                  <span className={`badge badge-${item.risk_level.toLowerCase()}`}>{item.risk_level}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 className={styles.sectionTitle}>Past Recommendations</h2>
          <div className={styles.historyList}>
            {history.map(rec => (
              <div key={rec.id} className={`glass ${styles.histCard}`}>
                <div className={styles.histHeader}>
                  <div className={styles.histDate}>
                    {new Date(rec.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className={`badge ${rec.accepted === true ? 'badge-low' : rec.accepted === false ? 'badge-high' : 'badge-info'}`}>
                    {rec.accepted === true ? 'Accepted' : rec.accepted === false ? 'Rejected' : 'Pending'}
                  </span>
                </div>
                <div className={styles.histSummary}>{rec.reason_summary}</div>
                <div className={styles.histCount}>{rec.recommended_order?.length || 0} tasks scheduled</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!current && history.length === 0 && !genMutation.isPending && (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <Sparkles size={48} color="var(--indigo-light)" strokeWidth={1} />
          <div className="empty-state-title">No schedule yet</div>
          <div className="empty-state-text">Click "Generate Schedule" to get AI-powered task ordering</div>
        </div>
      )}
    </div>
  )
}
