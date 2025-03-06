import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email?: string
  user_metadata?: any
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isLoggedIn: boolean
  lastSyncTime: number | null
  isOnline: boolean
  offlineData: Record<string, any>
  checkUser: () => Promise<void>
  signOut: () => Promise<void>
  subscribeToAuthChanges: () => (() => void)
  setOfflineData: (key: string, data: any) => void
  setOnlineStatus: (isOnline: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isLoggedIn: false,
      lastSyncTime: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      offlineData: {},
      
      checkUser: async () => {
        const supabase = createClient()
        set({ isLoading: true })
        try {
          const { data } = await supabase.auth.getUser()
          set({ 
            user: data.user as User | null, 
            isLoggedIn: !!data.user,
            isLoading: false 
          })
        } catch (error) {
          console.error('Error checking user:', error)
          set({ isLoading: false })
        }
      },
      
      signOut: async () => {
        const supabase = createClient()
        
        // Optimistically update the state for immediate UI update
        set({ user: null, isLoggedIn: false })
        
        try {
          // Then perform the actual sign out
          await supabase.auth.signOut()
        } catch (error) {
          console.error('Error signing out:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      subscribeToAuthChanges: () => {
        const supabase = createClient()
        
        // Add window online/offline event listeners
        const handleOnline = () => get().setOnlineStatus(true)
        const handleOffline = () => get().setOnlineStatus(false)
        
        if (typeof window !== 'undefined') {
          window.addEventListener('online', handleOnline)
          window.addEventListener('offline', handleOffline)
        }
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            set({ 
              user: session?.user as User | null,
              isLoggedIn: !!session?.user,
              isLoading: false,
              lastSyncTime: new Date().getTime()
            })
          }
        )
        
        // Return unsubscribe function
        return () => {
          subscription.unsubscribe()
          if (typeof window !== 'undefined') {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
          }
        }
      },
      
      setOfflineData: (key, data) => {
        set(state => ({
          offlineData: {
            ...state.offlineData,
            [key]: data
          },
          lastSyncTime: new Date().getTime()
        }))
      },
      
      setOnlineStatus: (isOnline) => {
        set({ isOnline })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn,
        offlineData: state.offlineData,
        lastSyncTime: state.lastSyncTime
      }),
    }
  )
) 