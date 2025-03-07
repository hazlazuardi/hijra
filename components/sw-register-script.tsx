'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker.register('/sw.js').then(
        function(registration) {
          console.log('Service Worker registration successful with scope: ', registration.scope);
        },
        function(err) {
          console.log('Service Worker registration failed: ', err);
        }
      );
    }
  }, []);

  return null;
} 