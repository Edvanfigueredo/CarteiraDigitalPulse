// Escape central de HTML. Toda view deve passar dados do usuário por aqui
// antes de interpolar em innerHTML. Resolve o problema de XSS identificado
// na auditoria do protótipo original (dashboard.js / data-transfer.js).
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
}

// Para uso em atributos de template literal: `<td>${esc`${desc}`}</td>`
export function esc(strings, ...values) {
  return strings.reduce((out, str, i) => out + str + (i < values.length ? escapeHtml(values[i]) : ''), '');
}
