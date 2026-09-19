import { listAssets, addItem, removeItem } from '../../repositories/networth-repository.js';
import { listDebts, addDebt, removeDebt, outstandingBalance } from '../../repositories/debt-repository.js';
import { payInstallment, undoInstallmentPayment } from '../../services/debt-service.js';
import { listAccounts } from '../../repositories/account-repository.js';
import { listCards } from '../../repositories/card-repository.js';
import { listSnapshots, recordSnapshot } from '../../repositories/networth-history-repository.js';
import { lineForecast } from '../components/charts.js';
import { money, percent, todayISO, monthLabel } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { showToast } from '../components/toast.js';

let expandedDebtId = null;

function destinoOptions() {
  const contas = listAccounts().map((c) => `<option value="conta_${c.id}">${escapeHtml(c.nome)} (conta)</option>`);
  const cartoes = listCards().map((c) => `<option value="cartao_${c.id}">${escapeHtml(c.nome)} (cartão)</option>`);
  return [...contas, ...cartoes].join('') || '<option value="">Nenhuma conta/cartão cadastrada</option>';
}

export function renderNetWorth(root) {
  const assets = listAssets();
  const debts = listDebts();
  const assetTotal = assets.reduce((a, p) => a + p.val, 0);
  const debtOutstanding = outstandingBalance();
  const netWorth = assetTotal - debtOutstanding;
  const snapshots = listSnapshots();

  // Registra o patrimônio líquido de hoje como o ponto do mês corrente —
  // é assim que a série de evolução (seção 21) cresce com dados reais, sem
  // nunca inventar valores para meses que o usuário não visitou a tela.
  recordSnapshot(netWorth);

  root.innerHTML = `
    <div class="grid-2">
      <div class="card"><p class="card-eyebrow">Patrimônio líquido</p><h2 class="stat-value ${netWorth >= 0 ? 'val-plus' : 'val-minus'}">${money(netWorth)}</h2></div>
      <div class="card"><p class="card-eyebrow">Ativos − Saldo devedor</p><p class="text-muted" style="margin-top:8px;">${money(assetTotal)} − ${money(debtOutstanding)}</p></div>
    </div>

    ${snapshots.length >= 2 ? `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Evolução do Patrimônio</h3></div>
      <div class="chart-wrap"><canvas id="chart-networth"></canvas></div>
    </div>` : `
    <div class="card">${emptyStateHtml({
      icon: 'fa-chart-line', title: 'Evolução ainda não disponível',
      text: 'O Pulse registra automaticamente o patrimônio líquido de cada mês em que você visita esta tela. Volte em outro mês para começar a ver o gráfico de evolução.'
    })}</div>`}

    <div class="card">
      <div class="card-header"><h3 class="card-title">Bens e Ativos</h3></div>
      <form id="asset-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="asset-nome">Item</label><input id="asset-nome" required placeholder="Ex: Carro, investimentos" /></div>
        <div class="field"><label for="asset-val">Valor</label><input id="asset-val" type="number" step="0.01" required placeholder="0,00" /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">+ Ativo</button></div>
      </form>
      ${assets.length ? `<div class="table-wrap"><table><thead><tr><th>Item</th><th>Valor</th><th>Ação</th></tr></thead><tbody>
        ${assets.map((a) => `<tr><td data-label="Item">${escapeHtml(a.nome)}</td><td data-label="Valor">${money(a.val)}</td><td data-label="Ação"><button class="btn btn-ghost btn-sm" type="button" data-remove-asset="${a.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}
      </tbody></table></div>` : emptyStateHtml({ icon: 'fa-sack-dollar', title: 'Nenhum bem cadastrado', text: 'Adicione seus bens e ativos para calcular seu patrimônio.' })}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Dívidas</h3></div>
      <form id="debt-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="debt-nome">Descrição</label><input id="debt-nome" required placeholder="Ex: Notebook" /></div>
        <div class="field"><label for="debt-categoria">Categoria</label><input id="debt-categoria" placeholder="Ex: Eletrônicos" /></div>
        <div class="field"><label for="debt-credor">Credor</label><input id="debt-credor" placeholder="Ex: Loja, banco" /></div>
        <div class="field"><label for="debt-total">Valor total</label><input id="debt-total" type="number" step="0.01" required placeholder="0,00" /></div>
        <div class="field"><label for="debt-contratacao">Data da contratação</label><input id="debt-contratacao" type="date" /></div>
        <div class="field" style="flex-direction:row;align-items:center;gap:8px;">
          <input id="debt-parcelada" type="checkbox" style="width:auto;min-height:auto;" />
          <label for="debt-parcelada" style="margin:0;">Parcelada</label>
        </div>
        <div class="field"><label for="debt-parcelas">Nº de parcelas</label><input id="debt-parcelas" type="number" min="1" value="1" disabled /></div>
        <div class="field"><label for="debt-vencimento">1º vencimento</label><input id="debt-vencimento" type="date" value="${todayISO()}" /></div>
        <div class="field"><label for="debt-conta">Conta/cartão da parcela</label><select id="debt-conta">${destinoOptions()}</select></div>
        <div class="field"><label for="debt-obs">Observações</label><input id="debt-obs" placeholder="Opcional" /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">Cadastrar dívida</button></div>
      </form>

      ${debts.length ? debts.map((d) => renderDebtCard(d)).join('') : emptyStateHtml({ icon: 'fa-file-invoice-dollar', title: 'Nenhuma dívida cadastrada', text: 'Cadastre suas dívidas, parceladas ou não, para acompanhar o saldo devedor.' })}
    </div>`;

  document.getElementById('asset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addItem({ tipo: 'ativo', nome: document.getElementById('asset-nome').value, val: document.getElementById('asset-val').value });
    showToast('Ativo adicionado.', 'success');
    renderNetWorth(root);
  });
  root.querySelectorAll('[data-remove-asset]').forEach((btn) => btn.addEventListener('click', async () => { await removeItem(Number(btn.dataset.removeAsset)); renderNetWorth(root); }));

  document.getElementById('debt-parcelada').addEventListener('change', (e) => {
    document.getElementById('debt-parcelas').disabled = !e.target.checked;
  });

  document.getElementById('debt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDebt({
      nome: document.getElementById('debt-nome').value,
      categoria: document.getElementById('debt-categoria').value,
      credor: document.getElementById('debt-credor').value,
      valorTotal: document.getElementById('debt-total').value,
      dataContratacao: document.getElementById('debt-contratacao').value,
      parcelada: document.getElementById('debt-parcelada').checked,
      numParcelas: document.getElementById('debt-parcelas').value,
      primeiroVencimento: document.getElementById('debt-vencimento').value,
      contaId: document.getElementById('debt-conta').value,
      observacoes: document.getElementById('debt-obs').value
    });
    showToast('Dívida cadastrada. As parcelas já aparecem no Calendário.', 'success');
    renderNetWorth(root);
  });

  root.querySelectorAll('[data-remove-debt]').forEach((btn) => btn.addEventListener('click', async () => {
    await removeDebt(Number(btn.dataset.removeDebt));
    showToast('Dívida removida.');
    renderNetWorth(root);
  }));

  root.querySelectorAll('[data-toggle-debt]').forEach((btn) => btn.addEventListener('click', () => {
    const id = Number(btn.dataset.toggleDebt);
    expandedDebtId = expandedDebtId === id ? null : id;
    renderNetWorth(root);
  }));

  root.querySelectorAll('[data-pay-installment]').forEach((btn) => btn.addEventListener('click', async () => {
    const [debtId, numero] = btn.dataset.payInstallment.split(':').map(Number);
    await payInstallment(debtId, numero, {});
    showToast('Parcela paga — transação registrada automaticamente.', 'success');
    renderNetWorth(root);
  }));

  root.querySelectorAll('[data-undo-installment]').forEach((btn) => btn.addEventListener('click', async () => {
    const [debtId, numero] = btn.dataset.undoInstallment.split(':').map(Number);
    await undoInstallmentPayment(debtId, numero);
    showToast('Pagamento desfeito.');
    renderNetWorth(root);
  }));

  if (snapshots.length >= 2) {
    const purple = getComputedStyle(document.documentElement).getPropertyValue('--accent-purple').trim() || '#8b5cf6';
    lineForecast('chart-networth', snapshots.map((s) => monthLabel(s.month).split(' de')[0]), snapshots.map((s) => s.value), 'Patrimônio líquido', purple);
  }
}

function renderDebtCard(d) {
  const paidCount = d.parcelas.filter((p) => p.status === 'paga').length;
  const pct = percent(paidCount, d.parcelas.length);
  const restante = d.parcelas.filter((p) => p.status === 'pendente').reduce((a, p) => a + p.valor, 0);
  const expanded = expandedDebtId === d.id;

  return `
    <div class="card" style="background:var(--bg-input);margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <div>
          <p style="font-weight:700;">${escapeHtml(d.nome)} ${d.status === 'quitada' ? '<span class="badge badge-success">Quitada</span>' : '<span class="badge badge-warning">Aberta</span>'}</p>
          <p class="text-muted" style="font-size:0.75rem;">${escapeHtml(d.categoria)}${d.credor ? ` · ${escapeHtml(d.credor)}` : ''} ${d.parcelada ? `· ${d.numParcelas}x de ${money(d.valorParcela)}` : '· à vista'}</p>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" data-remove-debt="${d.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="progress-row" style="margin-top:10px;">
        <div class="progress-labels"><span>${paidCount}/${d.parcelas.length} parcelas pagas</span><span>Restante: ${money(restante)}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:var(--accent-green)"></div></div>
      </div>
      <button class="btn btn-ghost btn-sm" type="button" data-toggle-debt="${d.id}" style="margin-top:8px;">${expanded ? 'Ocultar parcelas' : 'Ver parcelas'}</button>
      ${expanded ? `<div class="table-wrap" style="margin-top:8px;"><table><thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>
        ${d.parcelas.map((p) => `<tr>
          <td data-label="Parcela">${p.numero}/${d.parcelas.length}</td>
          <td data-label="Vencimento">${escapeHtml(p.vencimento || '—')}</td>
          <td data-label="Valor">${money(p.valor)}</td>
          <td data-label="Status">${p.status === 'paga' ? `<span class="badge badge-success">Paga ${p.dataPagamento ? `em ${escapeHtml(p.dataPagamento)}` : ''}</span>` : '<span class="badge badge-warning">Pendente</span>'}</td>
          <td data-label="">${p.status === 'paga'
            ? `<button class="btn btn-ghost btn-sm" type="button" data-undo-installment="${d.id}:${p.numero}">Desfazer</button>`
            : `<button class="btn btn-primary btn-sm" type="button" data-pay-installment="${d.id}:${p.numero}">Marcar paga</button>`}</td>
        </tr>`).join('')}
      </tbody></table></div>` : ''}
    </div>`;
}
