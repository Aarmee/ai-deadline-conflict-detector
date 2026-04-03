import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { AlertTriangle, Shield, Users } from 'lucide-react'
import styles from './Admin.module.css'

const TYPE_COLOR = {
  DEADLINE_OVERLAP:  '#FF5C5C',
  WORKLOAD_OVERLOAD: '#FFB800',
  DEPENDENCY_BLOCK:  '#7B61FF',
}

export default function AdminConflicts() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-conflicts'],
    queryFn: () => adminAPI.conflictStats(),
    refetchInterval: 60000,
  })

  const s = data?.data

  if (isLoading) return (
    <div className="page">
      <div className={styles.skeletonGrid}>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
      </div>
    </div>
  )

  const byType = s?.by_type || {}
  const bySev  = s?.by_severity || {}
  const topUsers = s?.top_affected_users || []
  const totalByType = Object.values(byType).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="page">
      <div className={styles.pageHeader}>
        <div className={styles.adminHeaderBadge}><Shield size={14} /> Admin Panel</div>
        <h1 className="page-title">Conflict Overview</h1>
        <p className="page-subtitle">{s?.total_unresolved ?? 0} unresolved conflicts system-wide</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FF5C5C18', color: '#FF5C5C' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{s?.total_unresolved ?? 0}</div>
            <div className={styles.statLabel}>Unresolved</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FF5C5C18', color: '#FF5C5C' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{bySev.CRITICAL ?? 0}</div>
            <div className={styles.statLabel}>Critical Severity</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FFB80018', color: '#FFB800' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{bySev.WARNING ?? 0}</div>
            <div className={styles.statLabel}>Warning Severity</div>
          </div>
        </div>
      </div>

      <div className={styles.row}>
        {/* By Type */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardTitle}><AlertTriangle size={15} /> By Conflict Type</div>
          {Object.entries(byType).map(([type, count]) => {
            const pct = Math.round((count / totalByType) * 100)
            const color = TYPE_COLOR[type] || '#8888AA'
            return (
              <div key={type} className={styles.distRow}>
                <span style={{ color, minWidth: 160, fontSize: 12 }}>
                  {type.replace(/_/g, ' ')}
                </span>
                <div className={styles.distTrack}>
                  <div className={styles.distFill} style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className={styles.distPct}>{count}</span>
              </div>
            )
          })}
        </div>

        {/* Top affected users */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardTitle}><Users size={15} /> Most Affected Users</div>
          {topUsers.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">🎉</div>
              <div className="empty-state-title">No conflicts!</div>
            </div>
          ) : (
            topUsers.map((u, i) => (
              <div key={i} className={styles.topUserRow}>
                <div className={styles.avatar}>{u.name[0].toUpperCase()}</div>
                <span className={styles.topUserName}>{u.name}</span>
                <span className={`badge badge-high`}>{u.conflict_count} conflicts</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
