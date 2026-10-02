import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type EffectiveNetworkStatus = 'online' | 'offline_simulated' | 'offline_actual';

interface NetworkContextType {
  isBrowserOnline: boolean;
  isKillSwitchActive: boolean;
  effectiveStatus: EffectiveNetworkStatus;
  isOnline: boolean; // True only if browser is online AND kill switch is off
  toggleKillSwitch: () => void;
  setKillSwitch: (active: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isKillSwitchActive, setIsKillSwitchActive] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleKillSwitch = () => {
    setIsKillSwitchActive((prev) => !prev);
  };

  const setKillSwitch = (active: boolean) => {
    setIsKillSwitchActive(active);
  };

  const effectiveStatus: EffectiveNetworkStatus = useMemo(() => {
    if (isKillSwitchActive) return 'offline_simulated';
    if (!isBrowserOnline) return 'offline_actual';
    return 'online';
  }, [isBrowserOnline, isKillSwitchActive]);

  const isOnline = effectiveStatus === 'online';

  const value = useMemo(
    () => ({
      isBrowserOnline,
      isKillSwitchActive,
      effectiveStatus,
      isOnline,
      toggleKillSwitch,
      setKillSwitch,
    }),
    [isBrowserOnline, isKillSwitchActive, effectiveStatus, isOnline]
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
