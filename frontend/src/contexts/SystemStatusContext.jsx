import React, { createContext, useContext } from 'react';

const SystemStatusContext = createContext({ status: 'loading', error: null });

export function SystemStatusProvider({ status, error, children }) {
  return (
    <SystemStatusContext.Provider value={{ status, error }}>
      {children}
    </SystemStatusContext.Provider>
  );
}

export function useSystemStatus() {
  return useContext(SystemStatusContext);
}
