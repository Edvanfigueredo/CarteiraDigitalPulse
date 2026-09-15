// Parser de JSON. Aceita:
//  1) Backup completo do Pulse: { format: 'pulse-finance-v2', data: {...} }
//  2) Lista de transações: { transacoes: [...] } ou array puro [...]
// Nunca importa dados corrompidos silenciosamente — lança erro com código
// amigável quando o formato não é reconhecido.

function normalizeRow(row) {
  const clean = {};
  Object.entries(row).forEach(([key, value]) => {
    clean[key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] = value;
  });
  const rawVal = clean.val ?? clean.valor ?? clean.value ?? clean.amount ?? 0;
  const numeric = Number(String(rawVal).replace('R$', '').replace(/\./g, '').replace(',', '.')) || Number(rawVal) || 0;
  const explicitTipo = String(clean.tipo ?? '').toLowerCase();
  const tipo = explicitTipo === 'receita' || explicitTipo === 'despesa' ? explicitTipo : (numeric > 0 ? 'receita' : 'despesa');
  return {
    date: String(clean.date ?? clean.data ?? '').slice(0, 10) || null,
    desc: clean.desc ?? clean.descricao ?? clean.description ?? 'Lançamento importado',
    val: Math.abs(numeric),
    tipo,
    cat: clean.cat ?? clean.categoria ?? clean.category ?? null
  };
}

export function parseJson(raw) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    const err = new Error('json invalid'); err.code = 'BAD_JSON'; throw err;
  }

  // Backup completo — retorna sinalizado para o import-service tratar como restauração
  if (json && json.format === 'pulse-finance-v2' && json.data) {
    return { kind: 'full-backup', data: json.data };
  }

  const rows = Array.isArray(json) ? json : (json.transacoes || json.transactions || null);
  if (!Array.isArray(rows)) {
    const err = new Error('json shape unknown'); err.code = 'BAD_JSON'; throw err;
  }
  const items = rows.map(normalizeRow).filter((r) => r.date && r.val >= 0);
  if (!items.length) {
    const err = new Error('no rows'); err.code = 'NO_ROWS'; throw err;
  }
  return { kind: 'transactions', items };
}
