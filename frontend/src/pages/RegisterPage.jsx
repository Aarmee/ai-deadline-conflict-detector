import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { Zap, Mail, Lock, User, Clock, ArrowRight } from 'lucide-react'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { daily_hours_available: 8 }
  })
  const registerUser = useAuthStore(s => s.register)
  const loading = useAuthStore(s => s.loading)
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        daily_hours_available: parseFloat(data.daily_hours_available),
      })
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Registration failed')
    }
  }

  return (
    <div className={styles.authBg}>
      <div className={styles.orbs}>
        <div className={styles.orb1} /><div className={styles.orb2} /><div className={styles.orb3} />
      </div>

      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Zap size={22} fill="currentColor" /></div>
          <span className={styles.logoText}>DeadlineIQ</span>
        </div>

        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Start managing your deadlines intelligently</p>

        {serverError && <div className={styles.errorBox}>{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className={styles.inputWrap}>
              <User size={15} className={styles.inputIcon} />
              <input
                className={`input ${styles.paddedInput} ${errors.full_name ? 'input-error' : ''}`}
                placeholder="John Doe"
                {...register('full_name', { required: 'Name is required' })}
              />
            </div>
            {errors.full_name && <span className="form-error">{errors.full_name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={15} className={styles.inputIcon} />
              <input
                className={`input ${styles.paddedInput} ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
              />
            </div>
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className={styles.inputWrap}>
              <Lock size={15} className={styles.inputIcon} />
              <input
                type="password"
                className={`input ${styles.paddedInput} ${errors.password ? 'input-error' : ''}`}
                placeholder="Min 8 characters"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
              />
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Daily hours available for work</label>
            <div className={styles.inputWrap}>
              <Clock size={15} className={styles.inputIcon} />
              <input
                type="number" min="1" max="16" step="0.5"
                className={`input ${styles.paddedInput}`}
                {...register('daily_hours_available', { required: true, min: 1, max: 16 })}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Used by AI to calculate your workload capacity</span>
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? <span className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
