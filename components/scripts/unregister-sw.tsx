'use client';

import { useEffect } from 'react';

export function UnregisterServiceWorker() {
  useEffect(() => {
    // Unregister any existing service workers that might cause issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          // Only unregister if it's trying to cache chrome-extension requests
          registration.unregister().catch(() => {
            // Ignore errors
          });
        }
      });
    }
  }, []);

  return null;
}
