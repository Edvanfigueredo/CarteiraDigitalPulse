import { listAssets, listLiabilities, addItem, removeItem } from '../../repositories/networth-repository.js';
import { money } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { showToast } from '../components/toast.js';

export function renderNetWorth(root) {
  const assets = listAssets();
  const liabilities = listLiabilities();
  const assetTotal = assets.reduce((a, p) => a + p.val, 0);
  const debtTotal = liabilities.reduce((a, p) => a + p.val, 0);

  root.innerHTML = `
    <div class="grid-2">
      <div class="card"><p class="card-eyebrow">Patrimônio líquido</p><h2 class="stat-value ${assetTotal - debtTotal >= 0 ? 'val-plus' : 'val-minus'}">${money(assetTotal - debtTotal)}</h2></div>
      <div class="card"><p class="card-eyebrow">Ativos − Passivos</p><p class="text-muted" style="margin-top:8px;">${money(assetTotal)} − ${money(debtTotal)}</p></div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Bens e Ativos</h3></div>
      <form id="asset-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="asset-nome">Item</label><input id="asset-nome" required placeholder="Ex: Carro, investimentos" /></div>
        <div class="field"><label for="asset-val">Valor</label><input id="asset-val" type="number" step="0.01" required placeholder="0,00" /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">+ Ativo</button></div>
      </form>
      ${assets.length ? `<div class="table-wrap"><table><thead><tr><th>Item</th><th>Valor</th><th>Ação</th></tr></thead><tbody>
        ${assets.map((a) => `<tr><td data-label="Item">${escapeHtml(a.nome)}</td><td data-label="Valor">${money(a.val)}</td><td data-label="Ação"><button class="btn btn-ghost btn-sm" type="button" data-remove="${a.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}
      </tbody></table></div>` : emptyStateHtml({ icon: 'fa-sack-dollar', title: 'Nenhum bem cadastrado', text: 'Adicione seus bens e ativos para calcular seu patrimônio.' })}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Dívidas e Passivos</h3></div>
      <form id="debt-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="debt-nome">Item</label><input id="debt-nome" required placeholder="Ex: Financiamento" /></div>
        <div class="field"><label for="debt-val">Valor</label><input id="debt-val" type="number" step="0.01" required placeholder="0,00" /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">+ Passivo</button></div>
      </form>
      ${liabilities.length ? `<div class="table-wrap"><table><thead><tr><th>Item</th><th>Valor</th><th>Ação</th></tr></thead><tbody>
        ${liabilities.map((a) => `<tr><td data-label="Item">${escapeHtml(a.nome)}</td><td data-label="Valor">${money(a.val)}</td><td data-label="Ação"><button class="btn btn-ghost btn-sm" type="button" data-remove="${a.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}
      </tbody></table></div>` : emptyStateHtml({ icon: 'fa-file-invoice-dollar', title: 'Nenhuma dívida cadastrada', text: 'Cadastre suas dívidas para acompanhar sua evolução.' })}
    </div>`;

  document.getElementById('asset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addItem({ tipo: 'ativo', nome: document.getElementById('asset-nome').value, val: document.getElementById('asset-val').value });
    showToast('Ativo adicionado.', 'success');
    renderNetWorth(root);
  });
  document.getElementById('debt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addItem({ tipo: 'passivo', nome: document.getElementById('debt-nome').value, val: document.getElementById('debt-val').value });
    showToast('Passivo adicionado.', 'success');
    renderNetWorth(root);
  });
  root.querySelectorAll('[data-remove]').forEach((btn) => btn.addEventListener('click', async () => { await removeItem(Number(btn.dataset.remove)); renderNetWorth(root); }));
}
