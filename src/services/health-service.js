import { getMonthEvents } from './calendar-service.js';
import { listAccounts } from '../repositories/account-repository.js';
import { listGoals } from '../repositories/goal-repository.js';
import { outstandingBalance } from '../repositories/debt-repository.js';
import { listSnapshots } from '../repositories/networth-history-repository.js';
import { currentMonth, percent, clamp } from '../utils/format.js';

// Indicadores de saúde financeira — cada um sempre acompanhado de uma
// explicação em texto (nunca só a barra), como pedido na seção 18.

export function fixedVsVariable(yyyyMm = currentMonth()) {
  const expenses = getMonthEvents(yyyyMm).filter((e) => e.tipo === 'despesa');
  const fixas = expenses.filter((e) => e.fixa).reduce((a, e) => a + e.val, 0);
  const variaveis = expenses.filter((e) => !e.fixa).reduce((a, e) => a + e.val, 0);
  return { fixas, variaveis, total: fixas + variaveis };
}

export function incomeCommitment(yyyyMm = currentMonth()) {
  const events = getMonthEvents(yyyyMm);
  const income = events.filter((e) => e.tipo === 'receita').reduce((a, e) => a + e.val, 0);
  const committed = events.filter((e) => e.tipo === 'despesa' && e.fixa).reduce((a, e) => a + e.val, 0);
  return { income, committed, pct: income > 0 ? percent(committed, income) : null };
}

export function savingsCapacity(yyyyMm = currentMonth()) {
  const events = getMonthEvents(yyyyMm);
  const income = events.filter((e) => e.tipo === 'receita').reduce((a, e) => a + e.val, 0);
  const expenses = events.filter((e) => e.tipo === 'despesa').reduce((a, e) => a + e.val, 0);
  return { rate: income > 0 ? percent(income - expenses, income) : null, income, expenses };
}

export function netWorthTrend() {
  const snapshots = listSnapshots();
  if (snapshots.length < 2) return { trend: null, diffPct: null };
  const prev = snapshots[snapshots.length - 2].value;
  const last = snapshots[snapshots.length - 1].value;
  if (prev === 0) return { trend: last > 0 ? 'subida' : 'estável', diffPct: null };
  const diffPct = percent(last - prev, Math.abs(prev));
  return { trend: diffPct > 0 ? 'subida' : diffPct < 0 ? 'queda' : 'estável', diffPct };
}

function reserveMonths() {
  const balance = listAccounts().reduce((a, c) => a + (c.saldo || 0), 0);
  const { fixas } = fixedVsVariable();
  if (!fixas) return null;
  return balance / fixas;
}

export function buildHealthIndicators() {
  const { fixas, variaveis, total } = fixedVsVariable();
  const commitment = incomeCommitment();
  const savings = savingsCapacity();
  const trend = netWorthTrend();
  const months = reserveMonths();
  const goals = listGoals();
  const avgGoalProgress = goals.length ? Math.round(goals.reduce((a, g) => a + (g.target > 0 ? Math.min(g.current / g.target, 1) : 0), 0) / goals.length * 100) : null;
  const debt = outstandingBalance();

  return [
    {
      key: 'reserva',
      label: 'Reserva de emergência',
      score: months === null ? null : clamp(Math.round((months / 6) * 100), 0, 100),
      text: months === null
        ? 'Registre despesas para calcular quantos meses sua reserva cobre.'
        : `Seu saldo em contas cobre ${months.toFixed(1)} mês(es) de despesas fixas (referência: 6 meses).`
    },
    {
      key: 'fixas_variaveis',
      label: 'Despesas fixas vs. variáveis',
      score: total > 0 ? Math.round(percent(fixas, total)) : null,
      text: total > 0
        ? `Este mês: ${percent(fixas, total)}% fixas (R$ recorrentes/parcelas) e ${percent(variaveis, total)}% variáveis.`
        : 'Ainda não há despesas neste mês para essa análise.'
    },
    {
      key: 'dividas',
      label: 'Dívidas em aberto',
      score: debt === 0 ? 100 : null,
      text: debt === 0 ? 'Nenhuma dívida em aberto.' : `Saldo devedor total: dívidas ainda pendentes de quitação.`
    },
    {
      key: 'comprometimento',
      label: 'Comprometimento da renda',
      score: commitment.pct === null ? null : clamp(100 - commitment.pct, 0, 100),
      text: commitment.pct === null
        ? 'Sem receita registrada este mês para calcular o comprometimento.'
        : `${commitment.pct}% da renda do mês está comprometida com despesas fixas e parcelas.`
    },
    {
      key: 'poupanca',
      label: 'Capacidade de poupança',
      score: savings.rate === null ? null : clamp(savings.rate, 0, 100),
      text: savings.rate === null
        ? 'Sem receita registrada este mês para calcular a taxa de poupança.'
        : `Taxa de poupança do mês: ${savings.rate}%.`
    },
    {
      key: 'metas',
      label: 'Cumprimento de metas',
      score: avgGoalProgress,
      text: avgGoalProgress === null ? 'Nenhuma meta cadastrada ainda.' : `Progresso médio de ${avgGoalProgress}% entre suas metas.`
    },
    {
      key: 'patrimonio',
      label: 'Evolução patrimonial',
      score: null,
      text: trend.trend === null
        ? 'Ainda não há histórico suficiente (visite Bens & Dívidas em mais de um mês).'
        : `Seu patrimônio líquido está em ${trend.trend}${trend.diffPct !== null ? ` (${trend.diffPct > 0 ? '+' : ''}${trend.diffPct}% desde o último registro)` : ''}.`
    }
  ];
}
