import { listBudgets, spentForCategory } from '../repositories/budget-repository.js';
import { listTransactions } from '../repositories/transaction-repository.js';
import { listCategories } from '../repositories/category-repository.js';
import { listGoals } from '../repositories/goal-repository.js';
import { listAccounts } from '../repositories/account-repository.js';
import { outstandingBalance } from '../repositories/debt-repository.js';
import { totalsForMonth } from './insight-service.js';
import { currentMonth, clamp, percent } from '../utils/format.js';

// PULSE SCORE — indicador de ORGANIZAÇÃO financeira pessoal, 0 a 100.
// NÃO é um score de crédito e não deve ser lido como julgamento moral.
// Cada fator abaixo é calculado só a partir de dados que o usuário já
// cadastrou; quando falta dado suficiente, o fator fica neutro (60) em vez
// de inventar uma nota — e isso é dito explicitamente na explicação.

function shiftMonth(yyyyMm, delta) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function budgetFactor() {
  const budgets = listBudgets();
  if (!budgets.length) return { score: 60, detail: 'Nenhum orçamento definido ainda — nota neutra.' };
  const tx = listTransactions();
  const within = budgets.filter((b) => (b.val > 0 ? spentForCategory(b.cat, tx) / b.val : 0) <= 1).length;
  return { score: Math.round(percent(within, budgets.length)), detail: `${within} de ${budgets.length} orçamento(s) dentro do teto este mês.` };
}

function debtFactor() {
  const outstanding = outstandingBalance();
  if (outstanding === 0) return { score: 100, detail: 'Nenhuma dívida em aberto.' };
  const monthlyIncome = totalsForMonth(currentMonth()).income;
  if (!monthlyIncome) return { score: 50, detail: 'Há dívida em aberto, mas nenhuma receita registrada este mês para medir o comprometimento.' };
  const monthsOfIncome = outstanding / monthlyIncome;
  const score = clamp(Math.round(100 - monthsOfIncome * 15), 0, 100);
  return { score, detail: `Saldo devedor equivale a ${monthsOfIncome.toFixed(1)}x sua renda do mês.` };
}

function reserveFactor() {
  const balance = listAccounts().reduce((a, c) => a + (c.saldo || 0), 0);
  const essentialCats = new Set(listCategories().filter((c) => c.essencial).map((c) => c.nome.toLowerCase()));
  const { entries } = totalsForMonth(currentMonth());
  const essentialExpenses = entries
    .filter((t) => t.tipo === 'despesa' && essentialCats.has((t.cat || '').toLowerCase()))
    .reduce((a, t) => a + t.val, 0);

  if (!essentialCats.size || !essentialExpenses) {
    return { score: 60, detail: 'Marque categorias como "essencial" e registre despesas nelas para calcular sua reserva ideal.' };
  }
  const monthsCovered = balance / essentialExpenses;
  const score = clamp(Math.round((monthsCovered / 6) * 100), 0, 100); // meta de referência: 6 meses
  return { score, detail: `Seu saldo em contas cobre ${monthsCovered.toFixed(1)} mês(es) de despesas essenciais (meta de referência: 6).` };
}

function goalsFactor() {
  const goals = listGoals();
  if (!goals.length) return { score: 60, detail: 'Nenhuma meta cadastrada ainda — nota neutra.' };
  const avg = goals.reduce((a, g) => a + (g.target > 0 ? Math.min(g.current / g.target, 1) : 0), 0) / goals.length;
  return { score: Math.round(avg * 100), detail: `Progresso médio de ${Math.round(avg * 100)}% entre ${goals.length} meta(s).` };
}

function consistencyFactor() {
  const months = [0, 1, 2].map((i) => shiftMonth(currentMonth(), -i));
  const withData = months.filter((m) => totalsForMonth(m).count > 0);
  if (!withData.length) return { score: 60, detail: 'Ainda não há lançamentos suficientes nos últimos 3 meses — nota neutra.' };
  const positive = withData.filter((m) => totalsForMonth(m).balance >= 0).length;
  return { score: Math.round(percent(positive, withData.length)), detail: `${positive} de ${withData.length} mês(es) recentes com saldo positivo.` };
}

export function computePulseScore() {
  const factors = {
    orcamento: budgetFactor(),
    dividas: debtFactor(),
    reserva: reserveFactor(),
    metas: goalsFactor(),
    consistencia: consistencyFactor()
  };
  const total = Math.round(Object.values(factors).reduce((a, f) => a + f.score, 0) / Object.keys(factors).length);
  return { total, factors };
}
