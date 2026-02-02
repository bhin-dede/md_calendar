'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/editor') {
      return pathname === '/editor' || pathname.startsWith('/editor/');
    }
    return pathname === path;
  };

  return (
    <header className="nav-header">
      <div className="nav-brand">
        <h1 className="brand-title">MD Calendar</h1>
      </div>
      <nav className="nav-menu">
        <Link
          href="/editor"
          className={`nav-link ${isActive('/editor') ? 'active' : ''}`}
        >
          <span className="nav-icon">&#9998;</span>
          Editor
        </Link>
        <Link
          href="/list"
          className={`nav-link ${isActive('/list') ? 'active' : ''}`}
        >
          <span className="nav-icon">&#9776;</span>
          Documents
        </Link>
        <Link
          href="/calendar"
          className={`nav-link ${isActive('/calendar') ? 'active' : ''}`}
        >
          <span className="nav-icon">&#128197;</span>
          Calendar
        </Link>
      </nav>
      <div className="nav-actions">
        <Link href="/editor" className="btn btn-primary">+ New</Link>
      </div>
    </header>
  );
}
