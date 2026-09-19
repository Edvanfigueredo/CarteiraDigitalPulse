import { listMonths, createMonth } from '../../repositories/month-repository.js';
import { previousMonthSummary } from '../../services/insight-service.js';
import { money, monthLabel, currentMonth } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { showToast } from '../components/toast.js';

function groupByYear(months) {
  const byYear = {};
  months.forEach((m) => { const y = m.slice(0, 4); (byYear[y] = byYear[y] || []).push(m); });
  return byYear;
}

export function renderHistory(root) {
  const months = listMonths();
  const byYear = groupByYear(months);
  const summary = previousMonthSummary(currentMonth());

  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Seu mês anterior — ${escapeHtml(monthLabel(summary.month))}</h3></div>
      ${summary.count ? `
      <div class="grid-4">
        <div><p class="card-eyebrow">Receitas</p><p class="stat-value val-plus" style="font-size:1.1rem;">${money(summary.income)}</p></div>
        <div><p class="card-eyebrow">Despesas</p><p class="stat-value val-minus" style="font-size:1.1rem;">${money(summary.expenses)}</p></div>
        <div><p class="card-eyebrow">Resultado</p><p class="stat-value" style="font-size:1.1rem;">${money(summary.balance)}</p></div>
        <div><p class="card-eyebrow">Lançamentos</p><p class="stat-value" style="font-size:1.1rem;">${summary.count}</p></div>
      </div>
      <p class="text-muted" style="margin-top:12px;">
        ${summary.savingRate !== null ? `Taxa de economia: ${summary.savingRate}%. ` : ''}
        ${summary.topCategory ? `Maior categoria de gasto: ${escapeHtml(summary.topCategory)}. ` : ''}
        ${summary.evolution !== null ? `Despesas ${summary.evolution >= 0 ? 'subiram' : 'caíram'} ${Math.abs(summary.evolution)}% frente ao mês retrasado.` : ''}
      </p>` : '<p class="text-muted">Sem movimentações registradas no mês anterior.</p>'}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Criar novo mês</h3></div>
      <form id="month-form" class="form-grid">
        <div class="field"><label for="new-month">Mês (AAAA-MM)</label><input id="new-month" type="month" required /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">Criar mês</button></div>
      </form>
      <p class="text-muted" style="margin-top:8px;font-size:0.78rem;">Categorias, contas, cartões, orçamentos e metas já ficam disponíveis automaticamente em todos os meses. As transações nunca são copiadas — cada mês começa sem lançamentos.</p>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Histórico</h3></div>
      ${Object.keys(byYear).sort().reverse().map((year) => `
        <div style="margin-bottom:14px;">
          <p class="card-eyebrow" style="margin-bottom:8px;">${year}</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${byYear[year].map((m) => `<button class="btn btn-secondary btn-sm" type="button" data-month="${m}">${escapeHtml(monthLabel(m).split(' de')[0])}</button>`).join('')}
          </div>
        </div>`).join('')}
    </div>`;

  document.getElementById('month-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = document.getElementById('new-month').value;
    if (!value) return;
    await createMonth(value);
    showToast('Novo mês criado.', 'success');
    renderHistory(root);
  });

  root.querySelectorAll('[data-month]').forEach((btn) => btn.addEventListener('click', () => {
    showToast(`Filtre por ${monthLabel(btn.dataset.month)} na tela de Relatórios ou Transações.`);
  }));
}
