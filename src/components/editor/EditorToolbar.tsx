'use client';

import React from 'react';

interface ToolbarItem {
  icon: string;
  title: string;
  action: string;
  before: string;
  after: string;
}

interface ToolbarGroup {
  group: string;
  items: ToolbarItem[];
}

const toolbarItems: ToolbarGroup[] = [
  {
    group: 'format',
    items: [
      { icon: 'B', title: 'Bold', action: 'bold', before: '**', after: '**' },
      { icon: 'I', title: 'Italic', action: 'italic', before: '_', after: '_' },
      { icon: 'S', title: 'Strikethrough', action: 'strike', before: '~~', after: '~~' },
    ],
  },
  {
    group: 'heading',
    items: [
      { icon: 'H1', title: 'Heading 1', action: 'h1', before: '# ', after: '' },
      { icon: 'H2', title: 'Heading 2', action: 'h2', before: '## ', after: '' },
      { icon: 'H3', title: 'Heading 3', action: 'h3', before: '### ', after: '' },
    ],
  },
  {
    group: 'insert',
    items: [
      { icon: '\uD83D\uDD17', title: 'Link', action: 'link', before: '[', after: '](url)' },
      { icon: '\uD83D\uDDBC', title: 'Image', action: 'image', before: '![alt](', after: ')' },
      { icon: '`', title: 'Code', action: 'code', before: '`', after: '`' },
      { icon: '```', title: 'Code Block', action: 'codeblock', before: '```\n', after: '\n```' },
    ],
  },
  {
    group: 'list',
    items: [
      { icon: '\u2022', title: 'Bullet List', action: 'ul', before: '- ', after: '' },
      { icon: '1.', title: 'Numbered List', action: 'ol', before: '1. ', after: '' },
      { icon: '\u2611', title: 'Task List', action: 'task', before: '- [ ] ', after: '' },
    ],
  },
  {
    group: 'block',
    items: [
      { icon: '"', title: 'Quote', action: 'quote', before: '> ', after: '' },
      { icon: '\u2014', title: 'Divider', action: 'hr', before: '\n---\n', after: '' },
    ],
  },
];

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentChange: () => void;
}

export function EditorToolbar({ textareaRef, onContentChange }: EditorToolbarProps) {
  const handleClick = (item: ToolbarItem) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const newText = text.substring(0, start) + item.before + selected + item.after + text.substring(end);
    textarea.value = newText;

    textarea.focus();
    const newCursorPos = start + item.before.length + selected.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);

    onContentChange();
  };

  return (
    <div className="editor-toolbar">
      {toolbarItems.map((group) => (
        <div key={group.group} className="toolbar-group">
          {group.items.map((item) => (
            <button
              key={item.action}
              className="toolbar-btn"
              title={item.title}
              type="button"
              onClick={() => handleClick(item)}
            >
              {item.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
