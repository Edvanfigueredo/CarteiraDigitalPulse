import { parseJson } from '../import/parsers/json-parser.js';
import { parseExcelFile, parseCsvText, rowsToTransactions } from '../import/parsers/excel-parser.js';
import { parsePdfFile } from '../import/parsers/pdf-parser.js';
import { parseOfx } from '../import/parsers/ofx-parser.js';
import { buildStaging, summarize } from '../import/reconciliation.js';
import { listCategories } from '../repositories/category-repository.js';
import { addMany } from '../repositories/transaction-repository.js';
import { replaceRealData } from '../core/store.js';

// Resultado possível:
//  { kind: 'staging', staging, summary }
//  { kind: 'needs-mapping', headers, rows }
//  { kind: 'full-backup-confirm', data }
export async function runImport({ fileType, file, destinoId }) {
  const defaultCategory = listCategories()[0]?.nome || 'Geral';

  if (fileType === 'json') {
    const text = await file.text();
    const result = parseJson(text);
    if (result.kind === 'full-backup') return { kind: 'full-backup-confirm', data: result.data };
    const staging = buildStaging(result.items, destinoId);
    return { kind: 'staging', staging, summary: summarize(staging) };
  }

  if (fileType === 'pdf') {
    const result = await parsePdfFile(file);
    const staging = buildStaging(result.items, destinoId);
    return { kind: 'staging', staging, summary: summarize(staging), pdfMeta: result };
  }

  if (fileType === 'excel') {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv') || name.endsWith('.txt')) {
      const text = await file.text();
      if (text.includes('<STMTTRN>') || text.includes('OFXHEADER')) {
        const items = parseOfx(text);
        const staging = buildStaging(items, destinoId);
        return { kind: 'staging', staging, summary: summarize(staging) };
      }
      const parsed = parseCsvText(text);
      if (parsed.needsMapping) return { kind: 'needs-mapping', headers: parsed.headers, rows: parsed.rows, destinoId };
      const items = rowsToTransactions(parsed.rows, parsed.mapping, defaultCategory);
      const staging = buildStaging(items, destinoId);
      return { kind: 'staging', staging, summary: summarize(staging) };
    }
    const parsed = await parseExcelFile(file);
    if (parsed.needsMapping) return { kind: 'needs-mapping', headers: parsed.headers, rows: parsed.rows, destinoId };
    const items = rowsToTransactions(parsed.rows, parsed.mapping, defaultCategory);
    const staging = buildStaging(items, destinoId);
    return { kind: 'staging', staging, summary: summarize(staging) };
  }

  const e = new Error('unknown file type'); e.code = 'UNKNOWN'; throw e;
}

export function completeMapping(rows, mapping, destinoId) {
  const defaultCategory = listCategories()[0]?.nome || 'Geral';
  const items = rowsToTransactions(rows, mapping, defaultCategory);
  const staging = buildStaging(items, destinoId);
  return { staging, summary: summarize(staging) };
}

export async function confirmImport(staging, mode) {
  const toImport = staging.filter((item) => mode === 'tudo' || (mode === 'apenas_novos' && item.matchStatus === 'novo'));
  const rows = toImport.map((item) => ({
    id: Date.now() + Math.floor(Math.random() * 10000),
    desc: item.desc,
    val: item.val,
    tipo: item.tipo,
    cat: item.cat,
    tag: item.observacao || '',
    date: item.date,
    contaId: item.contaId,
    status: item.status
  }));
  await addMany(rows);
  return rows.length;
}

export async function confirmFullBackupRestore(data) {
  await replaceRealData(data);
}
