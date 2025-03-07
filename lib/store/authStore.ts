import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { v4 as uuidv4 } from 'uuid';

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
  checkUser: () => Promise<User | null>
  signOut: () => Promise<void>
  subscribeToAuthChanges: () => (() => void)
  setOfflineData: (key: string, data: any) => void
  setOnlineStatus: (isOnline: boolean) => void
}

const STORAGE_AUTH_KEY = 'hijra-auth-state';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  lastSyncTime: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  offlineData: {},
  
  checkUser: async () => {
    const supabase = await createClient();
    set({ isLoading: true });
    
    // First check local storage for cached auth state
    try {
      const cachedAuth = typeof localStorage !== 'undefined' 
        ? localStorage.getItem(STORAGE_AUTH_KEY) 
        : null;
        
      if (cachedAuth) {
        const { user, timestamp } = JSON.parse(cachedAuth);
        const timeSinceCache = Date.now() - timestamp;
        
        // Use cached auth if it's less than 1 hour old
        if (user && timeSinceCache < 60 * 60 * 1000) {
          set({ 
            user: user as User, 
            isLoggedIn: true, 
            isLoading: false 
          });
          return user;
        }
      }
    } catch (e) {
      console.error('Error reading cached auth:', e);
      // Continue to check with Supabase if cache read fails
    }
    
    // If no valid cache, check with Supabase
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user as User | null;
      
      set({ 
        user: user, 
        isLoggedIn: !!user, 
        isLoading: false 
      });
      
      // Cache the auth state
      if (user && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify({
            user,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error caching auth state:', e);
          // Non-critical error, can continue
        }
      }
      
      return user;
    } catch (error) {
      console.error('Error checking user:', error);
      set({ isLoading: false });
      return null;
    }
  },
  
  signOut: async () => {
    const supabase = await createClient();
    
    // Optimistically update the state for immediate UI update
    set({ user: null, isLoggedIn: false });
    
    // Clear cached auth
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_AUTH_KEY);
      } catch (e) {
        console.error('Error clearing cached auth:', e);
        // Non-critical error, can continue
      }
    }
    
    try {
      // Then perform the actual sign out
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if sign out fails, we've already updated the UI state
    } finally {
      set({ isLoading: false });
    }
  },
  
  subscribeToAuthChanges: () => {
    const supabase = createClient();
    
    // Handle online status
    const handleOnline = () => get().setOnlineStatus(true);
    const handleOffline = () => get().setOnlineStatus(false);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        const user = session?.user as User | null;
        
        // Update state
        set({ 
          user: user,
          isLoggedIn: !!user, 
          isLoading: false,
          lastSyncTime: new Date().getTime()
        });
        
        // Update cached auth
        if (typeof localStorage !== 'undefined') {
          try {
            if (user) {
              localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify({
                user,
                timestamp: Date.now()
              }));
            } else {
              localStorage.removeItem(STORAGE_AUTH_KEY);
            }
          } catch (e) {
            console.error('Error updating cached auth:', e);
            // Non-critical error, can continue
          }
        }
      }
    );
    
    // Return cleanup function
    return () => {
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  },
  
  setOfflineData: (key, data) => {
    set(state => ({
      offlineData: { ...state.offlineData, [key]: data },
      lastSyncTime: new Date().getTime()
    }));
  },
  
  setOnlineStatus: (isOnline) => {
    set({ isOnline });
  }
})) 