import { projectMonths, explainVariations } from '../../services/forecast-service.js';
import { simulateExtraMonthly, simulateReduceCategory, simulatePayOffDebt, compareToBaseline } from '../../services/simulator-service.js';
import { listCategories } from '../../repositories/category-repository.js';
import { listDebts } from '../../repositories/debt-repository.js';
import { lineForecast } from '../components/charts.js';
import { money, monthLabel, currentMonth } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';

let horizon = 3;
let scenario = 'renda';
let simResult = null;

const SCENARIOS = [
  { id: 'renda', label: 'Ganhar mais por mês' },
  { id: 'economia', label: 'Economizar por mês' },
  { id: 'categoria', label: 'Reduzir uma categoria' },
  { id: 'quitar', label: 'Quitar uma dívida' }
];

export function renderForecast(root) {
  const months = explainVariations(projectMonths(currentMonth(), horizon));
  const categorias = listCategories().filter((c) => c.tipo === 'despesa');
  const debts = listDebts().filter((d) => d.status !== 'quitada');

  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Previsão Financeira</h3>
        <div style="display:flex;gap:6px;">
          ${[3, 6, 12].map((n) => `<button class="btn btn-sm ${horizon === n ? 'btn-primary' : 'btn-secondary'}" type="button" data-horizon="${n}">${n} meses</button>`).join('')}
        </div>
      </div>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:12px;">Projeção a partir do saldo atual das suas contas, somando receitas e despesas já cadastradas (transações, parcelas de dívidas e recorrências). Não considera gastos que ainda não existem no sistema.</p>
      <div class="chart-wrap"><canvas id="chart-forecast"></canvas></div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Mês a mês</h3></div>
      ${months.map((m) => `
        <div class="card" style="background:var(--bg-input);margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <p style="font-weight:700;text-transform:capitalize;">${escapeHtml(monthLabel(m.month))}</p>
            <p class="${m.closing >= 0 ? 'val-plus' : 'val-minus'}" style="font-weight:800;">${money(m.closing)}</p>
          </div>
          <p class="text-muted" style="font-size:0.78rem;margin-top:4px;">Receitas: ${money(m.income)} · Despesas: ${money(m.expenses)}</p>
          ${m.explanation ? `<p style="font-size:0.8rem;margin-top:6px;">${escapeHtml(m.explanation)}</p>` : ''}
        </div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Simulador "E se...?"</h3></div>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:12px;">Simulação hipotética — não altera nenhum dado real. Compara com a previsão de ${horizon} meses acima.</p>
      <div class="import-type-grid" style="margin-bottom:14px;">
        ${SCENARIOS.map((s) => `<button class="import-type-card${scenario === s.id ? ' selected' : ''}" type="button" data-scenario="${s.id}"><span>${s.label}</span></button>`).join('')}
      </div>

      <div class="form-grid" style="margin-bottom:14px;">
        ${scenario === 'renda' || scenario === 'economia' ? `
          <div class="field"><label for="sim-valor">Valor mensal (R$)</label><input id="sim-valor" type="number" step="0.01" placeholder="Ex: 300" /></div>` : ''}
        ${scenario === 'categoria' ? `
          <div class="field"><label for="sim-categoria">Categoria</label><select id="sim-categoria">${categorias.map((c) => `<option value="${escapeHtml(c.nome)}">${escapeHtml(c.nome)}</option>`).join('') || '<option value="">Nenhuma categoria de despesa</option>'}</select></div>
          <div class="field"><label for="sim-pct">Redução (%)</label><input id="sim-pct" type="number" min="0" max="100" placeholder="Ex: 20" /></div>` : ''}
        ${scenario === 'quitar' ? `
          <div class="field"><label for="sim-divida">Dívida</label><select id="sim-divida">${debts.map((d) => `<option value="${d.id}">${escapeHtml(d.nome)}</option>`).join('') || '<option value="">Nenhuma dívida em aberto</option>'}</select></div>` : ''}
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" id="btn-simulate" type="button">Simular</button></div>
      </div>

      ${simResult ? `
        <div class="table-wrap"><table><thead><tr><th>Mês</th><th>Saldo real</th><th>Saldo simulado</th><th>Diferença</th></tr></thead><tbody>
          ${simResult.map((m) => `<tr>
            <td data-label="Mês">${escapeHtml(monthLabel(m.month).split(' de')[0])}</td>
            <td data-label="Saldo real">${money(m.baseline)}</td>
            <td data-label="Saldo simulado">${money(m.closing)}</td>
            <td data-label="Diferença" class="${m.diff >= 0 ? 'val-plus' : 'val-minus'}">${m.diff >= 0 ? '+' : ''}${money(m.diff)}</td>
          </tr>`).join('')}
        </tbody></table></div>` : ''}
    </div>`;

  root.querySelectorAll('[data-horizon]').forEach((btn) => btn.addEventListener('click', () => {
    horizon = Number(btn.dataset.horizon);
    simResult = null;
    renderForecast(root);
  }));

  root.querySelectorAll('[data-scenario]').forEach((btn) => btn.addEventListener('click', () => {
    scenario = btn.dataset.scenario;
    simResult = null;
    renderForecast(root);
  }));

  document.getElementById('btn-simulate').addEventListener('click', () => {
    const start = currentMonth();
    let scenarioMonths;
    if (scenario === 'renda' || scenario === 'economia') {
      const valor = Number(document.getElementById('sim-valor').value) || 0;
      scenarioMonths = compareToBaseline(start, horizon, simulateExtraMonthly(start, horizon, valor));
    } else if (scenario === 'categoria') {
      const cat = document.getElementById('sim-categoria').value;
      const pct = Number(document.getElementById('sim-pct').value) || 0;
      if (!cat) return;
      scenarioMonths = compareToBaseline(start, horizon, simulateReduceCategory(start, horizon, cat, pct));
    } else if (scenario === 'quitar') {
      const debtId = Number(document.getElementById('sim-divida').value);
      if (!debtId) return;
      scenarioMonths = compareToBaseline(start, horizon, simulatePayOffDebt(start, horizon, debtId));
    }
    simResult = scenarioMonths;
    renderForecast(root);
  });

  lineForecast('chart-forecast', months.map((m) => monthLabel(m.month).split(' de')[0]), months.map((m) => m.closing));
}
