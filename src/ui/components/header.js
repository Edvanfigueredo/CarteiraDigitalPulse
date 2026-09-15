import { onNavigate, currentView } from '../../core/router.js';
import { toggleTheme, applyPreferencesToDom } from '../../services/preferences-service.js';
import { getMeta } from '../../core/store.js';
import { escapeHtml } from '../../utils/sanitize.js';

const TITLES = {
  dashboard: 'Visão Geral', transacoes: 'Transações', contas: 'Contas e Cartões',
  categorias: 'Categorias', planejamento: 'Orçamentos & Metas', patrimonio: 'Bens & Dívidas',
  relatorios: 'Relatórios', meses: 'Histórico mensal', educacao: 'Aprender',
  inteligencia: 'Pulse IA', importacao: 'Importar dados', configuracoes: 'Ajustes'
};

export function renderHeader() {
  const name = getMeta().profileName || 'Participante';
  document.getElementById('header-root').innerHTML = `
    <header class="app-header">
      <div class="header-left">
        <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false">
          <i class="fa-solid fa-bars"></i>
        </button>
        <h1 class="page-title" id="page-title">${escapeHtml(TITLES[currentView()])}</h1>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary btn-sm" id="btn-theme" type="button" title="Alternar tema claro/escuro">
          <i class="fa-solid fa-circle-half-stroke"></i>
        </button>
        <span class="badge" id="user-badge">${escapeHtml(name)}</span>
      </div>
    </header>`;

  document.getElementById('menu-toggle').addEventListener('click', () => {
    const opening = !document.body.classList.contains('sidebar-open');
    document.body.classList.toggle('sidebar-open', opening);
    document.getElementById('menu-toggle').setAttribute('aria-expanded', String(opening));
  });

  document.getElementById('btn-theme').addEventListener('click', async () => {
    await toggleTheme();
    applyPreferencesToDom();
  });

  const unsubscribe = onNavigate((view) => { const el = document.getElementById('page-title'); if (el) el.textContent = TITLES[view] || ''; });
  return unsubscribe;
}

export function updateHeaderName() {
  const el = document.getElementById('user-badge');
  if (el) el.textContent = getMeta().profileName || 'Participante';
}
