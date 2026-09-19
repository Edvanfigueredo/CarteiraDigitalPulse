import { listAccounts, addAccount, removeAccount } from '../../repositories/account-repository.js';
import { listCards, addCard, removeCard } from '../../repositories/card-repository.js';
import { money } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { showToast } from '../components/toast.js';

export function renderAccounts(root) {
  const contas = listAccounts();
  const cartoes = listCards();

  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Contas Bancárias</h3></div>
      <form id="conta-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="conta-nome">Instituição</label><input id="conta-nome" required placeholder="Ex: Nubank" /></div>
        <div class="field"><label for="conta-saldo">Saldo inicial</label><input id="conta-saldo" type="number" step="0.01" inputmode="decimal" placeholder="0,00" /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">+ Conta</button></div>
      </form>
      ${contas.length ? `<div class="table-wrap"><table><thead><tr><th>Instituição</th><th>Saldo</th><th>Ação</th></tr></thead><tbody>
        ${contas.map((c) => `<tr>
          <td data-label="Instituição">${escapeHtml(c.nome)}</td>
          <td data-label="Saldo">${money(c.saldo)}</td>
          <td data-label="Ação"><button class="btn btn-ghost btn-sm" type="button" data-remove-conta="${c.id}"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('')}
      </tbody></table></div>` : emptyStateHtml({ icon: 'fa-building-columns', title: 'Nenhuma conta cadastrada', text: 'Adicione uma conta bancária para começar a lançar transações.' })}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Cartões de Crédito</h3></div>
      <form id="cartao-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="cartao-nome">Cartão</label><input id="cartao-nome" required placeholder="Ex: Nubank Mastercard" /></div>
        <div class="field"><label for="cartao-limite">Limite total</label><input id="cartao-limite" type="number" step="0.01" inputmode="decimal" placeholder="0,00" /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">+ Cartão</button></div>
      </form>
      ${cartoes.length ? `<div class="table-wrap"><table><thead><tr><th>Cartão</th><th>Limite Total</th><th>Ação</th></tr></thead><tbody>
        ${cartoes.map((c) => `<tr>
          <td data-label="Cartão">${escapeHtml(c.nome)}</td>
          <td data-label="Limite Total">${money(c.limite)}</td>
          <td data-label="Ação"><button class="btn btn-ghost btn-sm" type="button" data-remove-cartao="${c.id}"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('')}
      </tbody></table></div>` : emptyStateHtml({ icon: 'fa-credit-card', title: 'Nenhum cartão cadastrado', text: 'Adicione um cartão para lançar compras parceladas.' })}
    </div>`;

  document.getElementById('conta-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addAccount({ nome: document.getElementById('conta-nome').value, saldo: document.getElementById('conta-saldo').value });
    showToast('Conta adicionada.', 'success');
    renderAccounts(root);
  });
  document.getElementById('cartao-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addCard({ nome: document.getElementById('cartao-nome').value, limite: document.getElementById('cartao-limite').value });
    showToast('Cartão adicionado.', 'success');
    renderAccounts(root);
  });
  root.querySelectorAll('[data-remove-conta]').forEach((btn) => btn.addEventListener('click', async () => { await removeAccount(Number(btn.dataset.removeConta)); renderAccounts(root); }));
  root.querySelectorAll('[data-remove-cartao]').forEach((btn) => btn.addEventListener('click', async () => { await removeCard(Number(btn.dataset.removeCartao)); renderAccounts(root); }));
}
