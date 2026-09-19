import { listMonths } from '../../repositories/month-repository.js';
import { emitPrintableReport, copyChatGptPrompt, openChatGpt, CHATGPT_PROMPT } from '../../services/report-service.js';
import { buildAnnualReport } from '../../services/annual-report-service.js';
import { money, monthLabel } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { showToast } from '../components/toast.js';

let annualYear = new Date().getFullYear();

export function renderReports(root) {
  const months = listMonths();
  const yearsAvailable = Array.from(new Set(months.map((m) => m.slice(0, 4)))).sort().reverse();
  if (!yearsAvailable.includes(String(annualYear))) annualYear = Number(yearsAvailable[0] || new Date().getFullYear());
  const annual = buildAnnualReport(annualYear);

  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Emitir Relatório</h3></div>
      <div class="field">
        <label for="report-month">Mês de referência</label>
        <select id="report-month">${months.map((m) => `<option value="${m}">${escapeHtml(monthLabel(m))}</option>`).join('')}</select>
      </div>
      <div class="form-actions" style="margin-top:14px;">
        <button class="btn btn-primary" id="btn-emit" type="button"><i class="fa-solid fa-file-pdf"></i> Emitir relatório (PDF)</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Meu Ano Financeiro</h3>
        <select id="annual-year" style="width:auto;">${yearsAvailable.map((y) => `<option value="${y}" ${Number(y) === annualYear ? 'selected' : ''}>${y}</option>`).join('') || `<option value="${annualYear}">${annualYear}</option>`}</select>
      </div>
      <div class="grid-4" style="margin-bottom:14px;">
        <div><p class="card-eyebrow">Receitas</p><p class="stat-value val-plus" style="font-size:1.1rem;">${money(annual.income)}</p></div>
        <div><p class="card-eyebrow">Despesas</p><p class="stat-value val-minus" style="font-size:1.1rem;">${money(annual.expenses)}</p></div>
        <div><p class="card-eyebrow">Economia</p><p class="stat-value ${annual.economia >= 0 ? 'val-plus' : 'val-minus'}" style="font-size:1.1rem;">${money(annual.economia)}</p></div>
        <div><p class="card-eyebrow">Patrimônio atual</p><p class="stat-value" style="font-size:1.1rem;">${money(annual.netWorth)}</p></div>
      </div>
      <p style="font-size:0.85rem;margin-bottom:10px;">Dívidas quitadas em ${annualYear}: <strong>${annual.debtsClosedThisYear}</strong> · Metas concluídas: <strong>${annual.goalsCompleted}</strong> · Conquistas ativas: <strong>${annual.achievements.length}</strong></p>
      ${annual.topCategories.length ? `
        <p class="card-eyebrow" style="margin-bottom:8px;">Maiores categorias de despesa</p>
        <div class="table-wrap"><table><thead><tr><th>Categoria</th><th>Total no ano</th></tr></thead><tbody>
          ${annual.topCategories.map(([name, val]) => `<tr><td data-label="Categoria">${escapeHtml(name)}</td><td data-label="Total no ano">${money(val)}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="text-muted" style="font-size:0.85rem;">Sem despesas categorizadas neste ano ainda.</p>'}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Analisar com ChatGPT</h3></div>
      <p class="text-muted" style="margin-bottom:12px;">O Pulse não envia seus dados automaticamente para nenhuma IA. Gere o relatório em PDF acima, copie o roteiro de análise abaixo e anexe o arquivo manualmente no ChatGPT.</p>
      <div class="card" style="background:var(--bg-input);max-height:260px;overflow-y:auto;">
        <p style="font-size:0.78rem;white-space:pre-wrap;line-height:1.5;">${escapeHtml(CHATGPT_PROMPT)}</p>
      </div>
      <div class="form-actions" style="margin-top:12px;">
        <button class="btn btn-secondary" id="btn-copy-prompt" type="button"><i class="fa-regular fa-copy"></i> Copiar roteiro</button>
        <button class="btn btn-primary" id="btn-open-chatgpt" type="button"><i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir ChatGPT</button>
      </div>
    </div>`;

  document.getElementById('btn-emit').addEventListener('click', () => {
    emitPrintableReport(document.getElementById('report-month').value);
  });
  document.getElementById('annual-year').addEventListener('change', (e) => {
    annualYear = Number(e.target.value);
    renderReports(root);
  });
  document.getElementById('btn-copy-prompt').addEventListener('click', async () => {
    const ok = await copyChatGptPrompt();
    showToast(ok ? 'Roteiro copiado para a área de transferência.' : 'Não foi possível copiar automaticamente. Selecione o texto manualmente.', ok ? 'success' : 'error');
  });
  document.getElementById('btn-open-chatgpt').addEventListener('click', openChatGpt);
}

