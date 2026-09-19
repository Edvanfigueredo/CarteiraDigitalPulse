import { listAccounts } from '../../repositories/account-repository.js';
import { listBudgets, spentForCategory } from '../../repositories/budget-repository.js';
import { listGoals } from '../../repositories/goal-repository.js';
import { listTransactions } from '../../repositories/transaction-repository.js';
<<<<<<< HEAD
import { listAssets } from '../../repositories/networth-repository.js';
import { outstandingBalance } from '../../repositories/debt-repository.js';
import { totalsForMonth, categoryBreakdown, evolutionSeries, buildInsights } from '../../services/insight-service.js';
import { getMonthEvents } from '../../services/calendar-service.js';
import { computePulseScore } from '../../services/score-service.js';
import { getUpcomingAlerts } from '../../services/alert-service.js';
=======
import { totalsForMonth, categoryBreakdown, evolutionSeries, buildInsights } from '../../services/insight-service.js';
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
import { money, percent, currentMonth, monthLabel } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { barIncomeExpense, doughnutCategories, lineEvolution } from '../components/charts.js';
import { navigate } from '../../core/router.js';

<<<<<<< HEAD
const SCORE_FACTOR_LABELS = { orcamento: 'Orçamento', dividas: 'Dívidas', reserva: 'Reserva', metas: 'Metas', consistencia: 'Consistência' };

