import { useState, useEffect } from 'react';
import { getOnlineStatus } from '@/services/offlineSync';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(getOnlineStatus());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
