import { listCategories, addCategory, removeCategory } from '../../repositories/category-repository.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { showToast } from '../components/toast.js';

export function renderCategories(root) {
  const categorias = listCategories();

  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Categorias Personalizadas</h3></div>
      <form id="cat-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="cat-nome">Nome</label><input id="cat-nome" required placeholder="Ex: Educação" /></div>
        <div class="field"><label for="cat-tipo">Tipo</label>
          <select id="cat-tipo"><option value="despesa">Despesa (-)</option><option value="receita">Receita (+)</option></select>
        </div>
        <div class="field" style="flex-direction:row;align-items:center;gap:8px;">
          <input id="cat-essencial" type="checkbox" style="width:auto;min-height:auto;" />
          <label for="cat-essencial" style="margin:0;">Despesa essencial</label>
        </div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">+ Categoria</button></div>
      </form>
      ${categorias.length ? `<div class="table-wrap"><table><thead><tr><th>Categoria</th><th>Tipo</th><th>Ação</th></tr></thead><tbody>
        ${categorias.map((c) => `<tr>
          <td data-label="Categoria">${escapeHtml(c.nome)}${c.essencial ? ' <span class="badge">Essencial</span>' : ''}</td>
          <td data-label="Tipo"><span class="badge ${c.tipo === 'receita' ? 'badge-success' : ''}">${c.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td>
          <td data-label="Ação"><button class="btn btn-ghost btn-sm" type="button" data-remove="${c.id}"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('')}
      </tbody></table></div>` : emptyStateHtml({ icon: 'fa-tags', title: 'Nenhuma categoria cadastrada', text: 'Crie categorias para organizar suas receitas e despesas.' })}
    </div>`;

  document.getElementById('cat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addCategory({
      nome: document.getElementById('cat-nome').value,
      tipo: document.getElementById('cat-tipo').value,
      essencial: document.getElementById('cat-essencial').checked
    });
    showToast('Categoria adicionada.', 'success');
    renderCategories(root);
  });
  root.querySelectorAll('[data-remove]').forEach((btn) => btn.addEventListener('click', async () => { await removeCategory(Number(btn.dataset.remove)); renderCategories(root); }));
}
