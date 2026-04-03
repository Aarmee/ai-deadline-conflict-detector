import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAdminAuthStore from '../../store/adminAuthStore'
import useThemeStore from '../../store/themeStore'
import {
  LayoutDashboard, Users, Brain, AlertTriangle,
  Activity, LogOut, Zap, Menu, X, Shield, Sun, Moon,
} from 'lucide-react'
import styles from './AdminLayout.module.css'

const NAV = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users',      icon: Users,           label: 'Users' },
  { to: '/admin/ml',         icon: Brain,           label: 'ML Stats' },
  { to: '/admin/conflicts',  icon: AlertTriangle,   label: 'Conflicts' },
  { to: '/admin/activity',   icon: Activity,        label: 'Activity' },
]

export default function AdminLayout() {
  const [open, setOpen] = useState(true)
  const logout   = useAdminAuthStore(s => s.logout)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${open ? styles.open : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <Zap size={20} fill="currentColor" />
            {open && (
              <div className={styles.logoText}>
                <span>DeadlineIQ</span>
                <span className={styles.adminBadge}><Shield size={9} /> Admin</span>
              </div>
            )}
          </div>
          <button className={styles.toggleBtn} onClick={() => setOpen(o => !o)}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <div className={styles.navIcon}><Icon size={18} /></div>
              {open && <span className={styles.navLabel}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {open && (
            <div className={styles.adminInfo}>
              <div className={styles.adminAvatar}><Shield size={14} /></div>
              <div className={styles.adminText}>
                <div className={styles.adminName}>Administrator</div>
                <div className={styles.adminRole}>Full system access</div>
              </div>
            </div>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={16} />
            {open && <span>Logout</span>}
          </button>
          <button className={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {open && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
