import { totalsForMonth, categoryBreakdown } from './insight-service.js';
import { listDebts, outstandingBalance } from '../repositories/debt-repository.js';
import { listGoals } from '../repositories/goal-repository.js';
import { listAssets } from '../repositories/networth-repository.js';
import { listAccounts } from '../repositories/account-repository.js';
import { buildAchievements } from './gamification-service.js';

export function buildAnnualReport(year) {
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  const monthly = months.map((m) => ({ month: m, ...totalsForMonth(m) }));

  const income = monthly.reduce((a, m) => a + m.income, 0);
  const expenses = monthly.reduce((a, m) => a + m.expenses, 0);
  const allEntriesOfYear = monthly.flatMap((m) => m.entries);
  const topCategories = categoryBreakdown(allEntriesOfYear, 'despesa').slice(0, 5);

  const debtsClosedThisYear = listDebts().filter((d) => {
    if (d.status !== 'quitada') return false;
    const lastPaid = d.parcelas[d.parcelas.length - 1]?.dataPagamento;
    return lastPaid?.startsWith(String(year));
  }).length;

  const goalsCompleted = listGoals().filter((g) => g.target > 0 && g.current >= g.target).length;

  const assetTotal = listAssets().reduce((a, p) => a + p.val, 0);
  const netWorth = assetTotal - outstandingBalance();
  const achievements = buildAchievements().filter((a) => a.done);

  return {
    year, income, expenses, economia: income - expenses,
    monthly, topCategories, debtsClosedThisYear, goalsCompleted,
    netWorth, accountsBalance: listAccounts().reduce((a, c) => a + (c.saldo || 0), 0),
    achievements
  };
}
