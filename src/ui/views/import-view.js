import { listAccounts } from '../../repositories/account-repository.js';
import { listCards } from '../../repositories/card-repository.js';
import { runImport, completeMapping, confirmImport, confirmFullBackupRestore } from '../../services/import-service.js';
import { friendlyImportError } from '../../utils/validators.js';
import { money } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { showToast } from '../components/toast.js';

const TYPES = [
  { id: 'pdf', icon: 'fa-file-pdf', label: 'PDF', desc: 'Extrato bancário em PDF.' },
  { id: 'excel', icon: 'fa-file-excel', label: 'Excel / CSV', desc: 'Arquivo .xlsx, .xls, .csv ou .ofx.' },
  { id: 'json', icon: 'fa-file-code', label: 'JSON', desc: 'Backup ou exportação do Pulse.' }
];

const ACCEPT = { pdf: '.pdf', excel: '.xlsx,.xls,.csv,.ofx,.txt', json: '.json' };
const REQUIRED_FIELDS = [
  { key: 'date', label: 'Data da transação' },
  { key: 'desc', label: 'Descrição' },
  { key: 'val', label: 'Valor' },
  { key: 'tipo', label: 'Tipo (opcional)' },
  { key: 'cat', label: 'Categoria (opcional)' }
];

let state = { step: 'pick', fileType: null, staging: [], summary: null, mappingCtx: null, pendingBackup: null };

function destinoOptions() {
  const contas = listAccounts().map((c) => `<option value="conta_${c.id}">${escapeHtml(c.nome)} (conta)</option>`);
  const cartoes = listCards().map((c) => `<option value="cartao_${c.id}">${escapeHtml(c.nome)} (cartão)</option>`);
  return [...contas, ...cartoes].join('') || '<option value="">Nenhuma conta/cartão cadastrada</option>';
}

export function renderImport(root) {
  if (state.step === 'pick') return renderPick(root);
  if (state.step === 'mapping') return renderMapping(root);
  if (state.step === 'summary') return renderSummary(root);
  if (state.step === 'restore-confirm') return renderRestoreConfirm(root);
}

