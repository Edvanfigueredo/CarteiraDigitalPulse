import { listTransactions } from '../repositories/transaction-repository.js';
import { listSnapshots } from '../repositories/networth-history-repository.js';

// Evolução de renda por ano — usa transações REAIS já lançadas (nunca o
// valor informado manualmente em Carreira, que é só um registro de cargo/
// empresa para contexto). Isso evita ter duas fontes divergentes de "renda".
export function incomeByYear() {
  const byYear = {};
  listTransactions().filter((t) => t.tipo === 'receita').forEach((t) => {
    const year = (t.date || '').slice(0, 4);
    if (!year) return;
    byYear[year] = (byYear[year] || 0) + t.val;
  });
  return Object.entries(byYear).sort(([a], [b]) => a.localeCompare(b)).map(([year, total]) => ({ year, income: total }));
}

export function expensesByYear() {
  const byYear = {};
  listTransactions().filter((t) => t.tipo === 'despesa').forEach((t) => {
    const year = (t.date || '').slice(0, 4);
    if (!year) return;
    byYear[year] = (byYear[year] || 0) + t.val;
  });
  return byYear;
}

// Patrimônio líquido só existe como série a partir dos snapshots mensais
// (seção 21) — aqui pegamos o último snapshot de cada ano disponível.
export function netWorthByYear() {
  const byYear = {};
  listSnapshots().forEach((s) => { byYear[s.month.slice(0, 4)] = s.value; });
  return byYear;
}

export function careerCorrelation() {
  const income = incomeByYear();
  const expenses = expensesByYear();
  const netWorth = netWorthByYear();
  return income.map(({ year, income: renda }) => ({
    year,
    renda,
    despesas: expenses[year] || 0,
    capacidadePoupanca: renda > 0 ? Math.round(((renda - (expenses[year] || 0)) / renda) * 100) : null,
    patrimonio: netWorth[year] ?? null
  }));
}
