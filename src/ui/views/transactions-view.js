import { listTransactions, removeTransaction } from '../../repositories/transaction-repository.js';
import { listAccounts } from '../../repositories/account-repository.js';
import { listCards } from '../../repositories/card-repository.js';
import { listCategories } from '../../repositories/category-repository.js';
import { saveTransaction, createInstallmentPurchase } from '../../services/transaction-service.js';
import { money, todayISO } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { showToast } from '../components/toast.js';

let editingId = null;

function destinoOptions() {
  const contas = listAccounts().map((c) => `<option value="conta_${c.id}">${escapeHtml(c.nome)} (conta)</option>`);
  const cartoes = listCards().map((c) => `<option value="cartao_${c.id}">${escapeHtml(c.nome)} (cartão)</option>`);
  return [...contas, ...cartoes].join('') || '<option value="">Cadastre uma conta ou cartão primeiro</option>';
}

function categoryOptions(tipo) {
  return listCategories().filter((c) => c.tipo === tipo).map((c) => `<option value="${escapeHtml(c.nome)}">${escapeHtml(c.nome)}</option>`).join('')
    || '<option value="Geral">Geral</option>';
}

function destinoLabel(id) {
  if (!id) return '—';
  const [kind, rawId] = id.split('_');
  const list = kind === 'conta' ? listAccounts() : listCards();
  const found = list.find((x) => String(x.id) === rawId);
  return found ? found.nome : '—';
}

export function renderTransactions(root) {
  const items = listTransactions().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title" id="form-title">Nova Transação</h3>
        <button class="btn btn-ghost btn-sm" id="btn-cancel-edit" type="button" style="display:none;">Cancelar edição</button>
      </div>
      <form id="tx-form" class="form-grid">
        <div class="field">
          <label for="tx-desc">Descrição</label>
          <input id="tx-desc" required placeholder="Ex: Supermercado" />
        </div>
        <div class="field">
          <label for="tx-val">Valor</label>
          <input id="tx-val" type="number" step="0.01" min="0" inputmode="decimal" required placeholder="0,00" />
        </div>
        <div class="field">
          <label for="tx-tipo">Tipo</label>
          <select id="tx-tipo">
            <option value="despesa">Despesa (-)</option>
            <option value="receita">Receita (+)</option>
          </select>
        </div>
        <div class="field">
          <label for="tx-date">Data</label>
          <input id="tx-date" type="date" value="${todayISO()}" required />
        </div>
        <div class="field">
          <label for="tx-conta">Conta / Cartão</label>
          <select id="tx-conta">${destinoOptions()}</select>
        </div>
        <div class="field">
          <label for="tx-cat">Categoria</label>
          <select id="tx-cat">${categoryOptions('despesa')}</select>
        </div>
        <div class="field">
          <label for="tx-status">Status</label>
          <select id="tx-status">
            <option value="pago">Concluído / Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
        <div class="field">
          <label for="tx-parcelas">Parcelar em quantas vezes? (opcional)</label>
          <input id="tx-parcelas" type="number" min="1" max="48" placeholder="1" />
          <small class="hint">Use apenas para compras no cartão. A última parcela absorve o arredondamento.</small>
        </div>
        <div class="form-actions" style="grid-column:1/-1;">
          <button class="btn btn-primary" type="submit">Salvar Registro</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Histórico de Transações</h3></div>
      ${items.length ? `
      <div class="table-wrap"><table>
        <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta/Cartão</th><th>Status</th><th>Valor</th><th>Ações</th></tr></thead>
        <tbody>
          ${items.map((t) => `
          <tr>
            <td data-label="Data">${escapeHtml(t.date)}</td>
            <td data-label="Descrição">${escapeHtml(t.desc)}${t.tag ? ` <span class="badge">${escapeHtml(t.tag)}</span>` : ''}</td>
            <td data-label="Categoria">${escapeHtml(t.cat || 'Geral')}</td>
            <td data-label="Conta/Cartão">${escapeHtml(destinoLabel(t.contaId))}</td>
            <td data-label="Status"><span class="badge ${t.status === 'pago' ? 'badge-success' : 'badge-warning'}">${t.status === 'pago' ? 'Pago' : 'Pendente'}</span></td>
            <td data-label="Valor" class="${t.tipo === 'receita' ? 'val-plus' : 'val-minus'}">${t.tipo === 'receita' ? '+' : '-'} ${money(t.val)}</td>
            <td data-label="Ações">
              <button class="btn btn-ghost btn-sm" type="button" data-edit="${t.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-ghost btn-sm" type="button" data-remove="${t.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : emptyStateHtml({
        icon: 'fa-receipt', title: 'Ainda não há transações',
        text: 'Adicione sua primeira receita ou despesa para começar a acompanhar sua vida financeira.'
      })}
    </div>`;

  const tipoSelect = document.getElementById('tx-tipo');
  const catSelect = document.getElementById('tx-cat');
  tipoSelect.addEventListener('change', () => { catSelect.innerHTML = categoryOptions(tipoSelect.value); });

  document.getElementById('tx-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = {
      desc: document.getElementById('tx-desc').value,
      val: document.getElementById('tx-val').value,
      tipo: tipoSelect.value,
      date: document.getElementById('tx-date').value,
      contaId: document.getElementById('tx-conta').value,
      cat: catSelect.value,
      status: document.getElementById('tx-status').value
    };
    const parcelas = Number(document.getElementById('tx-parcelas').value) || 1;

    if (!form.contaId) { showToast('Cadastre uma conta ou cartão antes de lançar uma transação.', 'error'); return; }

    if (parcelas > 1 && form.tipo === 'despesa') {
      const count = await createInstallmentPurchase({ desc: form.desc, total: Number(form.val), count: parcelas, baseDate: form.date, cardId: form.contaId, cat: form.cat });
      showToast(`${count} parcelas lançadas com sucesso.`, 'success');
    } else {
      await saveTransaction(form, editingId);
      showToast(editingId ? 'Transação atualizada.' : 'Transação registrada.', 'success');
    }
    editingId = null;
    renderTransactions(root);
  });

  document.getElementById('btn-cancel-edit').addEventListener('click', () => { editingId = null; renderTransactions(root); });

  root.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => {
    const tx = items.find((t) => String(t.id) === btn.dataset.edit);
    if (!tx) return;
    editingId = tx.id;
    document.getElementById('form-title').textContent = 'Editar Transação';
    document.getElementById('btn-cancel-edit').style.display = 'inline-flex';
    document.getElementById('tx-desc').value = tx.desc;
    document.getElementById('tx-val').value = tx.val;
    tipoSelect.value = tx.tipo;
    catSelect.innerHTML = categoryOptions(tx.tipo);
    catSelect.value = tx.cat || '';
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-conta').value = tx.contaId || '';
    document.getElementById('tx-status').value = tx.status || 'pago';
    document.getElementById('tx-form').scrollIntoView({ behavior: 'smooth' });
  }));

  root.querySelectorAll('[data-remove]').forEach((btn) => btn.addEventListener('click', async () => {
    await removeTransaction(Number(btn.dataset.remove));
    showToast('Transação removida.');
    renderTransactions(root);
  }));
}
