import { getMonthEvents } from './calendar-service.js';
import { listAccounts } from '../repositories/account-repository.js';

function shiftMonth(yyyyMm, delta) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Motor genérico: projeta `count` meses aplicando `adjust(events, month, index)`
// a cada mês antes de somar. Nunca persiste nada — é só matemática em cima
// dos mesmos eventos reais que alimentam Calendário e Previsão.
function project(startMonth, count, adjust) {
  const startBalance = listAccounts().reduce((a, c) => a + (c.saldo || 0), 0);
  let running = startBalance;
  const months = [];
  for (let i = 0; i < count; i++) {
    const month = shiftMonth(startMonth, i);
    let events = getMonthEvents(month);
    if (adjust) events = adjust(events, month, i);
    const income = events.filter((e) => e.tipo === 'receita').reduce((a, e) => a + e.val, 0);
    const expenses = events.filter((e) => e.tipo === 'despesa').reduce((a, e) => a + e.val, 0);
    running += income - expenses;
    months.push({ month, closing: running });
  }
  return months;
}

export function baseline(startMonth, count) {
  return project(startMonth, count, null);
}

// "E se eu ganhar/economizar R$X a mais por mês?" — mesma matemática pros
// dois casos: tanto faz se X é renda extra ou despesa evitada, o efeito no
// saldo é idêntico.
export function simulateExtraMonthly(startMonth, count, extra) {
  return project(startMonth, count, (events) => [...events, { tipo: 'receita', val: Number(extra) || 0 }]);
}

// "E se eu reduzir uma categoria em Y%?" — aplica o corte só nas despesas
// daquela categoria em cada mês projetado.
export function simulateReduceCategory(startMonth, count, categoria, pct) {
  const factor = 1 - (Number(pct) || 0) / 100;
  return project(startMonth, count, (events) => events.map((e) =>
    (e.tipo === 'despesa' && (e.cat || '').toLowerCase() === categoria.toLowerCase())
      ? { ...e, val: Math.max(0, e.val * factor) }
      : e
  ));
}

// "E se eu quitar uma dívida agora?" — remove as parcelas futuras pendentes
// daquela dívida específica de todos os meses projetados.
export function simulatePayOffDebt(startMonth, count, debtId) {
  return project(startMonth, count, (events) => events.filter((e) => !(e.origem === 'parcela' && e.refId?.dividaId === debtId)));
}

export function compareToBaseline(startMonth, count, scenarioMonths) {
  const base = baseline(startMonth, count);
  return scenarioMonths.map((m, i) => ({ ...m, baseline: base[i].closing, diff: m.closing - base[i].closing }));
}
