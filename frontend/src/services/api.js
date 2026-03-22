import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  register: d => api.post('/auth/register', d),
  login:    d => api.post('/auth/login', d),
  me:       ()  => api.get('/auth/me'),
  updateMe: d => api.patch('/auth/me', d),
  changePassword: d => api.post('/auth/change-password', d),
}

// ── Tasks ─────────────────────────────────────────────────
export const tasksAPI = {
  list:       params => api.get('/tasks', { params }),
  create:     d      => api.post('/tasks', d),
  get:        id     => api.get(`/tasks/${id}`),
  update:     (id,d) => api.patch(`/tasks/${id}`, d),
  delete:     id     => api.delete(`/tasks/${id}`),
  complete:   id     => api.post(`/tasks/${id}/complete`),
  start:      id     => api.post(`/tasks/${id}/start`),
  subtasks:   id     => api.get(`/tasks/${id}/subtasks`),
  addSubtask: (id,d) => api.post(`/tasks/${id}/subtasks`, d),
}

// ── Intelligence ─────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/predictions/dashboard'),
}

export const predictionsAPI = {
  forTask: id => api.get(`/predictions/task/${id}`),
}

export const conflictsAPI = {
  list:    params => api.get('/conflicts', { params }),
  detect:  ()     => api.post('/conflicts/detect'),
  resolve: id     => api.post(`/conflicts/${id}/resolve`),
}

export const recommendationsAPI = {
  schedule: ()     => api.get('/recommendations/schedule'),
  history:  ()     => api.get('/recommendations/history'),
  accept:   id     => api.post(`/recommendations/${id}/accept`),
  reject:   id     => api.post(`/recommendations/${id}/reject`),
}

export const notificationsAPI = {
  list:       params => api.get('/notifications', { params }),
  markRead:   id     => api.patch(`/notifications/${id}/read`),
  markAllRead:()     => api.post('/notifications/read-all'),
  delete:     id     => api.delete(`/notifications/${id}`),
}

export const analyticsAPI = {
  productivity: params => api.get('/analytics/productivity', { params }),
  workload:     params => api.get('/analytics/workload', { params }),
  summary:      ()     => api.get('/analytics/summary'),
}

export default api
