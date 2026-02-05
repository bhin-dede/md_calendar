'use client';

import { useState, useEffect } from 'react';
import { useMemoMode } from '@/context/MemoModeContext';
import { getAllDocuments, getDocument, updateDocument } from '@/lib/db';
import { Document, DocumentStatus } from '@/lib/types';

const STATUS_ICONS: Record<DocumentStatus, string | null> = {
  none: null,
  ready: '□',
  in_progress: '→',
  paused: '⏸',
  completed: '✓',
};

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

  if (!selectedDocId) {
    return (
      <div className="memo-view">
        <div className="memo-doc-list">
          {documents.length === 0 ? (
            <div className="memo-empty">
              <span>저장된 문서가 없습니다</span>
            </div>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.id}
                className="memo-doc-item"
                onClick={() => setSelectedDocId(doc.id)}
              >
                <div className="memo-doc-info">
                  {STATUS_ICONS[doc.status || 'none'] && (
                    <span className={`memo-status-icon status-${doc.status}`}>
                      {STATUS_ICONS[doc.status || 'none']}
                    </span>
                  )}
                  <span className="memo-doc-title">{doc.title || 'Untitled'}</span>
                </div>
                <span className="memo-doc-date">
                  {new Date(doc.date).toLocaleDateString('ko-KR')}
                </span>
              </button>
            ))
          )}
        </div>
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
        <span className="memo-doc-name">{selectedDoc?.title || 'Untitled'}</span>
      </div>
      {checklistItems.length === 0 ? (
        <div className="memo-empty">
          <span>체크리스트가 없습니다</span>
        </div>
      ) : (
        <ul className="memo-checklist">
          {checklistItems.map((item, index) => (
            <li key={index} className={`memo-item ${item.checked ? 'checked' : ''}`}>
              <label>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleCheckbox(item.line)}
                />
                <span className="memo-item-text">{item.text || '\u200B'}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