function scoreColor(score) {
  if (score >= 75) return 'var(--accent-green)';
  if (score >= 50) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
export function renderDashboard(root) {
  const month = currentMonth();
  const { income, expenses, balance, entries } = totalsForMonth(month);
  const accounts = listAccounts();
  const totalBalance = accounts.reduce((a, c) => a + (c.saldo || 0), 0);
  const budgets = listBudgets();
  const goals = listGoals();
  const insights = buildInsights(month);
  const allTx = listTransactions();
<<<<<<< HEAD
  const pulseScore = computePulseScore();
  const alerts = getUpcomingAlerts();
  const netWorth = listAssets().reduce((a, p) => a + p.val, 0) - outstandingBalance();
  // Fechamento previsto do mês: saldo atual + tudo que ainda vai
  // acontecer (receitas/despesas pendentes) até o fim do mês corrente —
  // mesma fonte de dados do Calendário e da Previsão (seção 27, item 5).
  const monthEvents = getMonthEvents(month);
  const pendingThisMonth = monthEvents.filter((e) => e.status !== 'pago');
  const closingForecast = totalBalance
    + pendingThisMonth.filter((e) => e.tipo === 'receita').reduce((a, e) => a + e.val, 0)
    - pendingThisMonth.filter((e) => e.tipo === 'despesa').reduce((a, e) => a + e.val, 0);
  // Une pendências reais (transações lançadas como "pendente") com parcelas
  // de dívidas e recorrências projetadas para o mês — a mesma fonte que
  // alimenta o Calendário, para os dois nunca mostrarem números diferentes.
  const pending = monthEvents.filter((e) => e.status !== 'pago').slice(0, 6);

  root.innerHTML = `
    <div class="grid-4">
      <div class="card"><p class="card-eyebrow">Patrimônio líquido</p><h2 class="stat-value ${netWorth >= 0 ? 'val-plus' : 'val-minus'}">${money(netWorth)}</h2></div>
      <div class="card"><p class="card-eyebrow">Saldo em contas</p><h2 class="stat-value">${money(totalBalance)}</h2></div>
      <div class="card"><p class="card-eyebrow">Receitas do mês</p><h2 class="stat-value val-plus">${money(income)}</h2></div>
      <div class="card"><p class="card-eyebrow">Despesas do mês</p><h2 class="stat-value val-minus">${money(expenses)}</h2></div>
      <div class="card"><p class="card-eyebrow">Balanço líquido</p><h2 class="stat-value ${balance >= 0 ? 'val-plus' : 'val-minus'}">${money(balance)}</h2></div>
      <div class="card"><p class="card-eyebrow">Previsão de fechamento</p><h2 class="stat-value ${closingForecast >= 0 ? 'val-plus' : 'val-minus'}">${money(closingForecast)}</h2></div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Pulse Score</h3>
          <p class="text-muted" style="font-size:0.72rem;">Indicador de organização financeira — não é score de crédito.</p>
        </div>
        <h2 class="stat-value" style="color:${scoreColor(pulseScore.total)};font-size:2rem;">${pulseScore.total}</h2>
      </div>
      <div class="grid-4">
        ${Object.entries(pulseScore.factors).map(([key, f]) => `
          <div>
            <div class="progress-labels" style="margin-bottom:4px;"><span>${SCORE_FACTOR_LABELS[key]}</span><span>${f.score}</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${f.score}%;background:${scoreColor(f.score)}"></div></div>
          </div>`).join('')}
      </div>
      <ul style="padding-left:18px;margin-top:12px;display:flex;flex-direction:column;gap:4px;font-size:0.78rem;" class="text-muted">
        ${Object.entries(pulseScore.factors).map(([key, f]) => `<li><strong style="color:var(--text);">${SCORE_FACTOR_LABELS[key]}:</strong> ${escapeHtml(f.detail)}</li>`).join('')}
      </ul>
    </div>

    ${alerts.length ? `
    <div class="card" style="border-color:var(--accent-amber);">
      <div class="card-header"><h3 class="card-title">⚠️ Atenção</h3></div>
      <ul style="padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:0.85rem;">
        ${alerts.map((a) => `<li>${escapeHtml(a.text)}</li>`).join('')}
      </ul>
    </div>` : ''}

    <div class="card">
      <div class="card-header"><h3 class="card-title">Saúde Financeira</h3><button class="btn btn-ghost btn-sm" type="button" data-goto="saude">Ver detalhes</button></div>
      <p class="text-muted" style="font-size:0.82rem;">Indicadores de reserva, dívidas, comprometimento da renda e poupança, todos explicados — acesse a tela completa para o detalhamento.</p>
=======
  const pending = entries.filter((t) => t.status === 'pendente').slice(0, 5);

  root.innerHTML = `
    <div class="grid-4">
      <div class="card"><p class="card-eyebrow">Saldo total em contas</p><h2 class="stat-value">${money(totalBalance)}</h2></div>
      <div class="card"><p class="card-eyebrow">Receitas do mês</p><h2 class="stat-value val-plus">${money(income)}</h2></div>
      <div class="card"><p class="card-eyebrow">Despesas do mês</p><h2 class="stat-value val-minus">${money(expenses)}</h2></div>
      <div class="card"><p class="card-eyebrow">Balanço líquido</p><h2 class="stat-value ${balance >= 0 ? 'val-plus' : 'val-minus'}">${money(balance)}</h2></div>
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
    </div>

    ${entries.length === 0 ? `
      <div class="card">${emptyStateHtml({
        icon: 'fa-wallet',
        title: allTx.length === 0 ? 'Você ainda não possui transações' : `Nenhum lançamento em ${monthLabel(month)}`,
        text: allTx.length === 0
          ? 'Adicione sua primeira receita ou despesa para começar a acompanhar sua vida financeira.'
          : 'Você já tem lançamentos em outros meses. Adicione um lançamento para este mês ou consulte o histórico.',
        actionLabel: 'Adicionar lançamento', actionAttr: 'data-goto="transacoes"'
      })}</div>` : `
      <div class="grid-2">
        <div class="card"><div class="card-header"><h3 class="card-title">Fluxo financeiro (${escapeHtml(monthLabel(month))})</h3></div><div class="chart-wrap"><canvas id="chart-flow"></canvas></div></div>
        <div class="card"><div class="card-header"><h3 class="card-title">Despesas por categoria</h3></div><div class="chart-wrap"><canvas id="chart-cats"></canvas></div></div>
      </div>
      <div class="card"><div class="card-header"><h3 class="card-title">Evolução — últimos 6 meses</h3></div><div class="chart-wrap"><canvas id="chart-evolution"></canvas></div></div>
    `}

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h3 class="card-title">Orçamentos</h3><button class="btn btn-ghost btn-sm" type="button" data-goto="planejamento">Gerenciar</button></div>
        ${budgets.length ? budgets.map((b) => {
          const spent = spentForCategory(b.cat, allTx);
          const pct = b.val > 0 ? Math.min(percent(spent, b.val), 100) : 0;
          return `<div class="progress-row" style="margin-bottom:12px;">
            <div class="progress-labels"><span>${escapeHtml(b.cat)}</span><span>${money(spent)} de ${money(b.val)} (${pct}%)</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${pct > 80 ? 'var(--accent-red)' : 'var(--primary)'}"></div></div>
          </div>`;
        }).join('') : emptyStateHtml({ icon: 'fa-bullseye', title: 'Nenhum orçamento definido', text: 'Defina um teto de gastos por categoria para acompanhar aqui.', actionLabel: 'Criar orçamento', actionAttr: 'data-goto="planejamento"' })}
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">Metas</h3><button class="btn btn-ghost btn-sm" type="button" data-goto="planejamento">Gerenciar</button></div>
        ${goals.length ? goals.map((g) => {
          const pct = g.target > 0 ? Math.min(percent(g.current, g.target), 100) : 0;
          return `<div class="progress-row" style="margin-bottom:12px;">
            <div class="progress-labels"><span>${escapeHtml(g.desc)}</span><span>${money(g.current)} / ${money(g.target)} (${pct}%)</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:var(--accent-green)"></div></div>
          </div>`;
        }).join('') : emptyStateHtml({ icon: 'fa-flag', title: 'Você ainda não possui metas', text: 'Crie sua primeira meta financeira.', actionLabel: 'Criar meta', actionAttr: 'data-goto="planejamento"' })}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Aprenda com seus números</h3></div>
      <ul style="padding-left:18px;display:flex;flex-direction:column;gap:8px;">
        ${insights.map((i) => `<li>${escapeHtml(i.text)}</li>`).join('')}
      </ul>
    </div>

    ${pending.length ? `
    <div class="card">
<<<<<<< HEAD
      <div class="card-header"><h3 class="card-title">Próximos compromissos</h3><button class="btn btn-ghost btn-sm" type="button" data-goto="calendario">Ver calendário</button></div>
=======
      <div class="card-header"><h3 class="card-title">Contas a pagar / receber</h3></div>
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
      <div class="table-wrap"><table><thead><tr><th>Vencimento</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>
        ${pending.map((t) => `<tr>
          <td data-label="Vencimento">${escapeHtml(t.date)}</td>
          <td data-label="Descrição">${escapeHtml(t.desc)}</td>
          <td data-label="Tipo"><span class="badge">${escapeHtml(t.tipo)}</span></td>
          <td data-label="Valor" class="${t.tipo === 'receita' ? 'val-plus' : 'val-minus'}">${money(t.val)}</td>
        </tr>`).join('')}
      </tbody></table></div>
    </div>` : ''}
  `;

  root.querySelectorAll('[data-goto]').forEach((btn) => btn.addEventListener('click', () => navigate(btn.dataset.goto)));

  if (entries.length) {
    barIncomeExpense('chart-flow', income, expenses);
    const [labels, data] = splitEntries(categoryBreakdown(entries, 'despesa'));
    doughnutCategories('chart-cats', labels, data);
    const series = evolutionSeries(month, 6);
    lineEvolution('chart-evolution', series.map((s) => monthLabel(s.month).split(' de')[0]), series.map((s) => s.income), series.map((s) => s.expenses));
  }
}

function splitEntries(pairs) {
  return [pairs.map((p) => p[0]), pairs.map((p) => p[1])];
}
