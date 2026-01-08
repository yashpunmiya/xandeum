'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

type NetworkType = 'devnet' | 'mainnet';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  toggleNetwork: () => void;
  isMainnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const NETWORK_STORAGE_KEY = 'xandscan_network';

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<NetworkType>('devnet');
  const [mounted, setMounted] = useState(false);

  // Load network preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(NETWORK_STORAGE_KEY);
      if (stored === 'mainnet' || stored === 'devnet') {
        setNetworkState(stored);
      }
    } catch (err) {
      // Silently handle localStorage errors
      console.error('Failed to load network preference:', err);
    }
  }, []);

  // Save network preference to localStorage
  const setNetwork = useCallback((newNetwork: NetworkType) => {
    setNetworkState(newNetwork);
    try {
      localStorage.setItem(NETWORK_STORAGE_KEY, newNetwork);
    } catch (err) {
      // Silently handle localStorage errors
      console.error('Failed to save network preference:', err);
    }
  }, []);

  const toggleNetwork = useCallback(() => {
    const newNetwork = network === 'mainnet' ? 'devnet' : 'mainnet';
    setNetwork(newNetwork);
  }, [network, setNetwork]);

  // Memoize isMainnet to prevent unnecessary re-renders
  const isMainnet = useMemo(() => network === 'mainnet', [network]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    network,
    setNetwork,
    toggleNetwork,
    isMainnet
  }), [network, setNetwork, toggleNetwork, isMainnet]);

  // Always provide context, but render a loading state if not mounted
  return (
    <NetworkContext.Provider value={contextValue}>
      {mounted ? children : <div className="min-h-screen bg-[#050505]" />}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
