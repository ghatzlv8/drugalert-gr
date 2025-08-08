import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import axios from 'axios'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  full_name?: string
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled'
  trial_end_date: string
  subscription_end_date?: string
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  sms_credits: number
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, full_name?: string, phone?: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  initAuth: () => void
  checkSubscription: () => boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
          })
          
          const { access_token, user } = response.data
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })
          
          // Set default auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          
          toast.success('Welcome back!')
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.response?.data?.detail || 'Login failed')
          throw error
        }
      },

      signup: async (email: string, password: string, full_name?: string, phone?: string) => {
        set({ isLoading: true })
        try {
          const response = await axios.post(`${API_URL}/auth/signup`, {
            email,
            password,
            full_name,
            phone,
          })
          
          const { access_token, user } = response.data
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          })
          
          // Set default auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          
          toast.success('Account created! You have 4 days of free access.')
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.response?.data?.detail || 'Signup failed')
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        
        delete axios.defaults.headers.common['Authorization']
        toast.success('Logged out successfully')
      },

      updateUser: (user: User) => {
        set({ user })
      },

      initAuth: () => {
        const state = get()
        if (state.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },

      checkSubscription: () => {
        const state = get()
        if (!state.user) return false
        
        const now = new Date()
        
        if (state.user.subscription_status === 'active') {
          if (state.user.subscription_end_date) {
            return new Date(state.user.subscription_end_date) > now
          }
          return true
        }
        
        if (state.user.subscription_status === 'trial') {
          return new Date(state.user.trial_end_date) > now
        }
        
        return false
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
