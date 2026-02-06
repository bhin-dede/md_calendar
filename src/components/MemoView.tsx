'use client';

import { useState, useEffect, useRef } from 'react';
import { useMemoMode } from '@/context/MemoModeContext';
import { getAllDocuments, getDocument, updateDocument, createDocument } from '@/lib/db';
import { Document, DocumentStatus } from '@/lib/types';

const STATUS_ICONS: Record<DocumentStatus, string> = {
  none: '−',
  ready: '□',
  in_progress: '→',
  paused: '⏸',
  completed: '✓',
};

const STATUS_CYCLE: DocumentStatus[] = ['ready', 'in_progress', 'paused', 'completed'];

interface ChecklistItem {
  text: string;
  checked: boolean;
  line: number;
}

export function MemoView() {
  const { selectedDocId, setSelectedDocId } = useMemoMode();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingItemLine, setEditingItemLine] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const itemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      const docs = await getAllDocuments();
      setDocuments(docs);
    };
    loadDocuments();
  }, []);

  useEffect(() => {
    const loadSelectedDoc = async () => {
      if (selectedDocId) {
        const doc = await getDocument(selectedDocId);
        if (doc) {
          setSelectedDoc(doc);
          setContent(doc.content);
        }
      } else {
        setSelectedDoc(null);
        setContent('');
      }
    };
    loadSelectedDoc();
  }, [selectedDocId]);

  const extractChecklists = (text: string): ChecklistItem[] => {
    const lines = text.split('\n');
    const items: ChecklistItem[] = [];

    lines.forEach((line, index) => {
      const uncheckedMatch = line.match(/^(\s*)-\s*\[\s*\]\s*(.*)$/);
      const checkedMatch = line.match(/^(\s*)-\s*\[x\]\s*(.*)$/i);

      if (uncheckedMatch) {
        items.push({ text: uncheckedMatch[2], checked: false, line: index });
      } else if (checkedMatch) {
        items.push({ text: checkedMatch[2], checked: true, line: index });
      }
    });

    return items;
  };

  const toggleCheckbox = async (lineIndex: number) => {
    if (!selectedDoc) return;

    const lines = content.split('\n');
    const line = lines[lineIndex];

    if (line.match(/^(\s*)-\s*\[\s*\]/)) {
      lines[lineIndex] = line.replace(/^(\s*)-\s*\[\s*\]/, '$1- [x]');
    } else if (line.match(/^(\s*)-\s*\[x\]/i)) {
      lines[lineIndex] = line.replace(/^(\s*)-\s*\[x\]/i, '$1- [ ]');
    }

    const newContent = lines.join('\n');
    setContent(newContent);

    await updateDocument(selectedDoc.id, { content: newContent });
  };

  const handleCreateDocument = async () => {
    const doc = await createDocument({
      title: '새 메모',
      content: '- [ ] ',
      date: Date.now(),
      status: 'none',
    });
    setDocuments([doc, ...documents]);
    setSelectedDocId(doc.id);
  };

  const handleAddItem = async () => {
    if (!selectedDoc || !newItemText.trim()) return;

    const newLine = `- [ ] ${newItemText.trim()}`;
    const newContent = content ? `${content}\n${newLine}` : newLine;
    
    setContent(newContent);
    await updateDocument(selectedDoc.id, { content: newContent });
    
    setNewItemText('');
    setIsAddingItem(false);
  };

  const handleStartAddItem = () => {
    setIsAddingItem(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleStartEditTitle = () => {
    if (!selectedDoc) return;
    setEditText(selectedDoc.title);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleSaveTitle = async () => {
    if (!selectedDoc) return;
    await updateDocument(selectedDoc.id, { title: editText });
    setSelectedDoc({ ...selectedDoc, title: editText });
    setIsEditingTitle(false);
  };

  const handleStartEditItem = (lineIndex: number, text: string) => {
    setEditText(text);
    setEditingItemLine(lineIndex);
    setTimeout(() => itemInputRef.current?.focus(), 0);
  };

  const handleSaveItem = async () => {
    if (!selectedDoc || editingItemLine === null) return;

    const lines = content.split('\n');
    const line = lines[editingItemLine];
    
    const newLine = line.replace(/^(\s*-\s*\[[ x]\]\s*).*$/i, `$1${editText}`);
    lines[editingItemLine] = newLine;

    const newContent = lines.join('\n');
    setContent(newContent);
    await updateDocument(selectedDoc.id, { content: newContent });
    
    setEditingItemLine(null);
  };

  const handleCycleStatus = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentStatus = doc.status || 'none';
    let nextStatus: DocumentStatus;
    
    if (currentStatus === 'none') {
      nextStatus = 'ready';
    } else {
      const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
      nextStatus = STATUS_CYCLE[nextIndex];
    }
    
    await updateDocument(doc.id, { status: nextStatus });
    setDocuments(documents.map(d => 
      d.id === doc.id ? { ...d, status: nextStatus } : d
    ));
  };

  if (!selectedDocId) {
    return (
      <div className="memo-view">
        <div className="memo-doc-list">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="memo-doc-item"
              onClick={() => setSelectedDocId(doc.id)}
            >
              <div className="memo-doc-info">
                <span 
                  className={`memo-status-icon status-${doc.status || 'none'}`}
                  onClick={(e) => handleCycleStatus(doc, e)}
                  title="클릭하여 상태 변경"
                >
                  {STATUS_ICONS[doc.status || 'none']}
                </span>
                <span className="memo-doc-title">{doc.title || 'Untitled'}</span>
              </div>
              <span className="memo-doc-date">
                {new Date(doc.date).toLocaleDateString('ko-KR')}
              </span>
            </div>
          ))}
        </div>
        <button className="memo-add-btn" onClick={handleCreateDocument}>
          +
        </button>
      </div>
    );
  }

  const checklistItems = extractChecklists(content);

  return (
    <div className="memo-view">
      <div className="memo-header">
        <button className="memo-back-btn" onClick={() => setSelectedDocId(null)}>
          ←
        </button>
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            className="memo-title-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            onBlur={handleSaveTitle}
          />
        ) : (
          <span className="memo-doc-name" onClick={handleStartEditTitle}>
            {selectedDoc?.title || 'Untitled'}
          </span>
        )}
      </div>
      <ul className="memo-checklist">
        {checklistItems.map((item, index) => (
          <li key={index} className={`memo-item ${item.checked ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleCheckbox(item.line)}
            />
            {editingItemLine === item.line ? (
              <input
                ref={itemInputRef}
                type="text"
                className="memo-item-input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveItem();
                  if (e.key === 'Escape') setEditingItemLine(null);
                }}
                onBlur={handleSaveItem}
              />
            ) : (
              <span 
                className="memo-item-text" 
                onClick={() => handleStartEditItem(item.line, item.text)}
              >
                {item.text || '\u200B'}
              </span>
            )}
          </li>
        ))}
      </ul>
      {isAddingItem ? (
        <div className="memo-add-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="memo-add-input"
            placeholder="새 항목 입력..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddItem();
              if (e.key === 'Escape') setIsAddingItem(false);
            }}
            onBlur={() => {
              if (!newItemText.trim()) setIsAddingItem(false);
            }}
          />
          <button className="memo-add-confirm" onClick={handleAddItem}>✓</button>
        </div>
      ) : (
        <button className="memo-add-btn" onClick={handleStartAddItem}>
          +
        </button>
      )}
    </div>
  );
}
