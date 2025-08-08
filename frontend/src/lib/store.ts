import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  subscription_status: 'trial' | 'free_trial' | 'active' | 'expired';
  trial_ends_at?: string;
  subscription_ends_at?: string;
  trial_days_remaining?: number;
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
  phone_number?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              username: email,
              password: password,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
          }

          const data = await response.json();
          
          // Get user info
          const userResponse = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          });

          if (!userResponse.ok) {
            throw new Error('Failed to get user info');
          }

          const userData = await userResponse.json();
          
          // Transform API response to match frontend User interface
          const transformedUser = {
            id: userData.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            subscription_status: userData.subscription_status,
            trial_ends_at: userData.trial_end_date,
            subscription_ends_at: userData.subscription_end_date,
            trial_days_remaining: userData.trial_days_remaining,
            notification_email: userData.email_notifications,
            notification_push: userData.push_notifications,
            notification_sms: userData.sms_notifications,
            phone_number: userData.phone_number
          };

          set({
            token: data.access_token,
            user: transformedUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store token in localStorage for API calls
          localStorage.setItem('token', data.access_token);
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      signup: async (email: string, password: string, firstName?: string, lastName?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              first_name: firstName,
              last_name: lastName,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Signup failed');
          }

          const data = await response.json();

          // Automatically log in after signup
          await get().login(email, password);
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Signup failed',
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = get().token || localStorage.getItem('token');
        
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }

        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Invalid token');
          }

          const userData = await response.json();
          
          // Transform API response to match frontend User interface
          const transformedUser = {
            id: userData.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            subscription_status: userData.subscription_status,
            trial_ends_at: userData.trial_end_date,
            subscription_ends_at: userData.subscription_end_date,
            trial_days_remaining: userData.trial_days_remaining,
            notification_email: userData.email_notifications,
            notification_push: userData.push_notifications,
            notification_sms: userData.sms_notifications,
            phone_number: userData.phone_number
          };

          set({
            user: transformedUser,
            token: token,
            isAuthenticated: true,
            error: null,
          });

          return true;
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          localStorage.removeItem('token');
          return false;
        }
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
