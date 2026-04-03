import { create } from 'zustand'
import { adminAPI } from '../services/api'

const useAdminAuthStore = create((set, get) => ({
  admin: null,
  isAuthenticated: !!localStorage.getItem('admin_token'),

  login: async (email, password) => {
    const { data } = await adminAPI.login({ email, password })
    localStorage.setItem('admin_token', data.access_token)
    set({ admin: { email, role: 'admin' }, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('admin_token')
    set({ admin: null, isAuthenticated: false })
  },
}))

export default useAdminAuthStore
