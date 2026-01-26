import { createDocument, getDocument, updateDocument, formatDate, formatDateTime } from '../db.js';
import { showToast } from '../app.js';
import router from '../router.js';

let currentDocId = null;
let saveTimeout = null;
let lastSavedContent = '';

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

const toolbarItems = [
  { group: 'format', items: [
    { icon: 'B', title: 'Bold', action: 'bold', before: '**', after: '**' },
    { icon: 'I', title: 'Italic', action: 'italic', before: '_', after: '_' },
    { icon: 'S', title: 'Strikethrough', action: 'strike', before: '~~', after: '~~' },
  ]},
  { group: 'heading', items: [
    { icon: 'H1', title: 'Heading 1', action: 'h1', before: '# ', after: '' },
    { icon: 'H2', title: 'Heading 2', action: 'h2', before: '## ', after: '' },
    { icon: 'H3', title: 'Heading 3', action: 'h3', before: '### ', after: '' },
  ]},
  { group: 'insert', items: [
    { icon: '🔗', title: 'Link', action: 'link', before: '[', after: '](url)' },
    { icon: '🖼', title: 'Image', action: 'image', before: '![alt](', after: ')' },
    { icon: '`', title: 'Code', action: 'code', before: '`', after: '`' },
    { icon: '```', title: 'Code Block', action: 'codeblock', before: '```\n', after: '\n```' },
  ]},
  { group: 'list', items: [
    { icon: '•', title: 'Bullet List', action: 'ul', before: '- ', after: '' },
    { icon: '1.', title: 'Numbered List', action: 'ol', before: '1. ', after: '' },
    { icon: '☑', title: 'Task List', action: 'task', before: '- [ ] ', after: '' },
  ]},
  { group: 'block', items: [
    { icon: '"', title: 'Quote', action: 'quote', before: '> ', after: '' },
    { icon: '—', title: 'Divider', action: 'hr', before: '\n---\n', after: '' },
  ]},
];

function createToolbar() {
  const toolbar = document.createElement('div');
  toolbar.className = 'editor-toolbar';

  toolbarItems.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.className = 'toolbar-group';
    
    group.items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'toolbar-btn';
      btn.title = item.title;
      btn.textContent = item.icon;
      btn.dataset.action = item.action;
      btn.dataset.before = item.before;
      btn.dataset.after = item.after;
      btn.type = 'button';
      groupEl.appendChild(btn);
    });
    
    toolbar.appendChild(groupEl);
  });

  return toolbar;
}

function handleToolbarClick(e, textarea) {
  const btn = e.target.closest('.toolbar-btn');
  if (!btn) return;

  const before = btn.dataset.before;
  const after = btn.dataset.after;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);
  
  const newText = text.substring(0, start) + before + selected + after + text.substring(end);
  textarea.value = newText;
  
  textarea.focus();
  const newCursorPos = start + before.length + selected.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);
  
  textarea.dispatchEvent(new Event('input'));
}

function updatePreview(content, previewEl) {
  const html = marked.parse(content || '');
  previewEl.innerHTML = DOMPurify.sanitize(html);
}

function updateSaveIndicator(status) {
  const indicator = document.querySelector('.save-indicator');
  if (!indicator) return;

  indicator.className = 'save-indicator ' + status;
  if (status === 'saving') {
    indicator.innerHTML = '<span>Saving...</span>';
  } else if (status === 'saved') {
    indicator.innerHTML = '<span>Saved</span>';
  } else {
    indicator.innerHTML = '<span>Unsaved</span>';
  }
}

async function autoSave(doc) {
  if (!currentDocId) return;
  
  updateSaveIndicator('saving');
  
  try {
    await updateDocument(currentDocId, doc);
    lastSavedContent = doc.content;
    updateSaveIndicator('saved');
  } catch (error) {
    console.error('Auto-save failed:', error);
    showToast('Auto-save failed', 'error');
    updateSaveIndicator('unsaved');
  }
}

function scheduleAutoSave(doc) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  updateSaveIndicator('unsaved');
  saveTimeout = setTimeout(() => autoSave(doc), 2000);
}