function renderPick(root) {
  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Qual tipo de arquivo você deseja importar?</h3></div>
      <div class="import-type-grid">
        ${TYPES.map((t) => `
          <button class="import-type-card" type="button" data-type="${t.id}">
            <i class="fa-solid ${t.icon}"></i>
            <span><strong style="display:block;">${t.label}</strong><small class="text-muted">${t.desc}</small></span>
          </button>`).join('')}
      </div>
    </div>

    <div class="card" id="upload-card" style="display:none;">
      <div class="card-header"><h3 class="card-title" id="upload-title">Envie seu arquivo</h3></div>
      <div class="field" style="margin-bottom:14px;">
        <label for="import-destino">Organizar lançamentos em qual conta/cartão? (opcional)</label>
        <select id="import-destino">${destinoOptions()}</select>
      </div>
      <label class="upload-box" for="import-file" tabindex="0">
        <i class="fa-solid fa-cloud-arrow-up" style="font-size:1.6rem;color:var(--primary);"></i>
        <p style="margin-top:8px;font-weight:700;">Escolher arquivo do celular ou computador</p>
        <p class="text-muted" style="font-size:0.78rem;margin-top:4px;" id="upload-hint"></p>
        <input id="import-file" type="file" class="sr-only" />
      </label>
      <p class="text-muted" style="font-size:0.75rem;margin-top:10px;">Não inventamos informações que não estejam no arquivo. Você poderá revisar tudo antes de confirmar.</p>
    </div>`;

  root.querySelectorAll('[data-type]').forEach((btn) => btn.addEventListener('click', () => {
    root.querySelectorAll('[data-type]').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.fileType = btn.dataset.type;
    const uploadCard = document.getElementById('upload-card');
    uploadCard.style.display = 'flex';
    uploadCard.style.flexDirection = 'column';
    uploadCard.style.gap = '12px';
    document.getElementById('import-file').setAttribute('accept', ACCEPT[state.fileType]);
    document.getElementById('upload-hint').textContent = state.fileType === 'pdf'
      ? 'PDFs de bancos variam muito — revise sempre os lançamentos extraídos.'
      : state.fileType === 'excel'
        ? 'Envie planilha de controle (.xlsx, .csv) ou extrato (.ofx).'
        : 'Envie um backup .json exportado pelo próprio Pulse.';
    uploadCard.scrollIntoView({ behavior: 'smooth' });
  }));

  document.getElementById('upload-card').addEventListener('change', async (e) => {
    if (e.target.id !== 'import-file') return;
    const file = e.target.files[0];
    if (!file) return;
    const destinoId = document.getElementById('import-destino').value || null;
    try {
      const result = await runImport({ fileType: state.fileType, file, destinoId });
      if (result.kind === 'needs-mapping') {
        state.mappingCtx = { headers: result.headers, rows: result.rows, destinoId };
        state.step = 'mapping';
      } else if (result.kind === 'full-backup-confirm') {
        state.pendingBackup = result.data;
        state.step = 'restore-confirm';
      } else {
        state.staging = result.staging;
        state.summary = result.summary;
        state.step = 'summary';
      }
      renderImport(root);
    } catch (err) {
      showToast(friendlyImportError(err), 'error');
    }
  });
}

function renderMapping(root) {
  const { headers, rows } = state.mappingCtx;
  const sample = rows[0] || {};

  root.innerHTML = `
    <div class="card">
      <div class="stepper"><div class="stepper-dot done"></div><div class="stepper-dot active"></div><div class="stepper-dot"></div></div>
      <div class="card-header"><h3 class="card-title">Confirme as colunas do arquivo</h3></div>
      <p class="text-muted" style="margin-bottom:14px;font-size:0.85rem;">Não conseguimos identificar todas as colunas automaticamente. Indique qual coluna do arquivo corresponde a cada campo do Pulse.</p>
      <div class="form-grid">
        ${REQUIRED_FIELDS.map((f) => `
          <div class="field">
            <label for="map-${f.key}">${f.label}</label>
            <select id="map-${f.key}">
              <option value="">— não usar —</option>
              ${headers.map((h) => `<option value="${escapeHtml(h)}">${escapeHtml(h)}${sample[h] !== undefined ? ` (ex: ${escapeHtml(String(sample[h]).slice(0, 20))})` : ''}</option>`).join('')}
            </select>
          </div>`).join('')}
      </div>
      <div class="form-actions" style="margin-top:16px;">
        <button class="btn btn-secondary" id="btn-mapping-cancel" type="button">Cancelar</button>
        <button class="btn btn-primary" id="btn-mapping-confirm" type="button">Continuar</button>
      </div>
    </div>`;

  document.getElementById('btn-mapping-cancel').addEventListener('click', () => { resetWizard(); renderImport(root); });
  document.getElementById('btn-mapping-confirm').addEventListener('click', () => {
    const mapping = {};
    REQUIRED_FIELDS.forEach((f) => { const v = document.getElementById(`map-${f.key}`).value; if (v) mapping[f.key] = v; });
    if (!mapping.date || !mapping.desc || !mapping.val) { showToast('Selecione ao menos Data, Descrição e Valor.', 'error'); return; }
    const { staging, summary } = completeMapping(state.mappingCtx.rows, mapping, state.mappingCtx.destinoId);
    state.staging = staging;
    state.summary = summary;
    state.step = 'summary';
    renderImport(root);
  });
}

function renderRestoreConfirm(root) {
  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Restaurar backup completo?</h3></div>
      <p class="text-muted" style="margin-bottom:14px;">Este arquivo é um backup completo do Pulse. Restaurá-lo vai <strong>substituir todos os seus dados atuais</strong> (transações, contas, categorias, metas etc). Esta ação não pode ser desfeita.</p>
      <div class="form-actions">
        <button class="btn btn-secondary" id="btn-restore-cancel" type="button">Cancelar</button>
        <button class="btn btn-red" id="btn-restore-confirm" type="button">Substituir e restaurar</button>
      </div>
    </div>`;
  document.getElementById('btn-restore-cancel').addEventListener('click', () => { resetWizard(); renderImport(root); });
  document.getElementById('btn-restore-confirm').addEventListener('click', async () => {
    await confirmFullBackupRestore(state.pendingBackup);
    showToast('Backup restaurado com sucesso.', 'success');
    resetWizard();
    renderImport(root);
  });
}

