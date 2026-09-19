import { listCareerEntries, addCareerEntry, removeCareerEntry } from '../../repositories/career-repository.js';
import { careerCorrelation } from '../../services/career-service.js';
import { lineForecast } from '../components/charts.js';
import { money, todayISO } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { emptyStateHtml } from '../components/empty-state.js';
import { showToast } from '../components/toast.js';

export function renderCareer(root) {
  const entries = listCareerEntries();
  const correlation = careerCorrelation();

  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Histórico Profissional</h3></div>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:14px;">Recurso opcional — registre sua trajetória para dar contexto à evolução financeira. Não afeta nenhum cálculo do app.</p>
      <form id="career-form" class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label for="career-cargo">Cargo</label><input id="career-cargo" required placeholder="Ex: Analista de Sistemas" /></div>
        <div class="field"><label for="career-empresa">Empresa</label><input id="career-empresa" placeholder="Ex: Empresa XYZ" /></div>
        <div class="field"><label for="career-salario">Salário</label><input id="career-salario" type="number" step="0.01" placeholder="0,00" /></div>
        <div class="field"><label for="career-inicio">Início</label><input id="career-inicio" type="date" value="${todayISO()}" /></div>
        <div class="field"><label for="career-beneficios">Benefícios</label><input id="career-beneficios" placeholder="Opcional" /></div>
        <div class="form-actions" style="grid-column:1/-1;"><button class="btn btn-primary" type="submit">+ Registrar</button></div>
      </form>
      ${entries.length ? `<div class="table-wrap"><table><thead><tr><th>Cargo</th><th>Empresa</th><th>Salário</th><th>Início</th><th></th></tr></thead><tbody>
        ${entries.map((c) => `<tr>
          <td data-label="Cargo">${escapeHtml(c.cargo)}</td>
          <td data-label="Empresa">${escapeHtml(c.empresa || '—')}</td>
          <td data-label="Salário">${money(c.salario)}</td>
          <td data-label="Início">${escapeHtml(c.dataInicio || '—')}</td>
          <td data-label=""><button class="btn btn-ghost btn-sm" type="button" data-remove="${c.id}"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('')}
      </tbody></table></div>` : emptyStateHtml({ icon: 'fa-briefcase', title: 'Nenhum registro ainda', text: 'Registre seu histórico profissional para acompanhar sua trajetória.' })}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Renda x Patrimônio x Despesas (por ano)</h3></div>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:12px;">Calculado a partir das suas transações reais lançadas em cada ano — não do salário informado acima.</p>
      ${correlation.length ? `
        <div class="chart-wrap"><canvas id="chart-career"></canvas></div>
        <div class="table-wrap" style="margin-top:14px;"><table><thead><tr><th>Ano</th><th>Renda</th><th>Despesas</th><th>Poupança</th><th>Patrimônio</th></tr></thead><tbody>
          ${correlation.map((c) => `<tr>
            <td data-label="Ano">${c.year}</td>
            <td data-label="Renda" class="val-plus">${money(c.renda)}</td>
            <td data-label="Despesas" class="val-minus">${money(c.despesas)}</td>
            <td data-label="Poupança">${c.capacidadePoupanca === null ? '—' : `${c.capacidadePoupanca}%`}</td>
            <td data-label="Patrimônio">${c.patrimonio === null ? 'Sem registro' : money(c.patrimonio)}</td>
          </tr>`).join('')}
        </tbody></table></div>` : emptyStateHtml({ icon: 'fa-chart-line', title: 'Sem dados suficientes ainda', text: 'Lance receitas e despesas ao longo do tempo para ver essa evolução.' })}
    </div>`;

  document.getElementById('career-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addCareerEntry({
      cargo: document.getElementById('career-cargo').value,
      empresa: document.getElementById('career-empresa').value,
      salario: document.getElementById('career-salario').value,
      dataInicio: document.getElementById('career-inicio').value,
      beneficios: document.getElementById('career-beneficios').value
    });
    showToast('Registro adicionado.', 'success');
    renderCareer(root);
  });

  root.querySelectorAll('[data-remove]').forEach((btn) => btn.addEventListener('click', async () => { await removeCareerEntry(Number(btn.dataset.remove)); renderCareer(root); }));

  if (correlation.length) {
    const green = getComputedStyle(document.documentElement).getPropertyValue('--accent-green').trim() || '#10b981';
    lineForecast('chart-career', correlation.map((c) => c.year), correlation.map((c) => c.renda), 'Renda anual', green);
  }
}
