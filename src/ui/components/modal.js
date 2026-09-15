import { escapeHtml } from '../../utils/sanitize.js';

export function openModal({ title, bodyHtml, onMount }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="${escapeHtml(title || '')}">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(title || '')}</h3>
        <button class="btn btn-ghost btn-sm" type="button" data-close-modal aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">${bodyHtml || ''}</div>
    </div>`;
  document.body.appendChild(overlay);

  function close() { overlay.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') close(); }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('[data-close-modal]').addEventListener('click', close);
  document.addEventListener('keydown', onKey);

  if (onMount) onMount(overlay.querySelector('.modal-body'), close);
  return close;
}
