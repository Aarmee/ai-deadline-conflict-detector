import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const login = useAuthStore(s => s.login)
  const loading = useAuthStore(s => s.loading)
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className={styles.authBg}>
      <div className={styles.orbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Zap size={22} fill="currentColor" /></div>
          <span className={styles.logoText}>DeadlineIQ</span>
        </div>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your account</p>

        {serverError && <div className={styles.errorBox}>{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className={styles.inputWrap}>
              <Mail size={15} className={styles.inputIcon} />
              <input
                className={`input ${styles.paddedInput} ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
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
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? <span className="spinner" /> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account? <Link to="/register" className={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
