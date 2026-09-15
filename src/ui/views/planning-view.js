import { listBudgets, addBudget, removeBudget, spentForCategory } from '../../repositories/budget-repository.js';
import { listGoals, addGoal, removeGoal } from '../../repositories/goal-repository.js';
import { listCategories } from '../../repositories/category-repository.js';
import { listTransactions } from '../../repositories/transaction-repository.js';
import { money, percent } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { showToast } from '../components/toast.js';

export function renderPlanning(root) {
  const budgets = listBudgets();
  const goals = listGoals();
  const allTx = listTransactions();
  const expenseCats = listCategories().filter((c) => c.tipo === 'despesa');

  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Orçamento por Categoria</h3></div>
      <form id="budget-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="budget-cat">Categoria</label>
          <select id="budget-cat">${expenseCats.map((c) => `<option value="${escapeHtml(c.nome)}">${escapeHtml(c.nome)}</option>`).join('') || '<option value="Geral">Geral</option>'}</select>
        </div>
        <div class="field"><label for="budget-val">Teto mensal</label><input id="budget-val" type="number" step="0.01" required placeholder="0,00" /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">Definir Teto</button></div>
      </form>
      ${budgets.length ? budgets.map((b) => {
        const spent = spentForCategory(b.cat, allTx);
        const pct = b.val > 0 ? Math.min(percent(spent, b.val), 100) : 0;
        return `<div class="progress-row" style="margin-bottom:14px;">
          <div class="progress-labels"><span>${escapeHtml(b.cat)}</span><span>${money(spent)} de ${money(b.val)}</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${pct > 80 ? 'var(--accent-red)' : 'var(--primary)'}"></div></div>
          <button class="btn btn-ghost btn-sm" type="button" data-remove-budget="${b.id}" style="align-self:flex-end;">Remover</button>
        </div>`;
      }).join('') : emptyStateHtml({ icon: 'fa-bullseye', title: 'Nenhum orçamento definido', text: 'Defina um teto de gastos por categoria.' })}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Metas Financeiras</h3></div>
      <form id="goal-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="goal-desc">Descrição da meta</label><input id="goal-desc" required placeholder="Ex: Reserva de emergência" /></div>
        <div class="field"><label for="goal-target">Valor alvo</label><input id="goal-target" type="number" step="0.01" required placeholder="0,00" /></div>
        <div class="field"><label for="goal-current">Valor já guardado</label><input id="goal-current" type="number" step="0.01" placeholder="0,00" /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">+ Adicionar Meta</button></div>
      </form>
      ${goals.length ? goals.map((g) => {
        const pct = g.target > 0 ? Math.min(percent(g.current, g.target), 100) : 0;
        return `<div class="progress-row" style="margin-bottom:14px;">
          <div class="progress-labels"><span>${escapeHtml(g.desc)}</span><span>${money(g.current)} / ${money(g.target)}</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:var(--accent-green)"></div></div>
          <button class="btn btn-ghost btn-sm" type="button" data-remove-goal="${g.id}" style="align-self:flex-end;">Remover</button>
        </div>`;
      }).join('') : emptyStateHtml({ icon: 'fa-flag', title: 'Você ainda não possui metas', text: 'Crie sua primeira meta financeira.' })}
    </div>`;

  document.getElementById('budget-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addBudget({ cat: document.getElementById('budget-cat').value, val: document.getElementById('budget-val').value });
    showToast('Orçamento definido.', 'success');
    renderPlanning(root);
  });
  document.getElementById('goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addGoal({ desc: document.getElementById('goal-desc').value, target: document.getElementById('goal-target').value, current: document.getElementById('goal-current').value });
    showToast('Meta criada.', 'success');
    renderPlanning(root);
  });
  root.querySelectorAll('[data-remove-budget]').forEach((btn) => btn.addEventListener('click', async () => { await removeBudget(Number(btn.dataset.removeBudget)); renderPlanning(root); }));
  root.querySelectorAll('[data-remove-goal]').forEach((btn) => btn.addEventListener('click', async () => { await removeGoal(Number(btn.dataset.removeGoal)); renderPlanning(root); }));
}
