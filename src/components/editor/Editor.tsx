'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownPreview } from './MarkdownPreview';
import { useToast } from '@/context/ToastContext';
import { useAutoSave } from '@/hooks/useAutoSave';
import { createDocument, getDocument } from '@/lib/db';
import { Document, DocumentStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';

type SaveStatus = 'saved' | 'saving' | 'unsaved';
const STATUS_OPTIONS: DocumentStatus[] = ['none', 'ready', 'in_progress', 'paused', 'completed'];

interface EditorProps {
  documentId?: string;
}

export function Editor({ documentId }: EditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<DocumentStatus>('none');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [currentDocId, setCurrentDocId] = useState<string | null>(documentId || null);
  const [isLoading, setIsLoading] = useState(!!documentId);

  const { scheduleAutoSave, cancelAutoSave } = useAutoSave({
    documentId: currentDocId,
    onSaveStart: () => setSaveStatus('saving'),
    onSaveSuccess: (newId: string) => {
      setSaveStatus('saved');
      if (newId !== currentDocId) {
        setCurrentDocId(newId);
        router.replace(`/editor?id=${newId}`);
      }
    },
    onSaveError: (error) => {
      console.error('Auto-save failed:', error);
      showToast('Auto-save failed', 'error');
      setSaveStatus('unsaved');
    },
  });

  useEffect(() => {
    const loadDocument = async () => {
      if (documentId) {
        const doc = await getDocument(documentId);
        if (doc) {
          setDocument(doc);
          setTitle(doc.title);
          setContent(doc.content);
          const d = new Date(doc.date);
          const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          setDate(localDate);
          setStatus(doc.status || 'none');
          setCurrentDocId(doc.id);
        } else {
          showToast('Document not found', 'error');
          router.push('/editor');
        }
        setIsLoading(false);
      } else {
        const dateParam = searchParams.get('date');
        if (dateParam) {
          setDate(dateParam);
        }
        setIsLoading(false);
      }
    };
    loadDocument();
  }, [documentId, router, searchParams, showToast]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        datePickerRef.current.blur();
      }
    };
    window.document.addEventListener('mousedown', handleClickOutside);
    return () => window.document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContentChange = useCallback(() => {
    if (!textareaRef.current) return;
    const newContent = textareaRef.current.value;
    setContent(newContent);
  }, []);

  const triggerAutoSave = useCallback((updates?: { title?: string; content?: string; date?: string; status?: DocumentStatus }) => {
    if (currentDocId) {
      setSaveStatus('unsaved');
      scheduleAutoSave({
        title: updates?.title ?? title,
        content: updates?.content ?? content,
        date: new Date(updates?.date ?? date).getTime(),
        status: updates?.status ?? status,
      });
    }
  }, [currentDocId, title, content, date, status, scheduleAutoSave]);

  const handleInput = useCallback(async () => {
    handleContentChange();
    const newContent = textareaRef.current?.value || '';

    if (!currentDocId && newContent.trim()) {
      try {
        const doc = await createDocument({
          title: title || 'Untitled',
          content: newContent,
          date: new Date(date).getTime(),
          status,
        });
        setCurrentDocId(doc.id);
        setDocument(doc);
        router.replace(`/editor?id=${doc.id}`);
        showToast('Document created', 'success');
      } catch (error) {
        console.error('Failed to create document:', error);
      }
    } else if (currentDocId) {
      triggerAutoSave({ content: newContent });
    }
  }, [currentDocId, title, date, router, showToast, handleContentChange, triggerAutoSave]);

  const handlePreviewContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    if (textareaRef.current) {
      textareaRef.current.value = newContent;
    }
    if (currentDocId) {
      triggerAutoSave({ content: newContent });
    }
  }, [currentDocId, triggerAutoSave]);

  const applyFormat = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selected.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);

    if (currentDocId) {
      triggerAutoSave({ content: newText });
    }
  }, [currentDocId, triggerAutoSave]);

  const applyLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    
    const newText = text.substring(0, lineStart) + prefix + text.substring(lineStart);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);

    if (currentDocId) {
      triggerAutoSave({ content: newText });
    }
  }, [currentDocId, triggerAutoSave]);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;
    
    const newText = currentText.substring(0, start) + text + currentText.substring(start);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + text.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);

    if (currentDocId) {
      triggerAutoSave({ content: newText });
    }
  }, [currentDocId, triggerAutoSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          applyFormat('~~', '~~');
          return;
        case 'k':
          e.preventDefault();
          applyFormat('```\n', '\n```');
          return;
        case 'u':
          e.preventDefault();
          applyLinePrefix('- ');
          return;
        case 'o':
          e.preventDefault();
          applyLinePrefix('1. ');
          return;
        case 'q':
          e.preventDefault();
          applyLinePrefix('> ');
          return;
        case 'h':
          e.preventDefault();
          insertAtCursor('\n---\n');
          return;
        case 't':
          e.preventDefault();
          applyLinePrefix('- [ ] ');
          return;
      }
    }
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          applyFormat('**', '**');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('_', '_');
          break;
        case 'k':
          e.preventDefault();
          applyFormat('[', '](url)');
          break;
        case '`':
          e.preventDefault();
          applyFormat('`', '`');
          break;
        case '1':
          e.preventDefault();
          applyLinePrefix('# ');
          break;
        case '2':
          e.preventDefault();
          applyLinePrefix('## ');
          break;
        case '3':
          e.preventDefault();
          applyLinePrefix('### ');
          break;
      }
    }
  }, [applyFormat, applyLinePrefix, insertAtCursor]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentDocId) {
      triggerAutoSave({ title: newTitle });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    if (currentDocId) {
      triggerAutoSave({ date: newDate });
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as DocumentStatus;
    setStatus(newStatus);
    if (currentDocId) {
      triggerAutoSave({ status: newStatus });
    }
  };

  const handleExport = () => {
    if (!content.trim()) {
      showToast('Nothing to export', 'error');
      return;
    }

    const filename = (title || 'untitled').replace(/[^a-zA-Z0-9\uAC00-\uD7AF]/g, '_') + '.md';
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Document exported', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const importedContent = event.target?.result as string;
      if (textareaRef.current) {
        textareaRef.current.value = importedContent;
        setContent(importedContent);
      }

      const filename = file.name.replace(/\.(md|markdown|txt)$/i, '');
      setTitle(filename);

      handleInput();
      showToast('Document imported', 'success');
    };
    reader.readAsText(file);

    e.target.value = '';
  };

  useEffect(() => {
    return () => {
      cancelAutoSave();
    };
  }, [cancelAutoSave]);

  if (isLoading) {
    return (
      <div className="app-container view-editor">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-container view-editor">
      <div className="document-meta">
        <button className="back-btn" onClick={() => router.back()} title="Go back">
          ←
        </button>
        <input
          type="text"
          className="title-input"
          placeholder="Document Title"
          value={title}
          onChange={handleTitleChange}
        />
        <div className="document-meta-item">
          <input
            ref={datePickerRef}
            type="date"
            className="date-picker"
            value={date}
            onChange={handleDateChange}
          />
        </div>
        <div className="document-meta-item">
          <select
            className="status-select"
            value={status}
            onChange={handleStatusChange}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className={`save-indicator ${saveStatus}`}>
          <span>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
          </span>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            Export MD
          </button>
          <div className="file-input-wrapper">
            <button className="btn btn-sm">Import MD</button>
            <input
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleImport}
            />
          </div>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-pane">
          <div className="editor-pane-header">
            <span>Markdown</span>
          </div>
          <EditorToolbar textareaRef={textareaRef} onContentChange={handleInput} />
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            placeholder="Start writing your markdown here..."
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
          />
        </div>
        <MarkdownPreview content={content} onContentChange={handlePreviewContentChange} />
      </div>
    </div>
  );
}
