'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DocumentCard } from './DocumentCard';
import { ConfirmModal } from '@/components/Modal';
import { useToast } from '@/context/ToastContext';
import { Document } from '@/lib/types';
import { getAllDocuments, searchDocuments, deleteDocument, createDocument } from '@/lib/db';

export function DocumentList() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = searchQuery
        ? await searchDocuments(searchQuery)
        : await getAllDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      showToast('Failed to load documents', 'error');
    }
    setIsLoading(false);
  }, [searchQuery, showToast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadDocuments]);

  const handleExport = (doc: Document) => {
    const filename = (doc.title || 'untitled').replace(/[^a-zA-Z0-9\uAC00-\uD7AF]/g, '_') + '.md';
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Document exported', 'success');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteDocument(deleteTarget.id);
      showToast('Document deleted', 'success');
      loadDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete document', 'error');
    }
    setDeleteTarget(null);
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let imported = 0;

    for (const file of files) {
      try {
        const content = await readFile(file);
        const filename = file.name.replace(/\.(md|markdown|txt)$/i, '');

        await createDocument({
          title: filename,
          content,
          date: Date.now(),
        });

        imported++;
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
      }
    }

    e.target.value = '';

    if (imported > 0) {
      showToast(`Imported ${imported} document${imported > 1 ? 's' : ''}`, 'success');
      loadDocuments();
    } else {
      showToast('Failed to import documents', 'error');
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="loading">Loading...</div>;
    }

    if (documents.length === 0) {
      if (searchQuery) {
        return (
          <div className="empty-state">
            <div className="empty-state-icon">&#128269;</div>
            <h3 className="empty-state-title">No results found</h3>
            <p className="empty-state-text">No documents match &quot;{searchQuery}&quot;.</p>
          </div>
        );
      }

      return (
        <div className="empty-state">
          <div className="empty-state-icon">&#128221;</div>
          <h3 className="empty-state-title">No documents yet</h3>
          <p className="empty-state-text">Create your first markdown document to get started.</p>
          <Link href="/editor" className="btn btn-primary btn-lg">
            Create Document
          </Link>
        </div>
      );
    }

    return (
      <div className="list-grid">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onExport={handleExport}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="app-container view-list">
      <div className="list-header">
        <div className="flex items-center gap-md">
          <h2 className="page-title">Documents</h2>
        </div>
        <div className="flex items-center gap-md">
          <div className="search-box list-search">
            <span className="search-box-icon">&#128269;</span>
            <input
              type="text"
              className="input"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="file-input-wrapper">
            <button className="btn">Import MD</button>
            <input
              type="file"
              accept=".md,.markdown,.txt"
              multiple
              onChange={handleBulkImport}
            />
          </div>
          <Link href="/editor" className="btn btn-primary">
            + New Document
          </Link>
        </div>
      </div>

      <div className="list-content">{renderContent()}</div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.title || 'Untitled'}"? This action cannot be undone.`}
      />
    </div>
  );
}
