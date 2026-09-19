import { getPreferences, setPreference, setFontScale, applyPreferencesToDom, togglePrivacyMode } from '../../services/preferences-service.js';
import { isDemoActive, activateDemo, deactivateDemo, clearDemoData, wipeReal } from '../../services/demo-service.js';
import { exportJson, exportCsv } from '../../services/export-service.js';
import { getMeta, updateMeta } from '../../core/store.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../utils/sanitize.js';

export function renderSettings(root, { onProfileReset }) {
  const prefs = getPreferences();
  const demoActive = isDemoActive();

  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Perfil</h3></div>
      <p style="margin-bottom:10px;">Olá, <strong>${escapeHtml(getMeta().profileName || '')}</strong>!</p>
      <button class="btn btn-secondary btn-sm" id="btn-rename" type="button">Alterar nome</button>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Acessibilidade e Aparência</h3></div>
      <div class="form-grid">
        <div class="field">
          <label for="pref-palette">Paleta de cores</label>
          <select id="pref-palette">
            <option value="preto" ${prefs.palette === 'preto' ? 'selected' : ''}>Padrão (roxo)</option>
            <option value="azul" ${prefs.palette === 'azul' ? 'selected' : ''}>Azul</option>
            <option value="rosa" ${prefs.palette === 'rosa' ? 'selected' : ''}>Rosa</option>
            <option value="branco" ${prefs.palette === 'branco' ? 'selected' : ''}>Alto contraste claro</option>
          </select>
        </div>
        <div class="field">
          <label for="pref-colormode">Modo de cores</label>
          <select id="pref-colormode">
            <option value="padrao" ${prefs.colorMode === 'padrao' ? 'selected' : ''}>Padrão</option>
            <option value="daltonico" ${prefs.colorMode === 'daltonico' ? 'selected' : ''}>Amigável para daltonismo</option>
          </select>
        </div>
        <div class="field">
          <label>Tamanho da fonte (${prefs.fontScale}%)</label>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" id="font-minus" type="button">A-</button>
            <button class="btn btn-secondary btn-sm" id="font-plus" type="button">A+</button>
          </div>
        </div>
        <div class="field">
          <label for="pref-currency">Moeda Padrão</label>
          <select id="pref-currency">
            <option value="BRL" ${prefs.currency === 'BRL' ? 'selected' : ''}>BRL (R$)</option>
            <option value="USD" ${prefs.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Modo Privado</h3></div>
      <p class="text-muted" style="margin-bottom:12px;font-size:0.85rem;">Oculta valores financeiros na tela (mantém símbolos e formato, mascara os números). Útil ao usar o Pulse em público ou durante uma apresentação. Também dá pra ativar rapidamente pelo ícone de olho no topo da tela.</p>
      <div class="form-actions">
        <button class="btn ${prefs.privacyMode ? 'btn-primary' : 'btn-secondary'}" id="btn-privacy-toggle" type="button">
          <i class="fa-solid ${prefs.privacyMode ? 'fa-eye-slash' : 'fa-eye'}"></i> ${prefs.privacyMode ? 'Desativar' : 'Ativar'} Modo Privado
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Alertas</h3></div>
      <p class="text-muted" style="margin-bottom:12px;font-size:0.85rem;">Avisa sobre despesas e receitas recorrentes/parceladas próximas do vencimento (visível na Visão Geral).</p>
      <div class="field">
        <label for="pref-alert-lead">Avisar com quanto tempo de antecedência?</label>
        <select id="pref-alert-lead">
          <option value="1" ${prefs.alertLeadDays === 1 ? 'selected' : ''}>1 dia antes</option>
          <option value="2" ${prefs.alertLeadDays === 2 ? 'selected' : ''}>2 dias antes</option>
          <option value="3" ${prefs.alertLeadDays === 3 ? 'selected' : ''}>3 dias antes</option>
          <option value="0" ${prefs.alertLeadDays === 0 ? 'selected' : ''}>No dia</option>
          <option value="-1" ${prefs.alertLeadDays === -1 ? 'selected' : ''}>Desativado</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Modo de Demonstração</h3></div>
      <p class="text-muted" style="margin-bottom:12px;font-size:0.85rem;">Use dados fictícios para testar o Pulse sem afetar seus dados reais. ${demoActive ? '<strong>Modo demonstração está ativo agora.</strong>' : ''}</p>
      <div class="form-actions">
        ${demoActive
          ? '<button class="btn btn-secondary" id="btn-demo-off" type="button">Voltar para meus dados reais</button>'
          : '<button class="btn btn-secondary" id="btn-demo-on" type="button">Ativar demonstração</button>'}
        <button class="btn btn-amber" id="btn-demo-clear" type="button">Limpar dados da demonstração</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Backup e Exportação</h3></div>
      <p class="text-muted" style="margin-bottom:12px;font-size:0.85rem;">Baixe seus registros completos a qualquer momento.</p>
      <div class="form-actions">
        <button class="btn btn-secondary" id="btn-export-json" type="button">Exportar JSON</button>
        <button class="btn btn-secondary" id="btn-export-csv" type="button">Exportar CSV</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Privacidade</h3></div>
      <p class="text-muted" style="font-size:0.85rem;">Seus dados ficam salvos apenas neste navegador (IndexedDB), neste dispositivo. O Pulse não envia nada para servidores externos, não armazena senhas bancárias, CVV ou credenciais.</p>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Zona de risco</h3></div>
      <button class="btn btn-red" id="btn-wipe" type="button">Resetar dados reais</button>
    </div>`;

  document.getElementById('pref-palette').addEventListener('change', async (e) => { await setPreference('palette', e.target.value); applyPreferencesToDom(); });
  document.getElementById('pref-colormode').addEventListener('change', async (e) => { await setPreference('colorMode', e.target.value); applyPreferencesToDom(); });
  document.getElementById('pref-currency').addEventListener('change', async (e) => { await setPreference('currency', e.target.value); showToast('Moeda atualizada.', 'success'); });
  document.getElementById('btn-privacy-toggle').addEventListener('click', async () => { await togglePrivacyMode(); renderSettings(root, { onProfileReset }); });
  document.getElementById('pref-alert-lead').addEventListener('change', async (e) => { await setPreference('alertLeadDays', Number(e.target.value)); showToast('Preferência de alerta atualizada.', 'success'); });
  document.getElementById('font-minus').addEventListener('click', async () => { await setFontScale(-10); applyPreferencesToDom(); renderSettings(root, { onProfileReset }); });
  document.getElementById('font-plus').addEventListener('click', async () => { await setFontScale(10); applyPreferencesToDom(); renderSettings(root, { onProfileReset }); });

  document.getElementById('btn-rename').addEventListener('click', () => {
    openModal({
      title: 'Alterar nome',
      bodyHtml: `<div class="field"><label for="new-name">Novo nome</label><input id="new-name" value="${escapeHtml(getMeta().profileName || '')}" /></div>
        <div class="form-actions" style="margin-top:12px;"><button class="btn btn-primary btn-block" id="save-name" type="button">Salvar</button></div>`,
      onMount: (body, close) => {
        body.querySelector('#save-name').addEventListener('click', async () => {
          const name = body.querySelector('#new-name').value.trim();
          if (!name) return;
          await updateMeta({ profileName: name });
          close();
          renderSettings(root, { onProfileReset });
          showToast('Nome atualizado.', 'success');
        });
      }
    });
  });

  document.getElementById('btn-demo-on')?.addEventListener('click', async () => { await activateDemo(); showToast('Modo demonstração ativado.'); renderSettings(root, { onProfileReset }); });
  document.getElementById('btn-demo-off')?.addEventListener('click', async () => { await deactivateDemo(); showToast('Você voltou para seus dados reais.'); renderSettings(root, { onProfileReset }); });
  document.getElementById('btn-demo-clear').addEventListener('click', async () => {
    await clearDemoData();
    showToast('Dados de demonstração reiniciados.', 'success');
  });

  document.getElementById('btn-export-json').addEventListener('click', exportJson);
  document.getElementById('btn-export-csv').addEventListener('click', exportCsv);

  document.getElementById('btn-wipe').addEventListener('click', () => {
    openModal({
      title: 'Resetar dados reais',
      bodyHtml: `<p>Isso vai apagar permanentemente todas as suas transações, contas, cartões, categorias, orçamentos, metas e patrimônio reais. O modo de demonstração não é afetado. Deseja continuar?</p>
        <div class="form-actions" style="margin-top:14px;"><button class="btn btn-red btn-block" id="confirm-wipe" type="button">Sim, apagar tudo</button></div>`,
      onMount: (body, close) => {
        body.querySelector('#confirm-wipe').addEventListener('click', async () => {
          await wipeReal();
          close();
          showToast('Dados reais apagados.', 'success');
        });
      }
    });
  });
}
