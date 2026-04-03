import { create } from 'zustand'

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',

  loadTheme: () => {
    const saved = localStorage.getItem('theme') || 'dark'
    applyTheme(saved)
    set({ theme: saved })
  },

  toggleTheme: () => {
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    })
  },
}))

export default useThemeStore
