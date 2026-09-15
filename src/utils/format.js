// Utilitários de formatação — únicos no projeto, evita duplicação de Intl.* espalhada.

const currencyFormatters = {};
export function money(value, currency = 'BRL') {
  const v = Number(value) || 0;
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency });
  }
  return currencyFormatters[currency].format(v);
}

const monthLabelFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
export function monthLabel(yyyyMm) {
  // yyyyMm no formato "2026-09"
  return monthLabelFormatter.format(new Date(`${yyyyMm}-02T12:00:00`));
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function percent(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
