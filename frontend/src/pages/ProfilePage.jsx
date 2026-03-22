import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { User, Clock, Shield, Save, TrendingUp } from 'lucide-react'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const user = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)
  const [tab, setTab] = useState('profile')

  const { register: regProfile, handleSubmit: hsProfile } = useForm({
    defaultValues: { full_name: user?.full_name, daily_hours_available: user?.daily_hours_available }
  })
  const { register: regPw, handleSubmit: hsPw, reset: resetPw, formState: { errors: pwErrors } } = useForm()

  const profileMutation = useMutation({
    mutationFn: authAPI.updateMe,
    onSuccess: res => { updateUser(res.data); toast.success('Profile updated!') },
    onError: () => toast.error('Update failed'),
  })

  const pwMutation = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => { toast.success('Password changed!'); resetPw() },
    onError: err => toast.error(err.response?.data?.detail || 'Failed'),
  })

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* Profile header */}
      <div className={`glass ${styles.profileHeader}`}>
        <div className={styles.avatar}>
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <div className={styles.profileName}>{user?.full_name}</div>
          <div className={styles.profileEmail}>{user?.email}</div>
          <div className={styles.profileStats}>
            <span className="badge badge-info">
              <Clock size={10} /> {user?.daily_hours_available}h/day capacity
            </span>
            <span className="badge badge-low">
              <TrendingUp size={10} /> {Math.round((user?.completion_rate || 1) * 100)}% completion rate
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'profile' ? styles.activeTab : ''}`} onClick={() => setTab('profile')}>
          <User size={14} /> Profile
        </button>
        <button className={`${styles.tab} ${tab === 'security' ? styles.activeTab : ''}`} onClick={() => setTab('security')}>
          <Shield size={14} /> Security
        </button>
      </div>

      {tab === 'profile' && (
        <div className={`glass ${styles.formCard}`}>
          <h3 className={styles.formTitle}>Personal Information</h3>
          <form onSubmit={hsProfile(d => profileMutation.mutate(d))} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="input" {...regProfile('full_name', { required: true })} />
            </div>
            <div className="form-group">
              <label className="form-label">Daily Hours Available</label>
              <input type="number" step="0.5" min="1" max="16" className="input"
                {...regProfile('daily_hours_available', { valueAsNumber: true })} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                This affects ML predictions and conflict detection accuracy
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? <span className="spinner" /> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className={`glass ${styles.formCard}`}>
          <h3 className={styles.formTitle}>Change Password</h3>
          <form onSubmit={hsPw(d => pwMutation.mutate(d))} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className={`input ${pwErrors.current_password ? 'input-error' : ''}`}
                {...regPw('current_password', { required: 'Required' })} />
              {pwErrors.current_password && <span className="form-error">{pwErrors.current_password.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className={`input ${pwErrors.new_password ? 'input-error' : ''}`}
                placeholder="Min 8 characters"
                {...regPw('new_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
              {pwErrors.new_password && <span className="form-error">{pwErrors.new_password.message}</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={pwMutation.isPending}>
                {pwMutation.isPending ? <span className="spinner" /> : <><Shield size={14} /> Change Password</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
