// Parser de planilhas (.xlsx / .xls) via SheetJS. Tenta detectar automaticamente
// as colunas Data/Descrição/Valor/Tipo/Categoria; quando a detecção falha,
// devolve os cabeçalhos brutos para que a UI monte uma etapa de mapeamento manual.

const FIELD_ALIASES = {
  date: ['data', 'date', 'datadatransacao', 'datamovimento'],
  desc: ['descricao', 'description', 'historico', 'lancamento', 'memo'],
  val: ['valor', 'value', 'amount', 'montante'],
  tipo: ['tipo', 'type', 'natureza'],
  cat: ['categoria', 'category'],
  conta: ['conta', 'account', 'cartao', 'card']
};

function normalizeKey(key) {
  return String(key || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function detectMapping(headers) {
  const normalized = headers.map(normalizeKey);
  const mapping = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx !== -1) mapping[field] = headers[idx];
  }
  return mapping;
}

function parseBrDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value || '').trim();
  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = text.match(/^\d{4}-\d{2}-\d{2}/);
  return iso ? iso[0] : null;
}

function parseBrNumber(value) {
  if (typeof value === 'number') return value;
  const text = String(value ?? '').replace('R$', '').trim();
  if (/,\d{1,2}$/.test(text)) return Number(text.replace(/\./g, '').replace(',', '.')) || 0;
  return Number(text.replace(/,/g, '')) || 0;
}

export async function parseExcelFile(file) {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const book = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = book.SheetNames[0];
  const sheet = book.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) { const err = new Error('empty'); err.code = 'NO_ROWS'; throw err; }

  const headers = Object.keys(rows[0]);
  const mapping = detectMapping(headers);
  const hasMinimum = mapping.date && mapping.desc && mapping.val;

  return { headers, rows, mapping, needsMapping: !hasMinimum };
}

// CSV/TSV em texto puro (mantém compatibilidade com o fluxo antigo de
// "extrato de cartão" em .csv, agrupado agora sob a opção "Excel/Planilha").
export function parseCsvText(raw) {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) { const e = new Error('empty'); e.code = 'NO_ROWS'; throw e; }
  const delimiter = lines[0].includes(';') ? ';' : (lines[0].includes('\t') ? '\t' : ',');
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(delimiter);
    const row = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    return row;
  });
  const mapping = detectMapping(headers);
  const hasMinimum = mapping.date && mapping.desc && mapping.val;
  return { headers, rows, mapping, needsMapping: !hasMinimum };
}

export function rowsToTransactions(rows, mapping, defaultCategory) {
  return rows.map((row) => {
    const rawVal = parseBrNumber(row[mapping.val]);
    const explicitTipo = mapping.tipo ? String(row[mapping.tipo] ?? '').toLowerCase() : '';
    const tipo = explicitTipo.includes('receita') ? 'receita'
      : explicitTipo.includes('despesa') ? 'despesa'
      : (rawVal > 0 ? 'receita' : 'despesa');
    return {
      date: parseBrDate(row[mapping.date]) || null,
      desc: String(row[mapping.desc] ?? '').trim() || 'Lançamento importado',
      val: Math.abs(rawVal),
      tipo,
      cat: (mapping.cat && row[mapping.cat]) || defaultCategory
    };
  }).filter((item) => item.date && item.val >= 0);
}
