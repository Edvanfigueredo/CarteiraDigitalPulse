import { escapeHtml } from '../../utils/sanitize.js';

export function emptyStateHtml({ icon = 'fa-inbox', title, text, actionLabel, actionAttr }) {
  return `
    <div class="empty-state">
      <i class="fa-solid ${escapeHtml(icon)}" aria-hidden="true"></i>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
      ${actionLabel ? `<button class="btn btn-primary" type="button" ${actionAttr || ''}>${escapeHtml(actionLabel)}</button>` : ''}
    </div>`;
}