export async function renderEditor(container, params = {}) {
  currentDocId = params.id || null;
  let doc = null;

  if (currentDocId) {
    doc = await getDocument(currentDocId);
    if (!doc) {
      showToast('Document not found', 'error');
      router.navigate('/editor');
      return;
    }
  }

  container.innerHTML = '';
  container.className = 'app-container view-editor';

  const metaBar = document.createElement('div');
  metaBar.className = 'document-meta';
  
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'title-input';
  titleInput.placeholder = 'Document Title';
  titleInput.value = doc?.title || '';
  
  const dateWrapper = document.createElement('div');
  dateWrapper.className = 'document-meta-item';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'date-picker';
  dateInput.value = doc ? new Date(doc.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  dateWrapper.appendChild(dateInput);

  const saveIndicator = document.createElement('div');
  saveIndicator.className = 'save-indicator saved';
  saveIndicator.innerHTML = '<span>Saved</span>';

  const actionsWrapper = document.createElement('div');
  actionsWrapper.className = 'flex gap-sm';
  
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-secondary btn-sm';
  exportBtn.textContent = 'Export MD';
  exportBtn.onclick = () => exportDocument();
  
  const importWrapper = document.createElement('div');
  importWrapper.className = 'file-input-wrapper';
  const importBtn = document.createElement('button');
  importBtn.className = 'btn btn-sm';
  importBtn.textContent = 'Import MD';
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.md,.markdown,.txt';
  importInput.onchange = (e) => handleImport(e, titleInput, document.querySelector('.editor-textarea'));
  importWrapper.appendChild(importBtn);
  importWrapper.appendChild(importInput);
  
  actionsWrapper.appendChild(exportBtn);
  actionsWrapper.appendChild(importWrapper);

  metaBar.appendChild(titleInput);
  metaBar.appendChild(dateWrapper);
  metaBar.appendChild(saveIndicator);
  metaBar.appendChild(actionsWrapper);
  
  container.appendChild(metaBar);

  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';

  const editorPane = document.createElement('div');
  editorPane.className = 'editor-pane';
  
  const editorHeader = document.createElement('div');
  editorHeader.className = 'editor-pane-header';
  editorHeader.innerHTML = '<span>Markdown</span>';
  
  const toolbar = createToolbar();
  
  const textarea = document.createElement('textarea');
  textarea.className = 'editor-textarea';
  textarea.placeholder = 'Start writing your markdown here...';
  textarea.value = doc?.content || '';
  lastSavedContent = doc?.content || '';
  
  editorPane.appendChild(editorHeader);
  editorPane.appendChild(toolbar);
  editorPane.appendChild(textarea);

  const previewPane = document.createElement('div');
  previewPane.className = 'preview-pane';
  
  const previewHeader = document.createElement('div');
  previewHeader.className = 'preview-pane-header';
  previewHeader.innerHTML = '<span>Preview</span>';
  
  const previewContent = document.createElement('div');
  previewContent.className = 'preview-content';
  
  previewPane.appendChild(previewHeader);
  previewPane.appendChild(previewContent);

  editorContainer.appendChild(editorPane);
  editorContainer.appendChild(previewPane);
  container.appendChild(editorContainer);

  updatePreview(textarea.value, previewContent);

  toolbar.addEventListener('click', (e) => handleToolbarClick(e, textarea));

  textarea.addEventListener('input', async () => {
    updatePreview(textarea.value, previewContent);
    
    if (!currentDocId && textarea.value.trim()) {
      try {
        doc = await createDocument({
          title: titleInput.value || 'Untitled',
          content: textarea.value,
          date: new Date(dateInput.value).getTime(),
        });
        currentDocId = doc.id;
        router.navigate(`/editor/${currentDocId}`);
        showToast('Document created', 'success');
      } catch (error) {
        console.error('Failed to create document:', error);
      }
    } else if (currentDocId) {
      scheduleAutoSave({
        title: titleInput.value,
        content: textarea.value,
        date: new Date(dateInput.value).getTime(),
      });
    }
  });

  titleInput.addEventListener('input', () => {
    if (currentDocId) {
      scheduleAutoSave({
        title: titleInput.value,
        content: textarea.value,
        date: new Date(dateInput.value).getTime(),
      });
    }
  });

  dateInput.addEventListener('change', () => {
    if (currentDocId) {
      scheduleAutoSave({
        title: titleInput.value,
        content: textarea.value,
        date: new Date(dateInput.value).getTime(),
      });
    }
  });
}

async function exportDocument() {
  const titleInput = document.querySelector('.title-input');
  const textarea = document.querySelector('.editor-textarea');
  
  if (!textarea.value.trim()) {
    showToast('Nothing to export', 'error');
    return;
  }
  
  const filename = (titleInput.value || 'untitled').replace(/[^a-zA-Z0-9가-힣]/g, '_') + '.md';
  const blob = new Blob([textarea.value], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('Document exported', 'success');
}

async function handleImport(e, titleInput, textarea) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    textarea.value = content;
    
    const filename = file.name.replace(/\.(md|markdown|txt)$/i, '');
    titleInput.value = filename;
    
    textarea.dispatchEvent(new Event('input'));
    showToast('Document imported', 'success');
  };
  reader.readAsText(file);
  
  e.target.value = '';
}

export default { renderEditor };
