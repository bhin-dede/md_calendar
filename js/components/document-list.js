import { getAllDocuments, deleteDocument, searchDocuments, formatDateTime, createDocument } from '../db.js';
import { showToast, showConfirmModal } from '../app.js';
import router from '../router.js';

const COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)', 
  'var(--color-purple)',
  'var(--color-blue)',
  'var(--color-green)',
  'var(--color-orange)',
  'var(--color-accent)',
];

function getColorForDoc(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getContentPreview(content, maxLength = 150) {
  const stripped = content
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  return stripped.length > maxLength 
    ? stripped.substring(0, maxLength) + '...' 
    : stripped;
}

function createDocumentCard(doc) {
  const card = document.createElement('div');
  card.className = 'document-card';
  card.dataset.id = doc.id;

  const colorBar = document.createElement('div');
  colorBar.className = 'document-card-color';
  colorBar.style.backgroundColor = getColorForDoc(doc.id);

  const content = document.createElement('div');
  content.className = 'document-card-content';
  
  const title = document.createElement('div');
  title.className = 'document-card-title';
  title.textContent = doc.title || 'Untitled';
  
  const preview = document.createElement('div');
  preview.className = 'document-card-preview';
  preview.textContent = getContentPreview(doc.content) || 'No content';
  
  const meta = document.createElement('div');
  meta.className = 'document-card-meta';
  meta.innerHTML = `
    <span>Created: ${formatDateTime(doc.createdAt)}</span>
    <span>Modified: ${formatDateTime(doc.updatedAt)}</span>
  `;
  
  content.appendChild(title);
  content.appendChild(preview);
  content.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'document-card-actions';
  
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-sm btn-secondary';
  editBtn.textContent = 'Edit';
  editBtn.onclick = (e) => {
    e.stopPropagation();
    router.navigate(`/editor/${doc.id}`);
  };
  
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-sm';
  exportBtn.textContent = 'Export';
  exportBtn.onclick = (e) => {
    e.stopPropagation();
    exportSingleDocument(doc);
  };
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-primary';
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    handleDelete(doc);
  };
  
  actions.appendChild(editBtn);
  actions.appendChild(exportBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(colorBar);
  card.appendChild(content);
  card.appendChild(actions);

  card.onclick = () => router.navigate(`/editor/${doc.id}`);

  return card;
}

function exportSingleDocument(doc) {
  const filename = (doc.title || 'untitled').replace(/[^a-zA-Z0-9가-힣]/g, '_') + '.md';
  const blob = new Blob([doc.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('Document exported', 'success');
}

async function handleDelete(doc) {
  const confirmed = await showConfirmModal(
    'Delete Document',
    `Are you sure you want to delete "${doc.title || 'Untitled'}"? This action cannot be undone.`
  );
  
  if (confirmed) {
    try {
      await deleteDocument(doc.id);
      showToast('Document deleted', 'success');
      refreshList();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete document', 'error');
    }
  }
}

function createEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = `
    <div class="empty-state-icon">📝</div>
    <h3 class="empty-state-title">No documents yet</h3>
    <p class="empty-state-text">Create your first markdown document to get started.</p>
    <button class="btn btn-primary btn-lg" id="empty-create-btn">Create Document</button>
  `;
  return empty;
}

function createSearchEmptyState(query) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = `
    <div class="empty-state-icon">🔍</div>
    <h3 class="empty-state-title">No results found</h3>
    <p class="empty-state-text">No documents match "${query}".</p>
  `;
  return empty;
}

let currentContainer = null;
let currentSearchQuery = '';

async function refreshList() {
  if (!currentContainer) return;
  
  const listContent = currentContainer.querySelector('.list-content');
  if (!listContent) return;
  
  let docs;
  if (currentSearchQuery) {
    docs = await searchDocuments(currentSearchQuery);
  } else {
    docs = await getAllDocuments();
  }
  
  listContent.innerHTML = '';
  
  if (docs.length === 0) {
    if (currentSearchQuery) {
      listContent.appendChild(createSearchEmptyState(currentSearchQuery));
    } else {
      const emptyState = createEmptyState();
      listContent.appendChild(emptyState);
      emptyState.querySelector('#empty-create-btn').onclick = () => router.navigate('/editor');
    }
    return;
  }
  
  const grid = document.createElement('div');
  grid.className = 'list-grid';
  
  docs.forEach(doc => {
    grid.appendChild(createDocumentCard(doc));
  });
  
  listContent.appendChild(grid);
}

export async function renderDocumentList(container) {
  currentContainer = container;
  currentSearchQuery = '';
  
  container.innerHTML = '';
  container.className = 'app-container view-list';

  const header = document.createElement('div');
  header.className = 'list-header';
  
  const leftSection = document.createElement('div');
  leftSection.className = 'flex items-center gap-md';
  
  const title = document.createElement('h2');
  title.className = 'page-title';
  title.textContent = 'Documents';
  
  leftSection.appendChild(title);
  
  const rightSection = document.createElement('div');
  rightSection.className = 'flex items-center gap-md';
  
  const searchBox = document.createElement('div');
  searchBox.className = 'search-box list-search';
  
  const searchIcon = document.createElement('span');
  searchIcon.className = 'search-box-icon';
  searchIcon.textContent = '🔍';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'input';
  searchInput.placeholder = 'Search documents...';
  
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      currentSearchQuery = searchInput.value.trim();
      await refreshList();
    }, 300);
  });
  
  searchBox.appendChild(searchIcon);
  searchBox.appendChild(searchInput);
  
  const importWrapper = document.createElement('div');
  importWrapper.className = 'file-input-wrapper';
  const importBtn = document.createElement('button');
  importBtn.className = 'btn';
  importBtn.textContent = 'Import MD';
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.md,.markdown,.txt';
  importInput.multiple = true;
  importInput.onchange = handleBulkImport;
  importWrapper.appendChild(importBtn);
  importWrapper.appendChild(importInput);
  
  const newBtn = document.createElement('button');
  newBtn.className = 'btn btn-primary';
  newBtn.textContent = '+ New Document';
  newBtn.onclick = () => router.navigate('/editor');
  
  rightSection.appendChild(searchBox);
  rightSection.appendChild(importWrapper);
  rightSection.appendChild(newBtn);
  
  header.appendChild(leftSection);
  header.appendChild(rightSection);

  const listContent = document.createElement('div');
  listContent.className = 'list-content';

  container.appendChild(header);
  container.appendChild(listContent);

  await refreshList();
}

async function handleBulkImport(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  
  let imported = 0;
  
  for (const file of files) {
    try {
      const content = await readFile(file);
      const filename = file.name.replace(/\.(md|markdown|txt)$/i, '');
      
      await createDocument({
        title: filename,
        content: content,
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
    await refreshList();
  } else {
    showToast('Failed to import documents', 'error');
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export default { renderDocumentList };
