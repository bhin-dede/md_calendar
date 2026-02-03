'use client';

import React from 'react';
import Link from 'next/link';
import { Document } from '@/lib/types';
import { formatDateTime } from '@/lib/db';

const COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-purple)',
  'var(--color-blue)',
  'var(--color-green)',
  'var(--color-orange)',
  'var(--color-accent)',
];

function getColorForDoc(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getContentPreview(content: string, maxLength = 150): string {
  const stripped = content
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return stripped.length > maxLength
    ? stripped.substring(0, maxLength) + '...'
    : stripped;
}

interface DocumentCardProps {
  document: Document;
  onExport: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export function DocumentCard({ document, onExport, onDelete }: DocumentCardProps) {
  return (
    <Link href={`/editor?id=${document.id}`} className="document-card">
      <div
        className="document-card-color"
        style={{ backgroundColor: getColorForDoc(document.id) }}
      />
      <div className="document-card-content">
        <div className="document-card-title">
          {document.title || 'Untitled'}
        </div>
        <div className="document-card-preview">
          {getContentPreview(document.content) || 'No content'}
        </div>
        <div className="document-card-meta">
          <span>Created: {formatDateTime(document.createdAt)}</span>
          <span>Modified: {formatDateTime(document.updatedAt)}</span>
        </div>
      </div>
      <div className="document-card-actions">
        <button
          className="btn btn-sm btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Edit
        </button>
        <button
          className="btn btn-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onExport(document);
          }}
        >
          Export
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(document);
          }}
        >
          Delete
        </button>
      </div>
    </Link>
  );
}
