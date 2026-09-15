import { listAccounts } from '../../repositories/account-repository.js';
import { listBudgets, spentForCategory } from '../../repositories/budget-repository.js';
import { listGoals } from '../../repositories/goal-repository.js';
import { listTransactions } from '../../repositories/transaction-repository.js';
import { totalsForMonth, categoryBreakdown, evolutionSeries, buildInsights } from '../../services/insight-service.js';
import { money, percent, currentMonth, monthLabel } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { barIncomeExpense, doughnutCategories, lineEvolution } from '../components/charts.js';
import { navigate } from '../../core/router.js';

export function renderDashboard(root) {
  const month = currentMonth();
  const { income, expenses, balance, entries } = totalsForMonth(month);
  const accounts = listAccounts();
  const totalBalance = accounts.reduce((a, c) => a + (c.saldo || 0), 0);
  const budgets = listBudgets();
  const goals = listGoals();
  const insights = buildInsights(month);
  const allTx = listTransactions();
  const pending = entries.filter((t) => t.status === 'pendente').slice(0, 5);

  root.innerHTML = `
    <div class="grid-4">
      <div class="card"><p class="card-eyebrow">Saldo total em contas</p><h2 class="stat-value">${money(totalBalance)}</h2></div>
      <div class="card"><p class="card-eyebrow">Receitas do mês</p><h2 class="stat-value val-plus">${money(income)}</h2></div>
      <div class="card"><p class="card-eyebrow">Despesas do mês</p><h2 class="stat-value val-minus">${money(expenses)}</h2></div>
      <div class="card"><p class="card-eyebrow">Balanço líquido</p><h2 class="stat-value ${balance >= 0 ? 'val-plus' : 'val-minus'}">${money(balance)}</h2></div>
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
      <div class="card-header"><h3 class="card-title">Contas a pagar / receber</h3></div>
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
