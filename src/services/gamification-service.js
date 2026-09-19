import { listTransactions } from '../repositories/transaction-repository.js';
import { listGoals } from '../repositories/goal-repository.js';
import { listBudgets, spentForCategory } from '../repositories/budget-repository.js';
import { listAccounts } from '../repositories/account-repository.js';
import { listAssets } from '../repositories/networth-repository.js';
import { listDebts, outstandingBalance } from '../repositories/debt-repository.js';
import { totalsForMonth } from './insight-service.js';
import { currentMonth } from '../utils/format.js';

// Conquistas discretas: cada uma é calculada ao vivo a partir dos dados
// reais (nunca uma data de "desbloqueio" fabricada). O objetivo é reforçar
// acompanhamento e educação, não virar jogo — por isso sem pontos, níveis
// ou recompensas artificiais, só uma lista de marcos alcançados.

function shiftMonth(yyyyMm, delta) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function buildAchievements() {
  const tx = listTransactions();
  const goals = listGoals();
  const budgets = listBudgets();
  const accountsBalance = listAccounts().reduce((a, c) => a + (c.saldo || 0), 0);
  const assetTotal = listAssets().reduce((a, p) => a + p.val, 0);
  const debts = listDebts();
  const month = currentMonth();

  const budgetsWithinLimit = budgets.length > 0 && budgets.every((b) => (b.val > 0 ? spentForCategory(b.cat, tx) / b.val : 0) <= 1);
  const last3 = [0, 1, 2].map((i) => shiftMonth(month, -i));
  const savingStreak = last3.every((m) => totalsForMonth(m).count > 0 && totalsForMonth(m).balance >= 0);
  const netWorth = assetTotal - outstandingBalance();

  return [
    { id: 'primeiro-mes', label: 'Primeiro mês organizado', done: tx.length > 0, hint: 'Registre sua primeira transação.' },
    { id: 'primeira-meta', label: 'Primeira meta criada', done: goals.length > 0, hint: 'Crie uma meta em Planejamento.' },
    { id: 'orcamento-cumprido', label: 'Orçamento do mês cumprido', done: budgetsWithinLimit, hint: 'Fique dentro do teto de todos os orçamentos definidos.' },
    { id: 'reserva-mil', label: 'Primeiros R$ 1.000 de reserva', done: accountsBalance >= 1000, hint: 'Acumule R$ 1.000 em saldo de contas.' },
    { id: 'divida-quitada', label: 'Primeira dívida quitada', done: debts.some((d) => d.status === 'quitada'), hint: 'Quite todas as parcelas de uma dívida.' },
    { id: 'streak-3-meses', label: '3 meses seguidos com saldo positivo', done: savingStreak, hint: 'Feche 3 meses seguidos com receitas acima das despesas.' },
    { id: 'patrimonio-positivo', label: 'Patrimônio líquido positivo', done: netWorth > 0, hint: 'Seus ativos superam suas dívidas em aberto.' }
  ];
}
