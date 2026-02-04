'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const highlightExtension = {
  name: 'highlight',
  level: 'inline' as const,
  start(src: string) { return src.indexOf('=='); },
  tokenizer(src: string) {
    const match = /^==([^=]+)==/.exec(src);
    if (match) {
      return { type: 'highlight', raw: match[0], text: match[1] };
    }
  },
  renderer(token: { text: string }) {
    return `<mark>${token.text}</mark>`;
  },
};

marked.use({ extensions: [highlightExtension] });

const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  if (lang && hljs.getLanguage(lang)) {
    const highlighted = hljs.highlight(text, { language: lang }).value;
    return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
  }
  const highlighted = hljs.highlightAuto(text).value;
  return `<pre><code class="hljs">${highlighted}</code></pre>`;
};

marked.use({ renderer });

interface MarkdownPreviewProps {
  content: string;
  onContentChange?: (newContent: string) => void;
}

export function MarkdownPreview({ content, onContentChange }: MarkdownPreviewProps) {
  const [html, setHtml] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMarkdown = async () => {
      const rawHtml = marked.parse(content || '') as string;
      const DOMPurify = (await import('dompurify')).default;
      const sanitized = DOMPurify.sanitize(rawHtml);
      const enabledCheckboxes = sanitized.replace(/disabled=""\s*/g, '');
      setHtml(enabledCheckboxes);
    };
    renderMarkdown();
  }, [content]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    if (isFullscreen) {
      window.document.addEventListener('keydown', handleEsc);
      return () => window.document.removeEventListener('keydown', handleEsc);
    }
  }, [isFullscreen]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      e.preventDefault();
      if (!onContentChange) return;

      let container: HTMLDivElement | null = null;
      if (fullscreenRef.current?.contains(target)) {
        container = fullscreenRef.current;
      } else if (previewRef.current?.contains(target)) {
        container = previewRef.current;
      }
      if (!container) return;

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      const index = Array.from(checkboxes).indexOf(target as HTMLInputElement);
      if (index === -1) return;

      const lines = content.split('\n');
      let checkboxCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const uncheckedMatch = lines[i].match(/^(\s*[-*+]\s*)\[ \]/);
        const checkedMatch = lines[i].match(/^(\s*[-*+]\s*)\[x\]/i);
        
        if (uncheckedMatch || checkedMatch) {
          if (checkboxCount === index) {
            if (uncheckedMatch) {
              lines[i] = lines[i].replace(/\[ \]/, '[x]');
            } else {
              lines[i] = lines[i].replace(/\[x\]/i, '[ ]');
            }
            onContentChange(lines.join('\n'));
            return;
          }
          checkboxCount++;
        }
      }
    }
  }, [content, onContentChange]);

  return (
    <>
      <div className="preview-pane">
        <div className="preview-pane-header">
          <span>Preview</span>
          <button
            className="fullscreen-btn"
            onClick={() => setIsFullscreen(true)}
            title="Fullscreen Preview"
          >
            📋
          </button>
        </div>
        <div
          ref={previewRef}
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: html }}
          onClick={handleCheckboxClick}
        />
      </div>

      {isFullscreen && (
        <div className="fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
          <div className="fullscreen-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="fullscreen-close"
              onClick={() => setIsFullscreen(false)}
            >
              ✕
            </button>
            <div
              ref={fullscreenRef}
              className="fullscreen-content preview-content"
              dangerouslySetInnerHTML={{ __html: html }}
              onClick={handleCheckboxClick}
            />
          </div>
        </div>
      )}
    </>
  );
}
