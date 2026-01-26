import { initDB } from './db.js';
import router from './router.js';
import { renderEditor } from './components/editor.js';
import { renderDocumentList } from './components/document-list.js';
import { renderCalendar } from './components/calendar.js';

const appContainer = document.getElementById('app-container');

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="btn btn-ghost btn-icon modal-close">×</button>
      </div>
      <div class="modal-body">
        <p>${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn modal-cancel">Cancel</button>
        <button class="btn btn-primary modal-confirm">Confirm</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const closeModal = (result) => {
      overlay.remove();
      resolve(result);
    };
    
    modal.querySelector('.modal-close').onclick = () => closeModal(false);
    modal.querySelector('.modal-cancel').onclick = () => closeModal(false);
    modal.querySelector('.modal-confirm').onclick = () => closeModal(true);
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal(false);
    };
  });
}

async function init() {
  try {
    await initDB();
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    showToast('Failed to initialize database', 'error');
  }

  router
    .addRoute('editor', (params) => renderEditor(appContainer, params))
    .addRoute('list', () => renderDocumentList(appContainer))
    .addRoute('calendar', () => renderCalendar(appContainer));

  document.getElementById('btn-new-doc').onclick = () => {
    router.navigate('/editor');
  };

  if (!window.location.hash) {
    router.navigate('/editor');
  }
}

document.addEventListener('DOMContentLoaded', init);

export default { showToast, showConfirmModal };
