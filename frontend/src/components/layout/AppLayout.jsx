import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '../../store/authStore'
import useThemeStore from '../../store/themeStore'
import { notificationsAPI } from '../../services/api'
import AIAssistant from '../ui/AIAssistant'
import {
  LayoutDashboard, CheckSquare, AlertTriangle, Sparkles,
  BarChart3, Bell, User, LogOut, Zap, Menu, X,
  Kanban, Sun, Moon
} from 'lucide-react'
import styles from './AppLayout.module.css'

const NAV = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/briefing',        icon: Sun,             label: 'Daily Briefing' },
  { to: '/tasks',           icon: CheckSquare,     label: 'Tasks' },
  { to: '/kanban',          icon: Kanban,          label: 'Kanban Board' },
  { to: '/conflicts',       icon: AlertTriangle,   label: 'Conflicts' },
  { to: '/recommendations', icon: Sparkles,        label: 'AI Schedule' },
  { to: '/analytics',       icon: BarChart3,       label: 'Analytics' },
  { to: '/notifications',   icon: Bell,            label: 'Notifications' },
  { to: '/profile',         icon: User,            label: 'Profile' },
]

export default function AppLayout() {
  const [open, setOpen] = useState(true)
  const logout   = useAuthStore(s => s.logout)
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn:  () => notificationsAPI.list({ unread_only: true }),
    refetchInterval: 30000,
  })
  const unreadCount = notifData?.data?.length || 0

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${open ? styles.open : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <Zap size={20} fill="currentColor" />
            {open && <span>DeadlineIQ</span>}
          </div>
          <button className={styles.toggleBtn} onClick={() => setOpen(o => !o)}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <div className={styles.navIcon}>
                <Icon size={18} />
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </div>
              {open && (
                <span className={styles.navLabel}>
                  {label}
                  {badge && <span className={styles.newBadge}>{badge}</span>}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {open && user && (
            <div className={styles.userInfo}>
              <div className={styles.avatar}>{user.full_name?.[0]?.toUpperCase() || 'U'}</div>
              <div className={styles.userText}>
                <div className={styles.userName}>{user.full_name}</div>
                <div className={styles.userEmail}>{user.email}</div>
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

      {/* AI Assistant floating on all pages */}
      <AIAssistant />
    </div>
  )
}
