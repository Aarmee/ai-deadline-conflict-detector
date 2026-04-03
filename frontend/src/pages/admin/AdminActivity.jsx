import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { Activity, Shield, UserPlus, AlertTriangle, Brain } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import styles from './Admin.module.css'

export default function AdminActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => adminAPI.activity(),
    refetchInterval: 30000,
  })

  const d = data?.data
  const registrations = d?.recent_registrations || []
  const last24h = d?.last_24h || {}

  if (isLoading) return (
    <div className="page">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8 }} />)}
    </div>
  )

  return (
    <div className="page">
      <div className={styles.pageHeader}>
        <div className={styles.adminHeaderBadge}><Shield size={14} /> Admin Panel</div>
        <h1 className="page-title">System Activity</h1>
        <p className="page-subtitle">Last 24 hours + recent registrations</p>
      </div>

      {/* Last 24h summary */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 600 }}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FF5C5C18', color: '#FF5C5C' }}>
            <Brain size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{last24h.high_risk_predictions ?? 0}</div>
            <div className={styles.statLabel}>HIGH Risk Predictions</div>
            <div className={styles.statSub}>Last 24 hours</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FFB80018', color: '#FFB800' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{last24h.critical_conflicts ?? 0}</div>
            <div className={styles.statLabel}>Critical Conflicts</div>
            <div className={styles.statSub}>Last 24 hours</div>
          </div>
        </div>
      </div>

      {/* Recent registrations */}
      <div className={`glass ${styles.card}`} style={{ marginTop: 0 }}>
        <div className={styles.cardTitle}><UserPlus size={15} /> Recent Registrations (Last 7 days)</div>
        {registrations.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">No new registrations</div>
          </div>
        ) : (
          <div className={styles.activityList}>
            {registrations.map((r, i) => (
              <div key={i} className={styles.activityRow}>
                <div className={styles.avatar}>{r.full_name[0].toUpperCase()}</div>
                <div className={styles.activityInfo}>
                  <div className={styles.activityName}>{r.full_name}</div>
                  <div className={styles.activityEmail}>{r.email}</div>
                </div>
                <div className={styles.activityTime}>
                  {formatDistanceToNow(new Date(r.joined_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
