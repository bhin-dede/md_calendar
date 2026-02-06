'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DocumentCard } from './DocumentCard';
import { ConfirmModal } from '@/components/Modal';
import { useToast } from '@/context/ToastContext';
import { DocumentSummary, DocumentStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import { getAllDocumentSummaries, searchDocumentSummaries, deleteDocument, createDocument, formatDate, getDocument } from '@/lib/db';

type ViewMode = 'grid' | 'table';
type SortField = 'title' | 'date' | 'status' | 'updatedAt' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 12;

export function DocumentList() {
  const router = useRouter();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DocumentSummary | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = searchQuery
        ? await searchDocumentSummaries(searchQuery)
        : await getAllDocumentSummaries();
      setDocuments(docs);
      setCurrentPage(1);
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

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
      if (dateFrom) {
        const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (doc.date < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo).setHours(23, 59, 59, 999);
        if (doc.date > toDate) return false;
      }
      return true;
    });
  }, [documents, statusFilter, dateFrom, dateTo]);

  const sortedDocuments = useMemo(() => {
    const sorted = [...filteredDocuments].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'date':
          aVal = a.date;
          bVal = b.date;
          break;
        case 'status':
          aVal = a.status || 'none';
          bVal = b.status || 'none';
          break;
        case 'createdAt':
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        case 'updatedAt':
        default:
          aVal = a.updatedAt;
          bVal = b.updatedAt;
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredDocuments, sortField, sortOrder]);

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedDocuments.slice(start, start + PAGE_SIZE);
  }, [sortedDocuments, currentPage]);

  const totalPages = Math.ceil(sortedDocuments.length / PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleExport = async (doc: DocumentSummary) => {
    try {
      const fullDoc = await getDocument(doc.id);
      if (!fullDoc) {
        showToast('Document not found', 'error');
        return;
      }
      const filename = (fullDoc.title || 'untitled').replace(/[^a-zA-Z0-9\uAC00-\uD7AF]/g, '_') + '.md';
      const blob = new Blob([fullDoc.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);

      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(url);
      showToast('Document exported', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export document', 'error');
    }
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

  const renderTableView = () => (
    <div className="table-container">
      <table className="doc-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('title')} className="sortable">
              Title {getSortIcon('title')}
            </th>
            <th onClick={() => handleSort('status')} className="sortable">
              Status {getSortIcon('status')}
            </th>
            <th onClick={() => handleSort('date')} className="sortable">
              Date {getSortIcon('date')}
            </th>
            <th onClick={() => handleSort('updatedAt')} className="sortable">
              Modified {getSortIcon('updatedAt')}
            </th>
            <th onClick={() => handleSort('createdAt')} className="sortable">
              Created {getSortIcon('createdAt')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedDocuments.map((doc) => (
            <tr key={doc.id} onClick={() => router.push(`/editor?id=${doc.id}`)} className="clickable-row">
              <td className="title-cell">{doc.title || 'Untitled'}</td>
              <td>
                {doc.status && doc.status !== 'none' && (
                  <span
                    className="status-badge"
                    style={{ backgroundColor: STATUS_COLORS[doc.status] }}
                  >
                    {STATUS_LABELS[doc.status]}
                  </span>
                )}
              </td>
              <td>{formatDate(doc.date)}</td>
              <td>{formatDate(doc.updatedAt)}</td>
              <td>{formatDate(doc.createdAt)}</td>
              <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-sm" onClick={() => handleExport(doc)}>Export</button>
                <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(doc)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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

    if (viewMode === 'table') {
      return renderTableView();
    }

    return (
      <div className="list-grid">
        {paginatedDocuments.map((doc) => (
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

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLInputElement;
    if (target.type !== 'date' && document.activeElement?.getAttribute('type') === 'date') {
      (document.activeElement as HTMLElement).blur();
    }
  };

  return (
    <div className="app-container view-list" onClick={handleContainerClick}>
      <div className="list-header">
        <div className="flex items-center gap-md">
          <h2 className="page-title">Documents</h2>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ▦
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              ☰
            </button>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="list-filters">
            <select
              className="input filter-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as DocumentStatus | 'all'); setCurrentPage(1); }}
            >
              <option value="all">모든 상태</option>
              {(Object.keys(STATUS_LABELS) as DocumentStatus[]).map(status => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
            <input
              type="date"
              className="input filter-date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); e.target.blur(); }}
              title="시작 날짜"
            />
            <input
              type="date"
              className="input filter-date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); e.target.blur(); }}
              title="종료 날짜"
            />
            {(statusFilter !== 'all' || dateFrom || dateTo) && (
              <button
                className="btn btn-sm"
                onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
              >
                초기화
              </button>
            )}
          </div>
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

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({sortedDocuments.length} documents)
          </span>
          <button
            className="btn btn-sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

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
