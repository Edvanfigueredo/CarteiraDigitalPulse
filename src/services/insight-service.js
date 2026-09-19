import { listTransactions } from '../repositories/transaction-repository.js';
import { percent } from '../utils/format.js';

export function totalsForMonth(yyyyMm) {
  const entries = listTransactions().filter((t) => !yyyyMm || (t.date || '').startsWith(yyyyMm));
  const income = entries.filter((t) => t.tipo === 'receita').reduce((a, t) => a + (Number(t.val) || 0), 0);
  const expenses = entries.filter((t) => t.tipo === 'despesa').reduce((a, t) => a + (Number(t.val) || 0), 0);
  return { entries, income, expenses, balance: income - expenses, count: entries.length };
}

export function categoryBreakdown(entries, tipo = 'despesa') {
  const map = {};
  entries.filter((t) => t.tipo === tipo).forEach((t) => {
    const cat = t.cat || 'Geral';
    map[cat] = (map[cat] || 0) + (Number(t.val) || 0);
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function shiftMonth(yyyyMm, offset) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function lastNMonths(yyyyMm, n) {
  const months = [];
  for (let i = n - 1; i >= 0; i--) months.push(shiftMonth(yyyyMm, -i));
  return months;
}

export function evolutionSeries(yyyyMm, n = 6) {
  return lastNMonths(yyyyMm, n).map((m) => ({ month: m, ...totalsForMonth(m) }));
}

// Insights determinísticos: nunca inventam informação, apenas leem os dados existentes.
export function buildInsights(yyyyMm) {
  const current = totalsForMonth(yyyyMm);
  const insights = [];

  if (!current.entries.length) {
    insights.push({ type: 'info', text: 'Registre receitas e despesas para receber leituras baseadas nos seus dados.' });
    return insights;
  }

  const topCat = categoryBreakdown(current.entries, 'despesa')[0];
  if (topCat) {
    const [name, value] = topCat;
    insights.push({ type: 'info', text: `${name} representa ${percent(value, current.expenses)}% das despesas do período.` });
  }

  const previous = totalsForMonth(shiftMonth(yyyyMm, -1));
  if (previous.expenses > 0) {
    const diff = percent(current.expenses - previous.expenses, previous.expenses);
    if (diff !== 0) {
      insights.push({
        type: diff > 0 ? 'warning' : 'success',
        text: `Suas despesas ${diff > 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(diff)}% em relação ao mês anterior.`
      });
    }
  }

  if (current.income > 0) {
    const rate = percent(current.balance, current.income);
    insights.push({
      type: rate >= 0 ? 'success' : 'warning',
      text: rate >= 0
        ? `Você conseguiu guardar ${rate}% da renda neste período.`
        : `As despesas superaram as receitas em ${Math.abs(rate)}% da renda.`
    });
  } else {
    insights.push({ type: 'info', text: 'Registre uma receita para calcular a capacidade de poupança.' });
  }

  return insights;
}

export function previousMonthSummary(currentYyyyMm) {
  const prevMonth = shiftMonth(currentYyyyMm, -1);
  const prevPrevMonth = shiftMonth(currentYyyyMm, -2);
  const prev = totalsForMonth(prevMonth);
  const prevPrev = totalsForMonth(prevPrevMonth);
  const topCat = categoryBreakdown(prev.entries, 'despesa')[0];
  const evolution = prevPrev.expenses > 0 ? percent(prev.expenses - prevPrev.expenses, prevPrev.expenses) : null;
  return {
    month: prevMonth,
    income: prev.income,
    expenses: prev.expenses,
    balance: prev.balance,
    savingRate: prev.income > 0 ? percent(prev.balance, prev.income) : null,
    topCategory: topCat ? topCat[0] : null,
    count: prev.count,
    evolution
  };
}
