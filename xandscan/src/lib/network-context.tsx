'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type Network = 'mainnet' | 'devnet';

interface NetworkContextType {
  network: Network;
  setNetwork: (network: Network) => void;
  toggleNetwork: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<Network>('devnet');

  const setNetwork = useCallback((newNetwork: Network) => {
    setNetworkState(newNetwork);
  }, []);

  const toggleNetwork = useCallback(() => {
    setNetworkState(prev => prev === 'mainnet' ? 'devnet' : 'mainnet');
  }, []);

  return (
    <NetworkContext.Provider value={{ network, setNetwork, toggleNetwork }}>
      {children}
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
