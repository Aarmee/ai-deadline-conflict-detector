import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import useAdminAuthStore from './store/adminAuthStore'
import useThemeStore from './store/themeStore'
import AppLayout from './components/layout/AppLayout'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import KanbanPage from './pages/KanbanPage'
import ConflictsPage from './pages/ConflictsPage'
import RecommendationsPage from './pages/RecommendationsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import BriefingPage from './pages/BriefingPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminML from './pages/admin/AdminML'
import AdminConflicts from './pages/admin/AdminConflicts'
import AdminActivity from './pages/admin/AdminActivity'

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}
function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}
function AdminRoute({ children }) {
  const isAuthenticated = useAdminAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const loadUser  = useAuthStore(s => s.loadUser)
  const loadTheme = useThemeStore(s => s.loadTheme)
  useEffect(() => { loadUser(); loadTheme() }, [])
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="ml"        element={<AdminML />} />
          <Route path="conflicts" element={<AdminConflicts />} />
          <Route path="activity"  element={<AdminActivity />} />
        </Route>

        {/* User routes */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"       element={<DashboardPage />} />
          <Route path="tasks"           element={<TasksPage />} />
          <Route path="kanban"          element={<KanbanPage />} />
          <Route path="briefing"        element={<BriefingPage />} />
          <Route path="conflicts"       element={<ConflictsPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="analytics"       element={<AnalyticsPage />} />
          <Route path="notifications"   element={<NotificationsPage />} />
          <Route path="profile"         element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
