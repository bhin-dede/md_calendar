'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MemoModeContextType {
  isMemoMode: boolean;
  setMemoMode: (value: boolean) => void;
  toggleMemoMode: () => void;
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
}

const MemoModeContext = createContext<MemoModeContextType | undefined>(undefined);

export function MemoModeProvider({ children }: { children: ReactNode }) {
  const [isMemoMode, setIsMemoMode] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const setMemoMode = (value: boolean) => setIsMemoMode(value);
  const toggleMemoMode = () => setIsMemoMode(prev => !prev);

  return (
    <MemoModeContext.Provider value={{
      isMemoMode,
      setMemoMode,
      toggleMemoMode,
      selectedDocId,
      setSelectedDocId,
    }}>
      {children}
    </MemoModeContext.Provider>
  );
}

export function useMemoMode() {
  const context = useContext(MemoModeContext);
  if (!context) {
    throw new Error('useMemoMode must be used within a MemoModeProvider');
  }
  return context;
}
