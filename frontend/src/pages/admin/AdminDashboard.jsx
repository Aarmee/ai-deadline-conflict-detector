import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { Users, CheckSquare, Brain, AlertTriangle, Shield, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import styles from './Admin.module.css'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.stats(),
    refetchInterval: 60000,
  })

  const s = statsData?.data

  if (isLoading) return (
    <div className="page">
      <div className={styles.skeletonGrid}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
      </div>
    </div>
  )

  const taskTotal = s?.tasks?.total || 0
  const taskByStatus = s?.tasks?.by_status || {}

  return (
    <div className="page">
      <div className={styles.pageHeader}>
        <div className={styles.adminHeaderBadge}><Shield size={14} /> Admin Panel</div>
        <h1 className="page-title">System Overview</h1>
        <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon={Users}         label="Total Users"        value={s?.users?.total ?? 0}          color="#7B61FF"
          sub={`${s?.users?.active ?? 0} active · ${s?.users?.inactive ?? 0} inactive`} />
        <StatCard icon={CheckSquare}   label="Total Tasks"        value={taskTotal}                      color="#00D4FF"
          sub={`${taskByStatus.IN_PROGRESS ?? 0} in progress`} />
        <StatCard icon={Brain}         label="Total Predictions"  value={s?.predictions?.total ?? 0}    color="#A8FF3E" />
        <StatCard icon={AlertTriangle} label="Unresolved Conflicts" value={s?.conflicts?.unresolved ?? 0} color="#FF5C5C"
          sub={`${s?.conflicts?.total ?? 0} total detected`} />
      </div>

      {/* Task Status Breakdown */}
      <div className={styles.row}>
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardTitle}><CheckSquare size={15} /> Task Status Breakdown</div>
          <div className={styles.statusGrid}>
            {[
              { label: 'Pending',     key: 'PENDING',     color: '#8888AA' },
              { label: 'In Progress', key: 'IN_PROGRESS', color: '#00D4FF' },
              { label: 'Completed',   key: 'COMPLETED',   color: '#A8FF3E' },
              { label: 'Missed',      key: 'MISSED',      color: '#FF5C5C' },
            ].map(({ label, key, color }) => {
              const count = taskByStatus[key] ?? 0
              const pct = taskTotal > 0 ? Math.round((count / taskTotal) * 100) : 0
              return (
                <div key={key} className={styles.statusItem}>
                  <div className={styles.statusHeader}>
                    <span style={{ color }}>{label}</span>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className={styles.statusPct}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* User Health */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardTitle}><Users size={15} /> User Health</div>
          <div className={styles.healthItems}>
            <div className={styles.healthRow}>
              <span className={styles.healthLabel}>Active Users</span>
              <div className={styles.healthBar}>
                <div className={styles.healthFill} style={{
                  width: s?.users?.total ? `${(s.users.active / s.users.total) * 100}%` : '0%',
                  background: '#A8FF3E'
                }} />
              </div>
              <span className={styles.healthVal} style={{ color: '#A8FF3E' }}>{s?.users?.active ?? 0}</span>
            </div>
            <div className={styles.healthRow}>
              <span className={styles.healthLabel}>Deactivated</span>
              <div className={styles.healthBar}>
                <div className={styles.healthFill} style={{
                  width: s?.users?.total ? `${(s.users.inactive / s.users.total) * 100}%` : '0%',
                  background: '#FF5C5C'
                }} />
              </div>
              <span className={styles.healthVal} style={{ color: '#FF5C5C' }}>{s?.users?.inactive ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
