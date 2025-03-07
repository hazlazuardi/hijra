'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    // Set initial status
    setIsOffline(!navigator.onLine);
    
    // Add event listeners
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  if (!isOffline) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white z-50 px-4 py-2 text-center flex items-center justify-center gap-2">
      <WifiOff size={16} />
      <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
    </div>
  );
} 