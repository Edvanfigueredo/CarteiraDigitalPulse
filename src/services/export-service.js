import { getData } from '../core/store.js';

function downloadText(content, mime, filename) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Escapa campos CSV corretamente (aspas duplas + separador) — corrige o bug
// do protótipo original, que concatenava campos sem escaping.
function csvField(value) {
  const text = String(value ?? '');
  if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function exportJson() {
  const payload = { exportedAt: new Date().toISOString(), format: 'pulse-finance-v2', data: getData() };
  downloadText(JSON.stringify(payload, null, 2), 'application/json', `pulse-backup-${Date.now()}.json`);
}

export function exportCsv() {
  const rows = ['Data,Descricao,Tipo,Categoria,Valor'];
  getData().transacoes.forEach((t) => {
    rows.push([t.date, t.desc, t.tipo, t.cat, t.val].map(csvField).join(','));
  });
  downloadText(rows.join('\n'), 'text/csv', `pulse-transacoes-${Date.now()}.csv`);
}
