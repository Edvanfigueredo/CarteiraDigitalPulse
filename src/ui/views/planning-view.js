import { listBudgets, addBudget, removeBudget, spentForCategory } from '../../repositories/budget-repository.js';
<<<<<<< HEAD
import { listGoals, addGoal, removeGoal, addContribution } from '../../repositories/goal-repository.js';
import { listCategories } from '../../repositories/category-repository.js';
import { listAccounts } from '../../repositories/account-repository.js';
import { listTransactions } from '../../repositories/transaction-repository.js';
import { projectedCompletionLabel, requiredMonthlyContribution } from '../../services/goal-service.js';
=======
import { listGoals, addGoal, removeGoal } from '../../repositories/goal-repository.js';
import { listCategories } from '../../repositories/category-repository.js';
import { listTransactions } from '../../repositories/transaction-repository.js';
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
import { money, percent } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { showToast } from '../components/toast.js';

<<<<<<< HEAD
const PRIORITY_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

function destinoOptions() {
  const contas = listAccounts().map((c) => `<option value="conta_${c.id}">${escapeHtml(c.nome)}</option>`);
  return contas.join('') || '<option value="">Nenhuma conta cadastrada</option>';
}

=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
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
<<<<<<< HEAD
        <div class="field"><label for="goal-categoria">Categoria</label><input id="goal-categoria" placeholder="Ex: Reserva, Viagem" /></div>
        <div class="field"><label for="goal-target">Valor alvo</label><input id="goal-target" type="number" step="0.01" required placeholder="0,00" /></div>
        <div class="field"><label for="goal-current">Valor já guardado</label><input id="goal-current" type="number" step="0.01" placeholder="0,00" /></div>
        <div class="field"><label for="goal-aporte">Aporte mensal planejado</label><input id="goal-aporte" type="number" step="0.01" placeholder="0,00" /></div>
        <div class="field"><label for="goal-prazo">Prazo (opcional)</label><input id="goal-prazo" type="month" /></div>
        <div class="field"><label for="goal-prioridade">Prioridade</label>
          <select id="goal-prioridade"><option value="alta">Alta</option><option value="media" selected>Média</option><option value="baixa">Baixa</option></select>
        </div>
        <div class="field"><label for="goal-conta">Conta associada</label><select id="goal-conta">${destinoOptions()}</select></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">+ Adicionar Meta</button></div>
      </form>
      ${goals.length ? goals.map((g) => renderGoalCard(g)).join('') : emptyStateHtml({ icon: 'fa-flag', title: 'Você ainda não possui metas', text: 'Crie sua primeira meta financeira.' })}
=======
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
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
    </div>`;

  document.getElementById('budget-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addBudget({ cat: document.getElementById('budget-cat').value, val: document.getElementById('budget-val').value });
    showToast('Orçamento definido.', 'success');
    renderPlanning(root);
  });
  document.getElementById('goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    await addGoal({
      desc: document.getElementById('goal-desc').value,
      categoria: document.getElementById('goal-categoria').value,
      target: document.getElementById('goal-target').value,
      current: document.getElementById('goal-current').value,
      aporteMensal: document.getElementById('goal-aporte').value,
      prazo: document.getElementById('goal-prazo').value,
      prioridade: document.getElementById('goal-prioridade').value,
      contaId: document.getElementById('goal-conta').value
    });
=======
    await addGoal({ desc: document.getElementById('goal-desc').value, target: document.getElementById('goal-target').value, current: document.getElementById('goal-current').value });
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
    showToast('Meta criada.', 'success');
    renderPlanning(root);
  });
  root.querySelectorAll('[data-remove-budget]').forEach((btn) => btn.addEventListener('click', async () => { await removeBudget(Number(btn.dataset.removeBudget)); renderPlanning(root); }));
  root.querySelectorAll('[data-remove-goal]').forEach((btn) => btn.addEventListener('click', async () => { await removeGoal(Number(btn.dataset.removeGoal)); renderPlanning(root); }));
<<<<<<< HEAD

  goals.forEach((g) => {
    const form = document.getElementById(`contrib-form-${g.id}`);
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById(`contrib-val-${g.id}`);
      await addContribution(g.id, input.value);
      showToast('Aporte registrado.', 'success');
      renderPlanning(root);
    });

    const simInput = document.getElementById(`sim-val-${g.id}`);
    simInput?.addEventListener('input', () => {
      const result = document.getElementById(`sim-result-${g.id}`);
      const val = Number(simInput.value);
      result.textContent = val > 0 ? `Com esse aporte: ${projectedCompletionLabel(g, val)}` : '';
    });
  });
}

function renderGoalCard(g) {
  const pct = g.target > 0 ? Math.min(percent(g.current, g.target), 100) : 0;
  const restante = Math.max(g.target - g.current, 0);
  const previsao = projectedCompletionLabel(g);
  const aporteNecessario = requiredMonthlyContribution(g);

  return `
    <div class="card" style="background:var(--bg-input);margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div>
          <p style="font-weight:700;">${escapeHtml(g.desc)} <span class="badge">${PRIORITY_LABEL[g.prioridade] || 'Média'}</span></p>
          <p class="text-muted" style="font-size:0.75rem;">${escapeHtml(g.categoria || 'Geral')}</p>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" data-remove-goal="${g.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="progress-row" style="margin-top:10px;">
        <div class="progress-labels"><span>${money(g.current)} / ${money(g.target)} (${pct}%)</span><span>Restam ${money(restante)}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:var(--accent-green)"></div></div>
      </div>
      <p style="font-size:0.8rem;margin-top:8px;">📅 Previsão de conclusão: <strong>${escapeHtml(previsao)}</strong></p>
      ${aporteNecessario !== null ? `<p style="font-size:0.8rem;">Para bater o prazo definido, aporte necessário: <strong>${money(aporteNecessario)}/mês</strong></p>` : ''}

      <form id="contrib-form-${g.id}" style="display:flex;gap:6px;margin-top:10px;">
        <input id="contrib-val-${g.id}" type="number" step="0.01" placeholder="Registrar aporte (R$)" style="flex:1;" />
        <button class="btn btn-secondary btn-sm" type="submit">Aportar</button>
      </form>

      <div style="margin-top:8px;">
        <input id="sim-val-${g.id}" type="number" step="0.01" placeholder="Simular: e se eu aportar R$...?" />
        <p id="sim-result-${g.id}" class="text-muted" style="font-size:0.78rem;margin-top:4px;"></p>
      </div>
    </div>`;
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
}
