import { totalsForMonth, categoryBreakdown, buildInsights } from '../../services/insight-service.js';
import { currentMonth, money } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { openChatGpt, copyChatGptPrompt } from '../../services/report-service.js';
import { showToast } from '../components/toast.js';

// Assistente local, 100% baseado em regras sobre os dados já existentes —
// não é um modelo de IA e não usa nenhuma API paga ou chave de acesso.
function localReply(question) {
  const q = question.toLowerCase();
  const month = currentMonth();
  const { income, expenses, balance, entries } = totalsForMonth(month);

  if (/gast|despes/.test(q)) return `Suas despesas neste mês somam ${money(expenses)}.`;
  if (/receit|ganh|salário/.test(q)) return `Suas receitas neste mês somam ${money(income)}.`;
  if (/saldo|balan/.test(q)) return `Seu balanço líquido do mês é ${money(balance)}.`;
  if (/categoria/.test(q)) {
    const top = categoryBreakdown(entries, 'despesa')[0];
    return top ? `Sua maior categoria de despesa é ${top[0]}, com ${money(top[1])}.` : 'Ainda não há despesas categorizadas neste mês.';
  }
  if (/dica|insight|análise|analise/.test(q)) {
    const insights = buildInsights(month);
    return insights.map((i) => i.text).join(' ');
  }
  return 'Posso responder sobre saldo, receitas, despesas e categorias do mês atual. Para uma análise mais profunda, use o botão "Abrir ChatGPT" abaixo.';
}

export function renderAi(root) {
  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Pulse IA</h3></div>
      <p class="text-muted" style="margin-bottom:10px;font-size:0.85rem;">Assistente local baseado em regras sobre os seus dados — não envia nada para fora do seu navegador.</p>
      <div class="chat-box" id="chat-box">
        <div class="msg msg-ai">Olá! Posso responder perguntas rápidas sobre seu mês atual: saldo, receitas, despesas ou categorias.</div>
      </div>
      <form id="chat-form" style="display:flex;gap:8px;margin-top:10px;">
        <input id="chat-input" placeholder="Ex: quanto gastei este mês?" style="flex:1;" />
        <button class="btn btn-primary" type="submit">Enviar</button>
      </form>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Análise aprofundada com ChatGPT</h3></div>
      <p class="text-muted" style="margin-bottom:12px;font-size:0.85rem;">Para uma análise mais completa, use a tela de Relatórios para gerar um PDF e um roteiro pronto — o Pulse nunca envia seus dados automaticamente.</p>
      <div class="form-actions">
        <button class="btn btn-secondary" id="btn-copy-prompt" type="button"><i class="fa-regular fa-copy"></i> Copiar Prompt</button>
        <button class="btn btn-secondary" id="btn-open-chatgpt" type="button"><i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir ChatGPT</button>
      </div>
    </div>`;

  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const value = input.value.trim();
    if (!value) return;
    const box = document.getElementById('chat-box');
    box.insertAdjacentHTML('beforeend', `<div class="msg msg-user">${escapeHtml(value)}</div>`);
    box.insertAdjacentHTML('beforeend', `<div class="msg msg-ai">${escapeHtml(localReply(value))}</div>`);
    box.scrollTop = box.scrollHeight;
    input.value = '';
  });

  document.getElementById('btn-open-chatgpt').addEventListener('click', openChatGpt);

  document.getElementById('btn-copy-prompt').addEventListener('click', async () => {
    const ok = await copyChatGptPrompt();
    showToast(ok ? 'Roteiro copiado para a área de transferência.' : 'Não foi possível copiar automaticamente. Copie manualmente na tela de Relatórios.', ok ? 'success' : 'error');
  });
}
