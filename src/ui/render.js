import { renderSidebar } from './components/sidebar.js';
import { renderHeader, updateHeaderName } from './components/header.js';
import { onNavigate, currentView } from '../core/router.js';
import { subscribe } from '../core/store.js';

import { renderDashboard } from './views/dashboard-view.js';
<<<<<<< HEAD
import { renderCalendar } from './views/calendar-view.js';
import { renderForecast } from './views/forecast-view.js';
import { renderHealth } from './views/health-view.js';
import { renderCareer } from './views/career-view.js';
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
import { renderTransactions } from './views/transactions-view.js';
import { renderAccounts } from './views/accounts-view.js';
import { renderCategories } from './views/categories-view.js';
import { renderPlanning } from './views/planning-view.js';
import { renderNetWorth } from './views/networth-view.js';
import { renderReports } from './views/reports-view.js';
import { renderHistory } from './views/history-view.js';
import { renderLearn } from './views/learn-view.js';
import { renderAi } from './views/ai-view.js';
import { renderImport } from './views/import-view.js';
import { renderSettings } from './views/settings-view.js';

const VIEW_RENDERERS = {
  dashboard: renderDashboard,
<<<<<<< HEAD
  calendario: renderCalendar,
  previsao: renderForecast,
  saude: renderHealth,
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
  transacoes: renderTransactions,
  contas: renderAccounts,
  categorias: renderCategories,
  planejamento: renderPlanning,
  patrimonio: renderNetWorth,
<<<<<<< HEAD
  carreira: renderCareer,
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
  relatorios: renderReports,
  meses: renderHistory,
  educacao: renderLearn,
  inteligencia: renderAi,
  importacao: renderImport,
  configuracoes: (root) => renderSettings(root, {})
};

let activeUnsubscribers = [];

export function mountApp() {
  activeUnsubscribers.forEach((fn) => fn && fn());
  activeUnsubscribers = [];

  document.getElementById('app-root').innerHTML = `
    <div id="sidebar-root"></div>
    <div class="app-main">
      <div id="header-root"></div>
      <main id="view-container" class="view active"></main>
    </div>`;

  const sidebarHandle = renderSidebar();
  const headerUnsubscribe = renderHeader();
  activeUnsubscribers.push(sidebarHandle?.unsubscribe, headerUnsubscribe);

  function renderCurrent() {
    const view = currentView();
    const container = document.getElementById('view-container');
    const renderer = VIEW_RENDERERS[view] || renderDashboard;
    renderer(container);
  }

  renderCurrent();
  activeUnsubscribers.push(onNavigate(renderCurrent));
  activeUnsubscribers.push(subscribe(() => { renderCurrent(); updateHeaderName(); }));
}
