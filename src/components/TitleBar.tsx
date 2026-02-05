'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMemoMode } from '@/context/MemoModeContext';

const MEMO_MODE_WIDTH = 400;

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [appWindow, setAppWindow] = useState<any>(null);
  const { isMemoMode, toggleMemoMode } = useMemoMode();
  const previousSize = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const initWindow = async () => {
      if (typeof window !== 'undefined') {
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          setAppWindow(win);
          const maximized = await win.isMaximized();
          setIsMaximized(maximized);
        } catch (e) {
          console.log('Not in Tauri environment');
        }
      }
    };
    initWindow();
  }, []);

  const handleDrag = useCallback(async (e: React.MouseEvent) => {
    if (e.buttons === 1 && e.detail === 1 && appWindow) {
      await appWindow.startDragging();
    }
  }, [appWindow]);

  const handleDoubleClick = useCallback(async () => {
    if (appWindow) {
      await appWindow.toggleMaximize();
      setIsMaximized(!isMaximized);
    }
  }, [appWindow, isMaximized]);

  const handleMinimize = async () => {
    if (appWindow) await appWindow.minimize();
  };

  const handleMaximize = async () => {
    if (appWindow) {
      await appWindow.toggleMaximize();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = async () => {
    if (appWindow) await appWindow.close();
  };

  const handleTogglePin = async () => {
    if (appWindow) {
      const newValue = !isAlwaysOnTop;
      await appWindow.setAlwaysOnTop(newValue);
      setIsAlwaysOnTop(newValue);
    }
  };

  const handleToggleMemoMode = async () => {
    if (appWindow) {
      try {
        const { PhysicalSize, PhysicalPosition } = await import('@tauri-apps/api/dpi');
        const currentSize = await appWindow.innerSize();
        const currentPos = await appWindow.innerPosition();
        
        if (!isMemoMode) {
          const topRightX = currentPos.x + currentSize.width;
          previousSize.current = { width: currentSize.width, height: currentSize.height };
          
          const newX = topRightX - MEMO_MODE_WIDTH;
          await appWindow.setPosition(new PhysicalPosition(newX, currentPos.y));
          await appWindow.setSize(new PhysicalSize(MEMO_MODE_WIDTH, currentSize.height));
        } else if (previousSize.current) {
          const topRightX = currentPos.x + currentSize.width;
          
          const newX = topRightX - previousSize.current.width;
          await appWindow.setPosition(new PhysicalPosition(newX, currentPos.y));
          await appWindow.setSize(new PhysicalSize(previousSize.current.width, currentSize.height));
        }
      } catch (e) {
        console.log('Resize failed:', e);
      }
    }
    toggleMemoMode();
  };

  return (
    <div className={`titlebar ${isMemoMode ? 'memo-mode' : ''}`} onMouseDown={handleDrag} onDoubleClick={handleDoubleClick}>
      <div className="titlebar-title">
        {isMemoMode ? '메모' : 'MD Calendar'}
      </div>
      <div className="titlebar-controls">
        <button className={`titlebar-btn memo ${isMemoMode ? 'active' : ''}`} onClick={handleToggleMemoMode} onMouseDown={(e) => e.stopPropagation()} title={isMemoMode ? '일반 모드' : '메모 모드'}>
          📋
        </button>
        <button className={`titlebar-btn pin ${isAlwaysOnTop ? 'active' : ''}`} onClick={handleTogglePin} onMouseDown={(e) => e.stopPropagation()} title={isAlwaysOnTop ? '고정 해제' : '항상 위에'}>
          📌
        </button>
        <button className="titlebar-btn minimize" onClick={handleMinimize} onMouseDown={(e) => e.stopPropagation()} title="Minimize">
          ─
        </button>
        <button className="titlebar-btn maximize" onClick={handleMaximize} onMouseDown={(e) => e.stopPropagation()} title={isMaximized ? 'Restore' : 'Maximize'}>
          {isMaximized ? '◱' : '□'}
        </button>
        <button className="titlebar-btn close" onClick={handleClose} onMouseDown={(e) => e.stopPropagation()} title="Close">
          ✕
        </button>
      </div>
    </div>
  );
}
