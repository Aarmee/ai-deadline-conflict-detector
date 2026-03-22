import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { conflictsAPI } from '../services/api'
import { AlertTriangle, RefreshCw, CheckCircle, Shield } from 'lucide-react'
import styles from './ConflictsPage.module.css'

const TYPE_INFO = {
  DEADLINE_OVERLAP:  { label: 'Deadline Overlap',  color: '#FF5C5C', desc: 'Multiple tasks due on same day exceed daily capacity' },
  WORKLOAD_OVERLOAD: { label: 'Workload Overload',  color: '#FFB800', desc: 'Total effort in a 7-day window exceeds your capacity' },
  DEPENDENCY_BLOCK:  { label: 'Dependency Block',   color: '#FF8C00', desc: 'Subtask deadline is after parent task deadline' },
}

export default function ConflictsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['conflicts-all'],
    queryFn: () => conflictsAPI.list({ include_resolved: false }),
  })

  const detectMutation = useMutation({
    mutationFn: conflictsAPI.detect,
    onSuccess: (res) => {
      qc.invalidateQueries(['conflicts-all'])
      qc.invalidateQueries(['dashboard'])
      const n = res.data?.length || 0
      toast.success(n > 0 ? `Found ${n} conflict${n > 1 ? 's' : ''}` : 'No conflicts detected 🎉')
    },
    onError: () => toast.error('Detection failed'),
  })

  const resolveMutation = useMutation({
    mutationFn: conflictsAPI.resolve,
    onSuccess: () => { qc.invalidateQueries(['conflicts-all']); qc.invalidateQueries(['dashboard']); toast.success('Conflict resolved') },
  })

  const conflicts = data?.data || []

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Conflict Detection</h1>
            <p className="page-subtitle">AI-powered schedule conflict analysis</p>
          </div>
          <button className="btn btn-primary" onClick={() => detectMutation.mutate()}
            disabled={detectMutation.isPending}>
            {detectMutation.isPending
              ? <><span className="spinner" /> Detecting…</>
              : <><RefreshCw size={15} /> Run Detection</>}
          </button>
        </div>
      </div>

      {/* Type Legend */}
      <div className={styles.legendRow}>
        {Object.entries(TYPE_INFO).map(([key, info]) => (
          <div key={key} className={`glass ${styles.legendCard}`}>
            <div className={styles.legendDot} style={{ background: info.color }} />
            <div>
              <div className={styles.legendTitle}>{info.label}</div>
              <div className={styles.legendDesc}>{info.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : conflicts.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Shield size={48} color="var(--lime)" strokeWidth={1} />
          <div className="empty-state-title">No active conflicts</div>
          <div className="empty-state-text">Your schedule is clean. Run detection to check for new conflicts.</div>
        </div>
      ) : (
        <div className={styles.list}>
          {conflicts.map(c => {
            const info = TYPE_INFO[c.conflict_type] || { label: c.conflict_type, color: '#FFB800' }
            return (
              <div key={c.id} className={styles.conflictCard}
                style={{ borderLeft: `4px solid ${info.color}` }}>
                <div className={styles.conflictTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={16} color={info.color} />
                    <span className={styles.conflictType}>{info.label}</span>
                    <span className={`badge badge-${c.severity === 'CRITICAL' ? 'high' : 'medium'}`}>
                      {c.severity}
                    </span>
                  </div>
                  <div className={styles.conflictDate}>
                    {format(new Date(c.detected_at), 'MMM d, h:mm a')}
                  </div>
                </div>

                <p className={styles.conflictDesc}>{c.description}</p>

                <div className={styles.conflictFooter}>
                  <div className={styles.taskCount}>
                    {c.task_ids?.length || 0} task{(c.task_ids?.length || 0) !== 1 ? 's' : ''} affected
                  </div>
                  <button
                    className="btn"
                    style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(168,255,62,0.1)', color: 'var(--lime)', border: '1px solid rgba(168,255,62,0.3)' }}
                    onClick={() => resolveMutation.mutate(c.id)}
                    disabled={resolveMutation.isPending}>
                    <CheckCircle size={13} /> Mark Resolved
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
