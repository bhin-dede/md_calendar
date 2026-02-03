'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownPreview } from './MarkdownPreview';
import { useToast } from '@/context/ToastContext';
import { useAutoSave } from '@/hooks/useAutoSave';
import { createDocument, getDocument } from '@/lib/db';
import { Document } from '@/lib/types';

type SaveStatus = 'saved' | 'saving' | 'unsaved';

interface EditorProps {
  documentId?: string;
}

export function Editor({ documentId }: EditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [currentDocId, setCurrentDocId] = useState<string | null>(documentId || null);
  const [isLoading, setIsLoading] = useState(!!documentId);

  const { scheduleAutoSave, cancelAutoSave } = useAutoSave({
    documentId: currentDocId,
    onSaveStart: () => setSaveStatus('saving'),
    onSaveSuccess: () => setSaveStatus('saved'),
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
          setDate(new Date(doc.date).toISOString().split('T')[0]);
          setCurrentDocId(doc.id);
        } else {
          showToast('Document not found', 'error');
          router.push('/editor');
        }
        setIsLoading(false);
      } else {
        const dateParam = searchParams.get('date');
        if (dateParam) {
          setDate(new Date(parseInt(dateParam)).toISOString().split('T')[0]);
        }
        setIsLoading(false);
      }
    };
    loadDocument();
  }, [documentId, router, searchParams, showToast]);

  const handleContentChange = useCallback(() => {
    if (!textareaRef.current) return;
    const newContent = textareaRef.current.value;
    setContent(newContent);
  }, []);

  const triggerAutoSave = useCallback(() => {
    if (currentDocId) {
      setSaveStatus('unsaved');
      scheduleAutoSave({
        title,
        content,
        date: new Date(date).getTime(),
      });
    }
  }, [currentDocId, title, content, date, scheduleAutoSave]);

  const handleInput = useCallback(async () => {
    handleContentChange();
    const newContent = textareaRef.current?.value || '';

    if (!currentDocId && newContent.trim()) {
      try {
        const doc = await createDocument({
          title: title || 'Untitled',
          content: newContent,
          date: new Date(date).getTime(),
        });
        setCurrentDocId(doc.id);
        setDocument(doc);
        router.replace(`/editor?id=${doc.id}`);
        showToast('Document created', 'success');
      } catch (error) {
        console.error('Failed to create document:', error);
      }
    } else if (currentDocId) {
      triggerAutoSave();
    }
  }, [currentDocId, title, date, router, showToast, handleContentChange, triggerAutoSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (currentDocId) {
      triggerAutoSave();
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    if (currentDocId) {
      triggerAutoSave();
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
        <input
          type="text"
          className="title-input"
          placeholder="Document Title"
          value={title}
          onChange={handleTitleChange}
        />
        <div className="document-meta-item">
          <input
            type="date"
            className="date-picker"
            value={date}
            onChange={handleDateChange}
          />
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
          />
        </div>
        <MarkdownPreview content={content} />
      </div>
    </div>
  );
}
