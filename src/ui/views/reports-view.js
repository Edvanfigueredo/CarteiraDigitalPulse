import { listMonths } from '../../repositories/month-repository.js';
import { emitPrintableReport, copyChatGptPrompt, openChatGpt, CHATGPT_PROMPT } from '../../services/report-service.js';
import { monthLabel } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { showToast } from '../components/toast.js';

export function renderReports(root) {
  const months = listMonths();

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
  document.getElementById('btn-copy-prompt').addEventListener('click', async () => {
    const ok = await copyChatGptPrompt();
    showToast(ok ? 'Roteiro copiado para a área de transferência.' : 'Não foi possível copiar automaticamente. Selecione o texto manualmente.', ok ? 'success' : 'error');
  });
  document.getElementById('btn-open-chatgpt').addEventListener('click', openChatGpt);
}
