'use client';

import { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { TitleBar } from '@/components/TitleBar';
import { MemoView } from '@/components/MemoView';
import { ToastProvider } from '@/context/ToastContext';
import { MemoModeProvider, useMemoMode } from '@/context/MemoModeContext';

function LayoutContent({ children }: { children: ReactNode }) {
  const { isMemoMode } = useMemoMode();

  if (isMemoMode) {
    return (
      <div className="memo-mode-wrapper">
        <TitleBar />
        <MemoView />
      </div>
    );
  }

  return (
    <>
      <TitleBar />
      <Header />
      {children}
    </>
  );
}

export function LayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <MemoModeProvider>
        <LayoutContent>{children}</LayoutContent>
      </MemoModeProvider>
    </ToastProvider>
  );
}