function renderSummary(root) {
  const { staging, summary } = state;
  const duplicateCount = summary.duplicates;

  root.innerHTML = `
    <div class="card">
      <div class="stepper"><div class="stepper-dot done"></div><div class="stepper-dot done"></div><div class="stepper-dot active"></div></div>
      <div class="card-header"><h3 class="card-title">Conciliação — confira antes de importar</h3></div>
      <div class="grid-4" style="margin-bottom:14px;">
        <div><p class="card-eyebrow">Encontrados</p><p class="stat-value" style="font-size:1.1rem;">${summary.count}</p></div>
        <div><p class="card-eyebrow">Receitas</p><p class="stat-value val-plus" style="font-size:1.1rem;">${money(summary.income)}</p></div>
        <div><p class="card-eyebrow">Despesas</p><p class="stat-value val-minus" style="font-size:1.1rem;">${money(summary.expenses)}</p></div>
        <div><p class="card-eyebrow">Período</p><p class="stat-value" style="font-size:0.85rem;">${summary.periodStart ? `${escapeHtml(summary.periodStart)} → ${escapeHtml(summary.periodEnd)}` : '—'}</p></div>
      </div>
      ${duplicateCount ? `<div class="badge-block badge-warning" style="margin-bottom:14px;">Encontramos ${duplicateCount} lançamento(s) que parecem duplicados com o que já existe.</div>` : ''}

      <div class="table-wrap" style="margin-bottom:14px;"><table>
        <thead><tr><th>Status</th><th>Data</th><th>Descrição</th><th>Valor</th><th>Categoria</th></tr></thead>
        <tbody>
          ${staging.map((s) => `<tr>
            <td data-label="Status">${s.matchStatus === 'novo' ? '<span class="badge badge-success">Novo</span>' : '<span class="badge badge-warning">Possível duplicado</span>'}</td>
            <td data-label="Data">${escapeHtml(s.date)}</td>
            <td data-label="Descrição">${escapeHtml(s.desc)}</td>
            <td data-label="Valor" class="${s.tipo === 'receita' ? 'val-plus' : 'val-minus'}">${money(s.val)}</td>
            <td data-label="Categoria">${escapeHtml(s.cat)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>

      <div class="form-actions">
        <button class="btn btn-secondary" id="btn-cancel" type="button">Cancelar</button>
        ${duplicateCount ? '<button class="btn btn-secondary" id="btn-only-new" type="button">Importar apenas novos</button>' : ''}
        <button class="btn btn-primary" id="btn-import-all" type="button">Confirmar importação</button>
      </div>
    </div>`;

  document.getElementById('btn-cancel').addEventListener('click', () => { resetWizard(); renderImport(root); });
  document.getElementById('btn-only-new')?.addEventListener('click', () => doConfirm(root, 'apenas_novos'));
  document.getElementById('btn-import-all').addEventListener('click', () => doConfirm(root, 'tudo'));
}

async function doConfirm(root, mode) {
  const count = await confirmImport(state.staging, mode);
  showToast(`${count} lançamento(s) importado(s) com sucesso.`, 'success');
  resetWizard();
  renderImport(root);
}

function resetWizard() { state = { step: 'pick', fileType: null, staging: [], summary: null, mappingCtx: null, pendingBackup: null }; }
