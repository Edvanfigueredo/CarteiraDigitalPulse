// Validações simples e mensagens amigáveis — nunca expor erro técnico ao usuário.

export function isValidDateStr(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

export function isValidMonthStr(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value || ''));
}

export function toNumberBR(value) {
  // Converte "1.234,56" ou "1234.56" ou "R$ 1.234,56" para Number
  if (typeof value === 'number') return value;
  const text = String(value ?? '').trim().replace(/^R\$\s?/, '');
  if (!text) return 0;
  // Se tiver vírgula como separador decimal (formato BR)
  if (/,\d{1,2}$/.test(text)) {
    return Number(text.replace(/\./g, '').replace(',', '.')) || 0;
  }
  return Number(text.replace(/,/g, '')) || 0;
}

export function friendlyImportError(error) {
  // Nunca mostrar "undefined", "null" ou stack trace ao usuário.
  const known = {
    EMPTY: 'O arquivo está vazio ou não pôde ser lido.',
    NO_ROWS: 'Não encontramos lançamentos neste arquivo. Verifique se ele possui colunas de Data, Descrição e Valor.',
    BAD_JSON: 'Este arquivo JSON não está em um formato reconhecido pelo Pulse.',
    NO_XLSX: 'Não foi possível carregar o leitor de planilhas. Verifique sua conexão e tente novamente.',
    NO_PDF: 'Não foi possível carregar o leitor de PDF. Verifique sua conexão e tente novamente.',
    PDF_NO_TEXT: 'Não conseguimos extrair texto deste PDF. Ele pode ser uma imagem digitalizada, sem texto selecionável.',
    UNKNOWN: 'Não conseguimos interpretar este arquivo. Verifique se ele possui dados de movimentação financeira.'
  };
  return known[error?.code] || known.UNKNOWN;
}
