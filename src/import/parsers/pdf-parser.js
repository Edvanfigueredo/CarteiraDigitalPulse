// Parser de PDF — melhor esforço.
//
// IMPORTANTE (documentado também na UI): extratos bancários em PDF têm
// layouts muito diferentes entre bancos. Este parser extrai o texto
// selecionável do PDF e procura, linha a linha, um padrão comum de extrato
// (data + descrição + valor). Ele NUNca inventa valores: quando uma
// informação não é encontrada com confiança, a linha inteira é descartada
// e o usuário revisa o total extraído antes de confirmar (ver reconciliation.js).

let pdfjsReady = null;
async function loadPdfJs() {
  if (pdfjsReady) return pdfjsReady;
  pdfjsReady = (async () => {
    const pdfjsLib = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjsLib;
  })();
  return pdfjsReady;
}

// Ex.: "12/09/2026 PAGAMENTO FATURA CARTAO -150,00"
// Ex.: "12/09  Compra Supermercado XYZ            250,40"
const LINE_PATTERN = /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.+?)\s+(-?R?\$?\s?-?\d{1,3}(?:\.\d{3})*,\d{2}-?)\s*$/;

function normalizeDate(raw, fallbackYear) {
  const parts = raw.split('/');
  if (parts.length === 3) {
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return `${fallbackYear}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

function normalizeAmount(raw) {
  const negative = /-/.test(raw);
  const clean = raw.replace(/[^\d,]/g, '');
  const value = Number(clean.replace(/\./g, '').replace(',', '.')) || 0;
  return { value, negative };
}

export async function parsePdfFile(file) {
  const pdfjsLib = await loadPdfJs().catch(() => { const e = new Error('no pdfjs'); e.code = 'NO_PDF'; throw e; });
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  const lines = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    let currentLine = '';
    let lastY = null;
    content.items.forEach((item) => {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) { lines.push(currentLine.trim()); currentLine = ''; }
      currentLine += ` ${item.str}`;
      lastY = y;
    });
    if (currentLine.trim()) lines.push(currentLine.trim());
  }

  if (!lines.length) { const e = new Error('no text'); e.code = 'PDF_NO_TEXT'; throw e; }

  const fallbackYear = new Date().getFullYear();
  const items = [];
  lines.forEach((line) => {
    const match = line.match(LINE_PATTERN);
    if (!match) return;
    const [, dateRaw, descRaw, amountRaw] = match;
    const { value, negative } = normalizeAmount(amountRaw);
    if (!value) return;
    items.push({
      date: normalizeDate(dateRaw, fallbackYear),
      desc: descRaw.trim().replace(/\s{2,}/g, ' '),
      val: value,
      tipo: negative ? 'despesa' : 'receita',
      cat: null
    });
  });

  if (!items.length) { const e = new Error('no rows'); e.code = 'NO_ROWS'; throw e; }
  return { items, linesScanned: lines.length, linesMatched: items.length };
}
