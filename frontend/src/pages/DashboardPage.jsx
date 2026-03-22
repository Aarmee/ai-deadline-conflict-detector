import { useQuery } from '@tanstack/react-query'
import { dashboardAPI, conflictsAPI, tasksAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { format } from 'date-fns'
import { AlertTriangle, CheckSquare, Zap, TrendingUp, Clock, Bell, Target, Activity } from 'lucide-react'
import styles from './DashboardPage.module.css'

const PRIORITY_COLOR = { LOW: '#A8FF3E', MEDIUM: '#FFB800', HIGH: '#FF5C5C', CRITICAL: '#FF3366' }
const RISK_COLOR     = { HIGH: '#FF5C5C', MEDIUM: '#FFB800', LOW: '#A8FF3E' }

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <div className={styles.statCard} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.statIcon} style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div className={styles.statBody}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  )
}

function WorkloadBar({ score }) {
  const color = score > 80 ? '#FF5C5C' : score > 60 ? '#FFB800' : '#A8FF3E'
  return (
    <div className={styles.workloadWrap}>
      <div className={styles.workloadHeader}>
        <span>Workload Capacity</span>
        <span style={{ color, fontWeight: 700 }}>{score}%</span>
      </div>
      <div className={styles.workloadTrack}>
        <div
          className={styles.workloadFill}
          style={{ width: `${Math.min(score, 100)}%`, background: color }}
        />
      </div>
      <div className={styles.workloadHint}>
        {score > 80 ? '⚠️ Overloaded — consider rescheduling tasks'
         : score > 60 ? '⚡ Busy — manageable but watch new additions'
         : '✅ Healthy workload'}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)

  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.get(),
    refetchInterval: 60000,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks-recent'],
    queryFn: () => tasksAPI.list({ limit: 5 }),
  })

  const { data: conflictsData } = useQuery({
    queryKey: ['conflicts'],
    queryFn: () => conflictsAPI.list(),
  })

  const d = dash?.data
  const tasks = tasksData?.data || []
  const conflicts = conflictsData?.data || []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (dashLoading) return (
    <div className="page">
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 100, flex: '1 1 200px', minWidth: 160 }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="page">
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.greeting}>{greeting},</div>
          <h1 className={styles.name}>{user?.full_name?.split(' ')[0] || 'User'} 👋</h1>
          <p className={styles.date}>{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        <div className={styles.headerBadge}>
          <Activity size={14} />
          <span>Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon={CheckSquare}   label="Active Tasks"      value={d?.total_active_tasks ?? 0} color="#7B61FF" delay={0} />
        <StatCard icon={AlertTriangle} label="Active Conflicts"  value={d?.active_conflicts ?? 0}  color="#FF5C5C" delay={80} sub={d?.active_conflicts > 0 ? 'Needs attention' : 'All clear'} />
        <StatCard icon={Clock}         label="Due This Week"     value={d?.tasks_due_this_week ?? 0} color="#FFB800" delay={160} />
        <StatCard icon={Bell}          label="Unread Alerts"     value={d?.unread_notifications ?? 0} color="#00D4FF" delay={240} />
      </div>

      {/* Workload + Risk Row */}
      <div className={styles.midRow}>
        {/* Workload bar */}
        <div className={`glass ${styles.workloadCard}`}>
          <div className={styles.cardTitle}><Zap size={16} /> Workload Score</div>
          <WorkloadBar score={d?.workload_score ?? 0} />
        </div>

        {/* Risk breakdown */}
        <div className={`glass ${styles.riskCard}`}>
          <div className={styles.cardTitle}><Target size={16} /> Risk Breakdown</div>
          <div className={styles.riskBars}>
            {['HIGH', 'MEDIUM', 'LOW'].map(level => {
              const count = d?.risk_summary?.[level] ?? 0
              const total = d?.total_active_tasks || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={level} className={styles.riskRow}>
                  <span className={`badge badge-${level.toLowerCase()}`}>{level}</span>
                  <div className={styles.riskTrack}>
                    <div className={styles.riskFill} style={{ width: `${pct}%`, background: RISK_COLOR[level] }} />
                  </div>
                  <span className={styles.riskCount}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Tasks + Conflicts Row */}
      <div className={styles.bottomRow}>
        {/* Recent tasks */}
        <div className={`glass ${styles.tableCard}`}>
          <div className={styles.cardTitle}><CheckSquare size={16} /> Recent Tasks</div>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No tasks yet</div>
              <div className="empty-state-text">Create your first task to get started</div>
            </div>
          ) : (
            <div className={styles.taskList}>
              {tasks.map(task => (
                <div key={task.id} className={styles.taskRow}>
                  <div className={styles.taskInfo}>
                    <div className={styles.taskTitle}>{task.title}</div>
                    <div className={styles.taskMeta}>
                      Due {format(new Date(task.deadline), 'MMM d')} · {task.estimated_effort_hours}h
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge" style={{
                      background: `${PRIORITY_COLOR[task.priority]}18`,
                      color: PRIORITY_COLOR[task.priority],
                      border: `1px solid ${PRIORITY_COLOR[task.priority]}44`
                    }}>{task.priority}</span>
                    {task.latest_prediction && (
                      <span className={`badge badge-${task.latest_prediction.risk_level.toLowerCase()}`}>
                        {task.latest_prediction.risk_level}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active conflicts */}
        <div className={`glass ${styles.tableCard}`}>
          <div className={styles.cardTitle}><AlertTriangle size={16} /> Active Conflicts</div>
          {conflicts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <div className="empty-state-title">No conflicts!</div>
              <div className="empty-state-text">Your schedule looks clean</div>
            </div>
          ) : (
            <div className={styles.taskList}>
              {conflicts.slice(0, 5).map(c => (
                <div key={c.id} className={styles.taskRow}>
                  <div className={styles.taskInfo}>
                    <div className={styles.taskTitle}>{c.conflict_type.replace(/_/g, ' ')}</div>
                    <div className={styles.taskMeta}>{c.description.slice(0, 70)}…</div>
                  </div>
                  <span className={`badge badge-${c.severity === 'CRITICAL' ? 'high' : 'medium'}`}>
                    {c.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
