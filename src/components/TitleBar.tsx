'use client';

import React, { useState, useEffect, useCallback } from 'react';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [appWindow, setAppWindow] = useState<any>(null);

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

  return (
    <div className="titlebar" onMouseDown={handleDrag} onDoubleClick={handleDoubleClick}>
      <div className="titlebar-title">
        MD Calendar
      </div>
      <div className="titlebar-controls">
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
