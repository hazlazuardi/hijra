"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { initializeDB } from '@/lib/sync-service'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkUser, subscribeToAuthChanges } = useAuthStore()
  
  useEffect(() => {
    // Initialize IndexedDB
    const initApp = async () => {
      // Initialize IndexedDB first
      await initializeDB();
      
      // Then check user status
      await checkUser();
    };
    
    initApp();
    
    // Subscribe to auth changes
    const unsubscribe = subscribeToAuthChanges();
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    }
  }, [checkUser, subscribeToAuthChanges]);
  
  return <>{children}</>;
} 