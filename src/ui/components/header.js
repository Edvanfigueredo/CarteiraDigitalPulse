import { onNavigate, currentView } from '../../core/router.js';
<<<<<<< HEAD
import { toggleTheme, applyPreferencesToDom, togglePrivacyMode, getPreferences } from '../../services/preferences-service.js';
=======
import { toggleTheme, applyPreferencesToDom } from '../../services/preferences-service.js';
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
import { getMeta } from '../../core/store.js';
import { escapeHtml } from '../../utils/sanitize.js';

const TITLES = {
<<<<<<< HEAD
  dashboard: 'Visão Geral', calendario: 'Calendário', previsao: 'Previsão', saude: 'Saúde Financeira', transacoes: 'Transações', contas: 'Contas e Cartões',
  categorias: 'Categorias', planejamento: 'Orçamentos & Metas', patrimonio: 'Bens & Dívidas', carreira: 'Carreira Financeira',
=======
  dashboard: 'Visão Geral', transacoes: 'Transações', contas: 'Contas e Cartões',
  categorias: 'Categorias', planejamento: 'Orçamentos & Metas', patrimonio: 'Bens & Dívidas',
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
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
<<<<<<< HEAD
        <button class="btn btn-secondary btn-sm" id="btn-privacy" type="button" title="Ativar/desativar Modo Privado (oculta valores)">
          <i class="fa-solid ${getPreferences().privacyMode ? 'fa-eye-slash' : 'fa-eye'}"></i>
        </button>
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
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

<<<<<<< HEAD
  document.getElementById('btn-privacy').addEventListener('click', async () => {
    await togglePrivacyMode();
    const icon = document.querySelector('#btn-privacy i');
    if (icon) icon.className = `fa-solid ${getPreferences().privacyMode ? 'fa-eye-slash' : 'fa-eye'}`;
  });

=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
  const unsubscribe = onNavigate((view) => { const el = document.getElementById('page-title'); if (el) el.textContent = TITLES[view] || ''; });
  return unsubscribe;
}

export function updateHeaderName() {
  const el = document.getElementById('user-badge');
  if (el) el.textContent = getMeta().profileName || 'Participante';
}
