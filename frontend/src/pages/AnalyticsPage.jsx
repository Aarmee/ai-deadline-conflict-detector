import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import styles from './AnalyticsPage.module.css'

const PIE_COLORS = ['#A8FF3E', '#4F35F3', '#FFB800', '#FF5C5C']

function StatPill({ label, value, color }) {
  return (
    <div className={styles.statPill} style={{ borderColor: `${color}33` }}>
      <div className={styles.pillVal} style={{ color }}>{value}</div>
      <div className={styles.pillLabel}>{label}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 12 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('all')

  const { data: prodData } = useQuery({
    queryKey: ['productivity', period],
    queryFn: () => analyticsAPI.productivity({ period }),
  })
  const { data: workloadData } = useQuery({
    queryKey: ['workload'],
    queryFn: () => analyticsAPI.workload({ days: 14 }),
  })
  const { data: summaryData } = useQuery({
    queryKey: ['summary'],
    queryFn: analyticsAPI.summary,
  })

  const prod = prodData?.data
  const workload = workloadData?.data
  const summary = summaryData?.data

  const pieData = summary ? [
    { name: 'Completed', value: summary.task_counts?.completed || 0 },
    { name: 'Pending',   value: summary.task_counts?.pending   || 0 },
    { name: 'In Progress', value: summary.task_counts?.in_progress || 0 },
    { name: 'Missed',    value: summary.task_counts?.missed    || 0 },
  ].filter(d => d.value > 0) : []

  const workloadChartData = (workload?.days || []).map(d => ({
    date: d.date.slice(5), // MM-DD
    effort: d.effort_hours,
    capacity: d.capacity_hours,
    overloaded: d.overloaded,
  }))

  const rate = prod ? Math.round(prod.completion_rate * 100) : 0

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Your productivity insights and workload trends</p>
          </div>
          <div className={styles.periodSwitch}>
            {['weekly', 'monthly', 'all'].map(p => (
              <button key={p} className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
                onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className={styles.kpiRow}>
        <div className={`glass ${styles.completionCard}`}>
          <div className={styles.completionLabel}>Completion Rate</div>
          <div className={styles.completionRing}>
            <svg viewBox="0 0 100 100" className={styles.ringsvg}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
              <circle cx="50" cy="50" r="40" fill="none"
                stroke={rate >= 70 ? '#A8FF3E' : rate >= 40 ? '#FFB800' : '#FF5C5C'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${rate * 2.51} 251`}
                transform="rotate(-90 50 50)" />
            </svg>
            <div className={styles.ringText}>
              <div className={styles.ringVal}>{rate}%</div>
              <div className={styles.ringLabel}>on time</div>
            </div>
          </div>
        </div>

        <div className={styles.statsCol}>
          <StatPill label="Completed" value={prod?.total_completed ?? '—'} color="#A8FF3E" />
          <StatPill label="Missed"    value={prod?.total_missed    ?? '—'} color="#FF5C5C" />
          <StatPill label="Pending"   value={prod?.total_pending   ?? '—'} color="#FFB800" />
          <StatPill label="Total"     value={summary?.task_counts?.total ?? '—'} color="#7B61FF" />
        </div>

        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className={`glass ${styles.pieCard}`}>
            <div className={styles.chartTitle}>Task Status Mix</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Workload Chart */}
      <div className={`glass ${styles.chartCard}`}>
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>14-Day Workload vs Capacity</div>
          {workload && (
            <div className={styles.chartMeta}>
              {workload.overload_days} overload day{workload.overload_days !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={workloadChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="effort"   name="Effort (h)"   fill="#4F35F3" radius={[4,4,0,0]} />
            <Bar dataKey="capacity" name="Capacity (h)" fill="rgba(168,255,62,0.3)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
