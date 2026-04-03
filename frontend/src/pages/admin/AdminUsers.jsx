import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { Users, Shield, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import styles from './Admin.module.css'

export default function AdminUsers() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAPI.users(),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleUser(id),
    onSuccess: (res) => {
      toast.success(res.data.message)
      qc.invalidateQueries(['admin-users'])
      qc.invalidateQueries(['admin-stats'])
    },
    onError: () => toast.error('Failed to update user status'),
  })

  const users = data?.data || []

  if (isLoading) return (
    <div className="page">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8 }} />)}
    </div>
  )

  return (
    <div className="page">
      <div className={styles.pageHeader}>
        <div className={styles.adminHeaderBadge}><Shield size={14} /> Admin Panel</div>
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">{users.length} registered users</p>
      </div>

      <div className={`glass ${styles.tableWrap}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Tasks</th>
              <th>Daily Hours</th>
              <th>Completion</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className={styles.nameCell}>
                  <div className={styles.avatar}>{u.full_name[0].toUpperCase()}</div>
                  {u.full_name}
                </td>
                <td className={styles.muted}>{u.email}</td>
                <td className={styles.muted}>{format(new Date(u.joined_at), 'MMM d, yyyy')}</td>
                <td><span className={styles.pill}>{u.task_count}</span></td>
                <td className={styles.muted}>{u.daily_hours_available}h</td>
                <td>
                  <span style={{ color: u.completion_rate >= 0.7 ? '#A8FF3E' : '#FFB800' }}>
                    {Math.round(u.completion_rate * 100)}%
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-low' : 'badge-high'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn ${u.is_active ? 'btn-danger' : 'btn-ghost'}`}
                    style={{ padding: '5px 12px', fontSize: 12 }}
                    onClick={() => toggleMutation.mutate(u.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {u.is_active
                      ? <><UserX size={13} /> Deactivate</>
                      : <><UserCheck size={13} /> Activate</>
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={40} /></div>
            <div className="empty-state-title">No users yet</div>
          </div>
        )}
      </div>
    </div>
  )
}
