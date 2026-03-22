import { create } from 'zustand'
import { authAPI } from '../services/api'

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    const me = await authAPI.me()
    set({ user: me.data, isAuthenticated: true, loading: false })
  },

  register: async (formData) => {
    set({ loading: true })
    const { data } = await authAPI.register(formData)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    const me = await authAPI.me()
    set({ user: me.data, isAuthenticated: true, loading: false })
  },

  loadUser: async () => {
    if (!localStorage.getItem('access_token')) return
    try {
      const { data } = await authAPI.me()
      set({ user: data, isAuthenticated: true })
    } catch {
      get().logout()
    }
  },

  logout: () => {
    localStorage.clear()
    set({ user: null, isAuthenticated: false })
  },

  updateUser: (data) => set(s => ({ user: { ...s.user, ...data } })),
}))

export default useAuthStore
