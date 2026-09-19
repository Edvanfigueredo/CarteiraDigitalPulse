import { getMonthEvents } from './calendar-service.js';
import { listAccounts } from '../repositories/account-repository.js';
import { listDebts } from '../repositories/debt-repository.js';
import { money, monthLabel } from '../utils/format.js';

function shiftMonth(yyyyMm, delta) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Projeta os próximos `count` meses (incluindo o mês de partida) a partir do
// saldo atual das contas, somando/subtraindo tudo que o Calendário já sabe
// que vai acontecer (transações reais + parcelas de dívidas + recorrências).
// Não usa nenhuma suposição fora dos dados cadastrados.
export function projectMonths(startMonth, count) {
  const startBalance = listAccounts().reduce((a, c) => a + (c.saldo || 0), 0);
  let running = startBalance;
  const months = [];
  for (let i = 0; i < count; i++) {
    const month = shiftMonth(startMonth, i);
    const events = getMonthEvents(month);
    const income = events.filter((e) => e.tipo === 'receita').reduce((a, e) => a + e.val, 0);
    const expenses = events.filter((e) => e.tipo === 'despesa').reduce((a, e) => a + e.val, 0);
    running += income - expenses;
    months.push({ month, income, expenses, balance: income - expenses, closing: running });
  }
  return months;
}

// Explica a variação mês a mês olhando para dívidas cuja última parcela cai
// no mês anterior (motivo mais concreto e verificável) e, na ausência disso,
// para a diferença bruta de despesas projetadas.
export function explainVariations(months) {
  const debts = listDebts();
  return months.map((m, i) => {
    if (i === 0) return { ...m, explanation: null };
    const prev = months[i - 1];
    const diff = m.closing - prev.closing;
    const endingDebts = debts.filter((d) => {
      if (!d.parcelada) return false;
      const last = d.parcelas[d.parcelas.length - 1];
      return last?.vencimento?.startsWith(prev.month) && last.status !== 'paga';
    });

    let explanation = null;
    if (endingDebts.length) {
      const names = endingDebts.map((d) => d.nome).join(', ');
      explanation = `Seu saldo previsto ${diff >= 0 ? 'aumenta' : 'ainda cai'} porque a(s) última(s) parcela(s) de ${names} termina(m) em ${monthLabel(prev.month)}.`;
    } else if (Math.round(m.expenses) !== Math.round(prev.expenses)) {
      explanation = `Despesas projetadas ${m.expenses > prev.expenses ? 'sobem' : 'caem'} de ${money(prev.expenses)} para ${money(m.expenses)} em relação ao mês anterior.`;
    }
    return { ...m, explanation };
  });
}
