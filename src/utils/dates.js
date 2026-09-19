// Utilitários de data para recorrências financeiras.
// Fins de semana como não úteis; feriados nacionais ainda não considerados
// (estrutura pronta para receber uma lista de feriados no futuro — ver
// `isBusinessDay`, ponto único de extensão).

export function isBusinessDay(date) {
  const day = date.getDay(); // 0 = domingo, 6 = sábado
  return day !== 0 && day !== 6;
}

// Retorna o último dia útil de um mês (yyyy, mesIndex0based) como Date local.
export function lastBusinessDayOfMonth(year, monthIndex0) {
  const lastDay = new Date(year, monthIndex0 + 1, 0);
  while (!isBusinessDay(lastDay)) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  return lastDay;
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addMonths(dateStr, count) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1 + count, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return toISODate(target);
}

export function monthRange(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return { start: toISODate(start), end: toISODate(end), year: y, monthIndex0: m - 1 };
}

// Calcula a data de recebimento de uma renda recorrente para um mês (yyyy-mm).
export function recurringIncomeDateForMonth(renda, yyyyMm) {
  const { year, monthIndex0 } = monthRange(yyyyMm);
  if (renda.ultimoDiaUtil) {
    return toISODate(lastBusinessDayOfMonth(year, monthIndex0));
  }
  const day = Math.min(Number(renda.diaFixo) || 1, new Date(year, monthIndex0 + 1, 0).getDate());
  return toISODate(new Date(year, monthIndex0, day));
}

// Calcula a data de vencimento de uma despesa recorrente para um mês.
export function recurringExpenseDateForMonth(despesa, yyyyMm) {
  const { year, monthIndex0 } = monthRange(yyyyMm);
  const day = Math.min(Number(despesa.diaVencimento) || 1, new Date(year, monthIndex0 + 1, 0).getDate());
  return toISODate(new Date(year, monthIndex0, day));
}
