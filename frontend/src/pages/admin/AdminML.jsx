import { useQuery } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { Brain, Shield, TrendingUp, AlertTriangle } from 'lucide-react'
import styles from './Admin.module.css'

export default function AdminML() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ml'],
    queryFn: () => adminAPI.mlStats(),
    refetchInterval: 60000,
  })

  const s = data?.data

  if (isLoading) return (
    <div className="page">
      <div className={styles.skeletonGrid}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
      </div>
    </div>
  )

  const total = s?.total_predictions || 0
  const high  = s?.risk_breakdown?.HIGH || 0
  const low   = s?.risk_breakdown?.LOW  || 0
  const highPct = total > 0 ? Math.round((high / total) * 100) : 0
  const lowPct  = total > 0 ? Math.round((low  / total) * 100) : 0

  return (
    <div className="page">
      <div className={styles.pageHeader}>
        <div className={styles.adminHeaderBadge}><Shield size={14} /> Admin Panel</div>
        <h1 className="page-title">ML & Prediction Stats</h1>
        <p className="page-subtitle">Random Forest model performance overview</p>
      </div>

      {/* Model Info */}
      <div className={`glass ${styles.modelInfoCard}`}>
        <Brain size={20} style={{ color: '#A8FF3E' }} />
        <div>
          <div className={styles.modelName}>Random Forest Classifier</div>
          <div className={styles.modelMeta}>
            Version: <strong>{s?.model_version}</strong> &nbsp;·&nbsp;
            Path: <code>{s?.model_path}</code>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#7B61FF18', color: '#7B61FF' }}>
            <Brain size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{total}</div>
            <div className={styles.statLabel}>Total Predictions</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FF5C5C18', color: '#FF5C5C' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{high}</div>
            <div className={styles.statLabel}>HIGH Risk Predictions</div>
            <div className={styles.statSub}>{highPct}% of total</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#A8FF3E18', color: '#A8FF3E' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{low}</div>
            <div className={styles.statLabel}>LOW Risk Predictions</div>
            <div className={styles.statSub}>{lowPct}% of total</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FFB80018', color: '#FFB800' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className={styles.statValue}>{s?.active_high_risk_tasks ?? 0}</div>
            <div className={styles.statLabel}>Active HIGH Risk Tasks</div>
            <div className={styles.statSub}>Currently in system</div>
          </div>
        </div>
      </div>

      {/* Risk Distribution Bar */}
      <div className={`glass ${styles.card}`}>
        <div className={styles.cardTitle}><Brain size={15} /> Risk Distribution</div>
        <div className={styles.distRow}>
          <span style={{ color: '#FF5C5C', minWidth: 40 }}>HIGH</span>
          <div className={styles.distTrack}>
            <div className={styles.distFill} style={{ width: `${highPct}%`, background: '#FF5C5C' }} />
          </div>
          <span className={styles.distPct}>{highPct}%</span>
        </div>
        <div className={styles.distRow}>
          <span style={{ color: '#A8FF3E', minWidth: 40 }}>LOW</span>
          <div className={styles.distTrack}>
            <div className={styles.distFill} style={{ width: `${lowPct}%`, background: '#A8FF3E' }} />
          </div>
          <span className={styles.distPct}>{lowPct}%</span>
        </div>
        <div className={styles.avgScore}>
          Avg probability score: <strong style={{ color: '#FFB800' }}>
            {((s?.avg_probability_score || 0) * 100).toFixed(1)}%
          </strong>
        </div>
      </div>
    </div>
  )
}
