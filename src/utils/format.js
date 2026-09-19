// Utilitários de formatação — únicos no projeto, evita duplicação de Intl.* espalhada.
<<<<<<< HEAD
import { isPrivacyActive } from './privacy.js';
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078

const currencyFormatters = {};
export function money(value, currency = 'BRL') {
  const v = Number(value) || 0;
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency });
  }
<<<<<<< HEAD
  const formatted = currencyFormatters[currency].format(v);
  // Modo Privado (seção 26): mascara só os dígitos, preservando símbolo da
  // moeda e separadores — assim "R$ 1.234,56" vira "R$ •.•••,••" em vez de
  // sumir por completo, mantendo a leitura de que ali existe um valor.
  return isPrivacyActive() ? formatted.replace(/\d/g, '•') : formatted;
}

// Usado em relatórios/exportações — uma exportação é uma ação deliberada do
// usuário (gerar PDF, mandar pro ChatGPT), diferente de só estar olhando a
// tela em público. Mascarar aqui tornaria o próprio recurso inútil, então
// esta variante NUNCA aplica o Modo Privado.
export function moneyRaw(value, currency = 'BRL') {
  const v = Number(value) || 0;
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat('pt-BR', { style: 'currency', currency });
  }
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
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
