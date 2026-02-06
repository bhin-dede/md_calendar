'use client';

import React from 'react';
import Link from 'next/link';
import { DocumentSummary, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
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

interface DocumentCardProps {
  document: DocumentSummary;
  onExport: (doc: DocumentSummary) => void;
  onDelete: (doc: DocumentSummary) => void;
}

export const DocumentCard = React.memo(function DocumentCard({ document, onExport, onDelete }: DocumentCardProps) {
  return (
    <Link href={`/editor?id=${document.id}`} className="document-card">
      <div
        className="document-card-color"
        style={{ backgroundColor: getColorForDoc(document.id) }}
      />
      <div className="document-card-content">
        <div className="document-card-header">
          <div className="document-card-title">
            {document.title || 'Untitled'}
          </div>
          {document.status && document.status !== 'none' && (
            <span
              className="status-badge"
              style={{ backgroundColor: STATUS_COLORS[document.status] }}
            >
              {STATUS_LABELS[document.status]}
            </span>
          )}
        </div>
        <div className="document-card-meta">
          <span>Created: {formatDateTime(document.createdAt)}</span>
          <span>Modified: {formatDateTime(document.updatedAt)}</span>
        </div>
      </div>
      <div className="document-card-actions">
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
});
