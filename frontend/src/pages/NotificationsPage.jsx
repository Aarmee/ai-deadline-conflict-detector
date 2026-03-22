import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { notificationsAPI } from '../services/api'
import { Bell, CheckCheck, Trash2, AlertTriangle, Zap, Info, Clock } from 'lucide-react'
import styles from './NotificationsPage.module.css'

const TYPE_ICON = {
  RISK_ALERT:          { icon: AlertTriangle, color: '#FF5C5C' },
  CONFLICT_DETECTED:   { icon: Zap,           color: '#FFB800' },
  DEADLINE_REMINDER:   { icon: Clock,         color: '#00D4FF' },
  SYSTEM:              { icon: Info,          color: '#7B61FF' },
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.list({ limit: 50 }),
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsAPI.markAllRead,
    onSuccess: res => {
      qc.invalidateQueries(['notifications'])
      qc.invalidateQueries(['notifications-count'])
      toast.success(`Marked ${res.data.marked_read} as read`)
    },
  })

  const markReadMutation = useMutation({
    mutationFn: notificationsAPI.markRead,
    onSuccess: () => {
      qc.invalidateQueries(['notifications'])
      qc.invalidateQueries(['notifications-count'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: notificationsAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['notifications']); toast.success('Deleted') },
  })

  const notifications = data?.data || []
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">{unreadCount} unread · {notifications.length} total</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-ghost" onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}>
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <Bell size={48} strokeWidth={1} color="var(--text-muted)" />
          <div className="empty-state-title">No notifications</div>
          <div className="empty-state-text">You're all caught up!</div>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map(n => {
            const typeInfo = TYPE_ICON[n.type] || TYPE_ICON.SYSTEM
            const Icon = typeInfo.icon
            return (
              <div key={n.id}
                className={`${styles.notifCard} ${!n.is_read ? styles.unread : ''}`}
                onClick={() => !n.is_read && markReadMutation.mutate(n.id)}>
                <div className={styles.notifIcon} style={{ background: `${typeInfo.color}15`, color: typeInfo.color }}>
                  <Icon size={16} />
                </div>
                <div className={styles.notifBody}>
                  <div className={styles.notifType}>{n.type.replace(/_/g, ' ')}</div>
                  <div className={styles.notifMsg}>{n.message}</div>
                  <div className={styles.notifTime}>{format(new Date(n.created_at), 'MMM d, h:mm a')}</div>
                </div>
                <div className={styles.notifActions}>
                  {!n.is_read && <div className={styles.unreadDot} />}
                  <button className={styles.deleteBtn}
                    onClick={e => { e.stopPropagation(); deleteMutation.mutate(n.id) }}>
                    <Trash2 size={13} />
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
