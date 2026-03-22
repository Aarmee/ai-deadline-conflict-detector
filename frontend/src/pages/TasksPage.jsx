import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { tasksAPI } from '../services/api'
import { Plus, Search, Filter, Trash2, Edit2, CheckCircle, Play, ChevronDown, X, AlertCircle } from 'lucide-react'
import styles from './TasksPage.module.css'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES   = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED']
const PRIO_COLOR = { LOW: '#A8FF3E', MEDIUM: '#FFB800', HIGH: '#FF5C5C', CRITICAL: '#FF3366' }
const RISK_COLOR = { HIGH: '#FF5C5C', MEDIUM: '#FFB800', LOW: '#A8FF3E' }

function TaskModal({ task, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!task

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEdit ? {
      title: task.title, description: task.description,
      deadline: task.deadline, estimated_effort_hours: task.estimated_effort_hours,
      priority: task.priority, category: task.category,
    } : { priority: 'MEDIUM', estimated_effort_hours: 2 }
  })

  const mutation = useMutation({
    mutationFn: d => isEdit ? tasksAPI.update(task.id, d) : tasksAPI.create(d),
    onSuccess: (res) => {
      qc.invalidateQueries(['tasks'])
      qc.invalidateQueries(['dashboard'])
      const risk = res.data?.prediction?.risk_level
      if (risk) {
        const msg = risk === 'HIGH'
          ? '⚠️ Task created — HIGH risk detected!'
          : `Task ${isEdit ? 'updated' : 'created'} — Risk: ${risk}`
        toast[risk === 'HIGH' ? 'error' : 'success'](msg)
      } else {
        toast.success(`Task ${isEdit ? 'updated' : 'created'}!`)
      }
      onClose()
    },
    onError: err => toast.error(err.response?.data?.detail || 'Failed'),
  })

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className={styles.modalForm}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Task title"
              {...register('title', { required: 'Title is required' })} />
            {errors.title && <span className="form-error">{errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input" rows={3} placeholder="Optional description"
              style={{ resize: 'vertical', minHeight: 80 }}
              {...register('description')} />
          </div>

          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label">Deadline *</label>
              <input type="date" className={`input ${errors.deadline ? 'input-error' : ''}`}
                {...register('deadline', { required: 'Deadline is required' })} />
              {errors.deadline && <span className="form-error">{errors.deadline.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Effort Hours *</label>
              <input type="number" step="0.5" min="0.5" className={`input ${errors.estimated_effort_hours ? 'input-error' : ''}`}
                placeholder="e.g. 4"
                {...register('estimated_effort_hours', { required: true, min: 0.5, valueAsNumber: true })} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="input" {...register('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="input" placeholder="e.g. Academic, Work"
                {...register('category')} />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskCard({ task, onEdit }) {
  const qc = useQueryClient()

  const completeMutation = useMutation({
    mutationFn: () => tasksAPI.complete(task.id),
    onSuccess: () => { qc.invalidateQueries(['tasks']); qc.invalidateQueries(['dashboard']); toast.success('Task completed! 🎉') },
  })
  const startMutation = useMutation({
    mutationFn: () => tasksAPI.start(task.id),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Task started!') },
  })
  const deleteMutation = useMutation({
    mutationFn: () => tasksAPI.delete(task.id),
    onSuccess: () => { qc.invalidateQueries(['tasks']); qc.invalidateQueries(['dashboard']); toast.success('Task deleted') },
  })

  const riskLevel = task.latest_prediction?.risk_level
  const isCompleted = task.status === 'COMPLETED'
  const isMissed = task.status === 'MISSED'

  return (
    <div className={`${styles.taskCard} ${isCompleted ? styles.completed : ''} ${isMissed ? styles.missed : ''}`}>
      {riskLevel && (
        <div className={styles.riskStripe} style={{ background: RISK_COLOR[riskLevel] }} />
      )}

      <div className={styles.taskTop}>
        <div className={styles.taskMeta}>
          <span className="badge" style={{
            background: `${PRIO_COLOR[task.priority]}18`,
            color: PRIO_COLOR[task.priority],
            border: `1px solid ${PRIO_COLOR[task.priority]}33`
          }}>{task.priority}</span>
          {task.category && <span className="badge badge-info">{task.category}</span>}
          {riskLevel && (
            <span className={`badge badge-${riskLevel.toLowerCase()}`}>
              {riskLevel} RISK
            </span>
          )}
        </div>
        <div className={styles.taskStatus} style={{
          color: task.status === 'COMPLETED' ? '#A8FF3E' : task.status === 'IN_PROGRESS' ? '#00D4FF' : task.status === 'MISSED' ? '#FF5C5C' : '#8888AA'
        }}>
          {task.status.replace('_', ' ')}
        </div>
      </div>

      <h3 className={styles.taskTitle}>{task.title}</h3>
      {task.description && <p className={styles.taskDesc}>{task.description}</p>}

      <div className={styles.taskFooter}>
        <div className={styles.taskInfo}>
          <span>📅 {format(parseISO(task.deadline), 'MMM d, yyyy')}</span>
          <span>⏱ {task.estimated_effort_hours}h</span>
          {task.subtask_count > 0 && <span>🔗 {task.subtask_count} subtasks</span>}
        </div>

        {!isCompleted && !isMissed && (
          <div className={styles.taskActions}>
            {task.status === 'PENDING' && (
              <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: '12px' }}
                onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                <Play size={12} /> Start
              </button>
            )}
            {task.status !== 'COMPLETED' && (
              <button className="btn" style={{ padding: '6px 10px', fontSize: '12px', background: 'rgba(168,255,62,0.1)', color: 'var(--lime)', border: '1px solid rgba(168,255,62,0.3)' }}
                onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
                <CheckCircle size={12} /> Done
              </button>
            )}
            <button className="btn btn-ghost" style={{ padding: '6px 8px' }} onClick={() => onEdit(task)}>
              <Edit2 size={13} />
            </button>
            <button className="btn btn-danger" style={{ padding: '6px 8px' }}
              onClick={() => { if (confirm('Delete task?')) deleteMutation.mutate() }} disabled={deleteMutation.isPending}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {riskLevel && task.latest_prediction && (
        <div className={styles.predBar}>
          <div className={styles.predFill}
            style={{ width: `${Math.round(task.latest_prediction.probability_score * 100)}%`, background: RISK_COLOR[riskLevel] }} />
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filterStatus, filterPriority],
    queryFn: () => tasksAPI.list({
      ...(filterStatus && { status: filterStatus }),
      ...(filterPriority && { priority: filterPriority }),
      limit: 100,
    }),
  })

  const tasks = (data?.data || []).filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (task) => { setEditTask(task); setShowModal(true) }
  const handleClose = () => { setShowModal(false); setEditTask(null) }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Tasks</h1>
            <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} · AI risk prediction on every task</p>
          </div>
          <button className="btn btn-lime" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Task
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input className={`input ${styles.searchInput}`} placeholder="Search tasks..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 'auto', minWidth: 130 }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', minWidth: 130 }}
            value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius)' }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">No tasks found</div>
          <div className="empty-state-text">Create a task to get AI risk predictions</div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowModal(true)}>
            <Plus size={15} /> Create First Task
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {showModal && <TaskModal task={editTask} onClose={handleClose} />}
    </div>
  )
}
