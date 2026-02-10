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
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<DocumentStatus>('none');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<string | null>(documentId || null);
  const [isLoading, setIsLoading] = useState(!!documentId);

  const { scheduleAutoSave, cancelAutoSave } = useAutoSave({
    documentId: currentDocId,
    onSaveStart: () => {
      setSaveStatus('saving');
      setShowSaveToast(true);
    },
    onSaveSuccess: (newId: string) => {
      setSaveStatus('saved');
      setTimeout(() => setShowSaveToast(false), 1500);
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
          const sd = new Date(doc.startDate);
          const ed = new Date(doc.endDate);
          const localStartDate = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`;
          const localEndDate = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`;
          setStartDate(localStartDate);
          setEndDate(localEndDate);
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
          setStartDate(dateParam);
          setEndDate(dateParam);
        }
        setIsLoading(false);
      }
    };
    loadDocument();
  }, [documentId, router, searchParams, showToast]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (startDateRef.current && !startDateRef.current.contains(e.target as Node)) {
        startDateRef.current.blur();
      }
      if (endDateRef.current && !endDateRef.current.contains(e.target as Node)) {
        endDateRef.current.blur();
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

  const triggerAutoSave = useCallback((updates?: { title?: string; content?: string; startDate?: string; endDate?: string; status?: DocumentStatus }) => {
    if (currentDocId) {
      setSaveStatus('unsaved');
      scheduleAutoSave({
        title: updates?.title ?? title,
        content: updates?.content ?? content,
        startDate: new Date(updates?.startDate ?? startDate).getTime(),
        endDate: new Date(updates?.endDate ?? endDate).getTime(),
        status: updates?.status ?? status,
      });
    }
  }, [currentDocId, title, content, startDate, endDate, status, scheduleAutoSave]);

  const handleInput = useCallback(async () => {
    handleContentChange();
    const newContent = textareaRef.current?.value || '';

    if (!currentDocId && newContent.trim()) {
      try {
        const doc = await createDocument({
          title: title || 'Untitled',
          content: newContent,
          startDate: new Date(startDate).getTime(),
          endDate: new Date(endDate).getTime(),
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
  }, [currentDocId, title, startDate, endDate, status, router, showToast, handleContentChange, triggerAutoSave]);

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
    textarea.value = newText;
    setContent(newText);

    textarea.focus();
    const newPos = start + before.length + selected.length;
    textarea.setSelectionRange(newPos, newPos);

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
    textarea.value = newText;
    setContent(newText);

    textarea.focus();
    const newPos = start + prefix.length;
    textarea.setSelectionRange(newPos, newPos);

    if (currentDocId) {
      triggerAutoSave({ content: newText });
    }
  }, [currentDocId, triggerAutoSave]);

  const insertAtCursor = useCallback((insertText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;
    
    const newText = currentText.substring(0, start) + insertText + currentText.substring(start);
    textarea.value = newText;
    setContent(newText);

    textarea.focus();
    const newPos = start + insertText.length;
    textarea.setSelectionRange(newPos, newPos);

    if (currentDocId) {
      triggerAutoSave({ content: newText });
    }
  }, [currentDocId, triggerAutoSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === ' ') {
      const text = textarea.value;
      const pos = textarea.selectionStart;
      const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
      const lineText = text.substring(lineStart, pos);
      
      if (lineText === '[]') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + '- [ ] ' + text.substring(pos);
        textarea.value = newText;
        setContent(newText);
        const newPos = lineStart + 6;
        textarea.setSelectionRange(newPos, newPos);
        if (currentDocId) triggerAutoSave({ content: newText });
        return;
      }
      if (lineText === '#') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + '# ' + text.substring(pos);
        textarea.value = newText;
        setContent(newText);
        const newPos = lineStart + 2;
        textarea.setSelectionRange(newPos, newPos);
        if (currentDocId) triggerAutoSave({ content: newText });
        return;
      }
      if (lineText === '##') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + '## ' + text.substring(pos);
        textarea.value = newText;
        setContent(newText);
        const newPos = lineStart + 3;
        textarea.setSelectionRange(newPos, newPos);
        if (currentDocId) triggerAutoSave({ content: newText });
        return;
      }
      if (lineText === '###') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + '### ' + text.substring(pos);
        textarea.value = newText;
        setContent(newText);
        const newPos = lineStart + 4;
        textarea.setSelectionRange(newPos, newPos);
        if (currentDocId) triggerAutoSave({ content: newText });
        return;
      }
      if (lineText === '-' || lineText === '*' || lineText === '+') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + lineText + ' ' + text.substring(pos);
        textarea.value = newText;
        setContent(newText);
        const newPos = lineStart + 2;
        textarea.setSelectionRange(newPos, newPos);
        if (currentDocId) triggerAutoSave({ content: newText });
        return;
      }
      if (/^[1-9]\.$/.test(lineText) || lineText === 'a.' || lineText === 'i.') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + lineText + ' ' + text.substring(pos);
        textarea.value = newText;
        setContent(newText);
        const newPos = lineStart + lineText.length + 1;
        textarea.setSelectionRange(newPos, newPos);
        if (currentDocId) triggerAutoSave({ content: newText });
        return;
      }
      if (lineText === '>') {
        e.preventDefault();
        const newText = text.substring(0, lineStart) + '> ' + text.substring(pos);
        textarea.value = newText;
        setContent(newText);
        const newPos = lineStart + 2;
        textarea.setSelectionRange(newPos, newPos);
        if (currentDocId) triggerAutoSave({ content: newText });
        return;
      }
    }

    if (e.ctrlKey && e.shiftKey) {
      switch (e.key) {
        case 'S':
        case 's':
          e.preventDefault();
          applyFormat('~~', '~~');
          return;
        case '!':
        case '1':
          e.preventDefault();
          applyLinePrefix('# ');
          return;
        case '@':
        case '2':
          e.preventDefault();
          applyLinePrefix('## ');
          return;
        case '#':
        case '3':
          e.preventDefault();
          applyLinePrefix('### ');
          return;
        case '$':
        case '4':
          e.preventDefault();
          applyLinePrefix('- [ ] ');
          return;
        case '%':
        case '5':
          e.preventDefault();
          applyLinePrefix('- ');
          return;
        case '^':
        case '6':
          e.preventDefault();
          applyLinePrefix('1. ');
          return;
        case '&':
        case '7':
          e.preventDefault();
          applyLinePrefix('> ');
          return;
        case '*':
        case '8':
          e.preventDefault();
          applyFormat('```\n', '\n```');
          return;
        case '=':
        case '+':
          e.preventDefault();
          applyFormat('==', '==');
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
        case 'u':
          e.preventDefault();
          applyFormat('<u>', '</u>');
          break;
        case 'k':
          e.preventDefault();
          applyFormat('[', '](url)');
          break;
        case 'e':
        case '`':
          e.preventDefault();
          applyFormat('`', '`');
          break;
        case 'l':
          e.preventDefault();
          applyLinePrefix('- [ ] ');
          break;
      }
    }
  }, [applyFormat, applyLinePrefix, currentDocId, triggerAutoSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (currentDocId) {
      triggerAutoSave({ title: newTitle });
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    // If endDate is before startDate, update endDate to match startDate
    if (new Date(newStartDate) > new Date(endDate)) {
      setEndDate(newStartDate);
      if (currentDocId) {
        triggerAutoSave({ startDate: newStartDate, endDate: newStartDate });
      }
    } else if (currentDocId) {
      triggerAutoSave({ startDate: newStartDate });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    // Ensure endDate is not before startDate
    if (new Date(newEndDate) < new Date(startDate)) {
      return;
    }
    setEndDate(newEndDate);
    if (currentDocId) {
      triggerAutoSave({ endDate: newEndDate });
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
        <div className="document-meta-item date-range-picker">
          <input
            ref={startDateRef}
            type="date"
            className="date-picker"
            value={startDate}
            onChange={handleStartDateChange}
            title="시작일"
          />
          <span className="date-range-separator">~</span>
          <input
            ref={endDateRef}
            type="date"
            className="date-picker"
            value={endDate}
            onChange={handleEndDateChange}
            min={startDate}
            title="종료일"
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
        <MarkdownPreview content={content} title={title} date={startDate} onContentChange={handlePreviewContentChange} />
      </div>
      {showSaveToast && (
        <div className={`save-toast ${saveStatus}`}>
          {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
        </div>
      )}
    </div>
  );
}
