import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { tasksAPI } from '../services/api'
import { Plus, GripVertical, Clock, AlertTriangle } from 'lucide-react'
import styles from './KanbanPage.module.css'

const COLUMNS = [
  { id: 'PENDING',     label: 'To Do',       color: '#8888AA', accent: 'rgba(136,136,170,0.15)' },
  { id: 'IN_PROGRESS', label: 'In Progress',  color: '#00D4FF', accent: 'rgba(0,212,255,0.12)' },
  { id: 'COMPLETED',   label: 'Done',         color: '#A8FF3E', accent: 'rgba(168,255,62,0.12)' },
  { id: 'MISSED',      label: 'Missed',       color: '#FF5C5C', accent: 'rgba(255,92,92,0.12)' },
]

const RISK_COLOR = { HIGH: '#FF5C5C', MEDIUM: '#FFB800', LOW: '#A8FF3E' }
const PRIO_COLOR = { LOW: '#A8FF3E', MEDIUM: '#FFB800', HIGH: '#FF5C5C', CRITICAL: '#FF3366' }

function KanbanCard({ task, onDragStart }) {
  const risk = task.latest_prediction?.risk_level
  const daysLeft = task.deadline
    ? Math.ceil((new Date(task.deadline) - new Date()) / 86400000)
    : null

  return (
    <div
      className={styles.card}
      draggable
      onDragStart={e => onDragStart(e, task)}
      style={{ borderTop: `3px solid ${risk ? RISK_COLOR[risk] : 'transparent'}` }}
    >
      <div className={styles.cardTop}>
        <GripVertical size={12} className={styles.grip} />
        <div className={styles.cardBadges}>
          <span className="badge" style={{
            background: `${PRIO_COLOR[task.priority]}18`,
            color: PRIO_COLOR[task.priority],
            border: `1px solid ${PRIO_COLOR[task.priority]}33`,
            fontSize: '9px', padding: '2px 7px'
          }}>{task.priority}</span>
          {risk && (
            <span className="badge" style={{
              background: `${RISK_COLOR[risk]}18`,
              color: RISK_COLOR[risk],
              border: `1px solid ${RISK_COLOR[risk]}33`,
              fontSize: '9px', padding: '2px 7px'
            }}>{risk}</span>
          )}
        </div>
      </div>

      <div className={styles.cardTitle}>{task.title}</div>
      {task.category && <div className={styles.cardCategory}>{task.category}</div>}

      <div className={styles.cardFooter}>
        <div className={styles.cardMeta}>
          <Clock size={10} />
          <span>{task.estimated_effort_hours}h</span>
        </div>
        {daysLeft !== null && (
          <div className={styles.daysLeft} style={{
            color: daysLeft <= 2 ? '#FF5C5C' : daysLeft <= 5 ? '#FFB800' : '#8888AA'
          }}>
            {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
          </div>
        )}
      </div>

      {risk && task.latest_prediction && (
        <div className={styles.riskBar}>
          <div className={styles.riskFill} style={{
            width: `${Math.round(task.latest_prediction.probability_score * 100)}%`,
            background: RISK_COLOR[risk]
          }} />
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ col, tasks, onDragStart, onDrop, onDragOver, onDragLeave, isDragOver }) {
  return (
    <div
      className={`${styles.column} ${isDragOver ? styles.dragOver : ''}`}
      onDrop={e => onDrop(e, col.id)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{ '--col-color': col.color, '--col-accent': col.accent }}
    >
      <div className={styles.colHeader}>
        <div className={styles.colDot} style={{ background: col.color }} />
        <span className={styles.colLabel}>{col.label}</span>
        <span className={styles.colCount}>{tasks.length}</span>
      </div>

      <div className={styles.colBody}>
        {tasks.length === 0 && (
          <div className={styles.emptyCol}>
            Drop tasks here
          </div>
        )}
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const qc = useQueryClient()
  const [dragOver, setDragOver] = useState(null)
  const dragTask = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', '', ''],
    queryFn: () => tasksAPI.list({ limit: 100 }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => tasksAPI.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['tasks'])
      qc.invalidateQueries(['dashboard'])
    },
    onError: () => toast.error('Failed to move task'),
  })

  const tasks = data?.data || []

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id)
    return acc
  }, {})

  const handleDragStart = (e, task) => {
    dragTask.current = task
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e, targetStatus) => {
    e.preventDefault()
    setDragOver(null)
    const task = dragTask.current
    if (!task || task.status === targetStatus) return

    // Optimistically update UI
    qc.setQueryData(['tasks', '', ''], old => {
      if (!old) return old
      return { ...old, data: old.data.map(t => t.id === task.id ? { ...t, status: targetStatus } : t) }
    })

    updateMutation.mutate({ id: task.id, status: targetStatus })
    toast.success(`Moved to ${COLUMNS.find(c => c.id === targetStatus)?.label}`)
    dragTask.current = null
  }

  const totalHigh = tasks.filter(t => t.latest_prediction?.risk_level === 'HIGH').length

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kanban Board</h1>
          <p className={styles.subtitle}>
            {tasks.length} tasks · drag & drop to update status
            {totalHigh > 0 && (
              <span className={styles.riskAlert}>
                <AlertTriangle size={12} /> {totalHigh} high risk
              </span>
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.board}>
          {COLUMNS.map(col => (
            <div key={col.id} className={styles.column}>
              <div className={styles.colHeader}>
                <div className={styles.colDot} style={{ background: col.color }} />
                <span className={styles.colLabel}>{col.label}</span>
              </div>
              <div className={styles.colBody}>
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.board}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              col={col}
              tasks={tasksByStatus[col.id] || []}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={() => setDragOver(null)}
              isDragOver={dragOver === col.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
