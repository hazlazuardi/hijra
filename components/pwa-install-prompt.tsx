'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is already installed (in standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);
    
    // Capture the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if user has already dismissed or installed
    const promptDismissed = localStorage.getItem('pwaPromptDismissed');
    if (promptDismissed && new Date().getTime() - parseInt(promptDismissed) < 7 * 24 * 60 * 60 * 1000) {
      // Don't show if dismissed in the last 7 days
      setShowPrompt(false);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Don't show if already installed or no prompt is available
  if (isStandalone || !showPrompt) {
    return null;
  }
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
        localStorage.setItem('pwaPromptDismissed', new Date().getTime().toString());
      }
      
      setShowPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation', error);
    }
  };
  
  const dismissPrompt = () => {
    localStorage.setItem('pwaPromptDismissed', new Date().getTime().toString());
    setShowPrompt(false);
  };
  
  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50 border border-primary/20">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Install Hijra App</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Install this app on your device for offline access and a better experience.
          </p>
          <div className="flex gap-3">
            <Button size="sm" onClick={handleInstall} className="bg-primary hover:bg-primary/90">
              Install
            </Button>
            <Button size="sm" variant="outline" onClick={dismissPrompt}>
              Not now
            </Button>
          </div>
        </div>
        <button 
          onClick={dismissPrompt}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
} 