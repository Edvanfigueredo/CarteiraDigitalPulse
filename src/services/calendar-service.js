import { listTransactions } from '../repositories/transaction-repository.js';
import { pendingInstallments } from '../repositories/debt-repository.js';
import { listActiveRecurringIncomes, listActiveRecurringExpenses } from '../repositories/recurring-repository.js';
import { monthRange, recurringIncomeDateForMonth, recurringExpenseDateForMonth } from '../utils/dates.js';

// Evita mostrar duas vezes a mesma coisa: se já existe uma transação real
// com a mesma data/descrição/valor, a ocorrência projetada (recorrência ou
// parcela) não entra — a transação real sempre tem prioridade, porque é o
// que de fato aconteceu (ex: usuário já lançou o salário manualmente).
function alreadyRecorded(existing, date, desc, val) {
  return existing.some((t) => t.date === date && Math.abs(t.val - val) < 0.005 && (t.desc || '').toLowerCase().includes(String(desc).toLowerCase().slice(0, 12)));
}

export function getMonthEvents(yyyyMm) {
  const { start, end } = monthRange(yyyyMm);
  const realTx = listTransactions().filter((t) => t.date >= start && t.date <= end);

  const events = realTx.map((t) => ({
    date: t.date, tipo: t.tipo, desc: t.desc, val: t.val, cat: t.cat || null,
    status: t.status === 'pago' ? 'pago' : 'pendente',
    origem: 'transacao', fixa: t.tag === 'Dívida', refId: t.id
  }));

  pendingInstallments().forEach((p) => {
    if (!p.vencimento || p.vencimento < start || p.vencimento > end) return;
    if (alreadyRecorded(realTx, p.vencimento, p.dividaNome, p.valor)) return;
    events.push({
      date: p.vencimento, tipo: 'despesa', desc: `${p.dividaNome} (parcela ${p.numero})`, val: p.valor, cat: p.categoria || null,
      status: 'projetado', origem: 'parcela', fixa: true, refId: { dividaId: p.dividaId, numero: p.numero }
    });
  });

  listActiveRecurringIncomes().forEach((r) => {
    const date = recurringIncomeDateForMonth(r, yyyyMm);
    if (alreadyRecorded(realTx, date, r.desc, r.val)) return;
    events.push({ date, tipo: 'receita', desc: r.desc, val: r.val, cat: null, status: 'projetado', origem: 'renda_recorrente', fixa: true, refId: r.id });
  });

  listActiveRecurringExpenses().forEach((r) => {
    const date = recurringExpenseDateForMonth(r, yyyyMm);
    if (alreadyRecorded(realTx, date, r.desc, r.val)) return;
    events.push({ date, tipo: 'despesa', desc: r.desc, val: r.val, cat: r.categoria || null, status: 'projetado', origem: 'despesa_recorrente', fixa: true, refId: r.id });
  });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function groupEventsByDay(events) {
  const map = {};
  events.forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
  return map;
}

export function monthTotals(events) {
  const entradas = events.filter((e) => e.tipo === 'receita').reduce((a, e) => a + e.val, 0);
  const saidas = events.filter((e) => e.tipo === 'despesa').reduce((a, e) => a + e.val, 0);
  return { entradas, saidas, saldo: entradas - saidas };
}
