import { navigate, onNavigate, currentView } from '../../core/router.js';
import { updateMeta } from '../../core/store.js';

const NAV_ITEMS = [
  { view: 'dashboard', icon: 'fa-chart-pie', label: 'Visão Geral' },
  { view: 'calendario', icon: 'fa-calendar-check', label: 'Calendário' },
  { view: 'previsao', icon: 'fa-arrow-trend-up', label: 'Previsão' },
  { view: 'saude', icon: 'fa-heart-pulse', label: 'Saúde Financeira' },
  { view: 'transacoes', icon: 'fa-arrow-right-arrow-left', label: 'Transações' },
  { view: 'contas', icon: 'fa-building-columns', label: 'Contas e Cartões' },
  { view: 'categorias', icon: 'fa-tags', label: 'Categorias' },
  { view: 'planejamento', icon: 'fa-bullseye', label: 'Orçamentos & Metas' },
  { view: 'patrimonio', icon: 'fa-scale-balanced', label: 'Bens & Dívidas' },
  { view: 'carreira', icon: 'fa-briefcase', label: 'Carreira' },
  { view: 'relatorios', icon: 'fa-chart-line', label: 'Relatórios' },
  { view: 'meses', icon: 'fa-calendar-days', label: 'Histórico mensal' },
  { view: 'educacao', icon: 'fa-book-open', label: 'Aprender' },
  { view: 'inteligencia', icon: 'fa-sparkles', label: 'Pulse IA' },
  { view: 'importacao', icon: 'fa-file-arrow-up', label: 'Importar dados' },
  { view: 'configuracoes', icon: 'fa-sliders', label: 'Ajustes' }
];

function closeMobileMenu() { document.body.classList.remove('sidebar-open'); }
function openMobileMenu() { document.body.classList.add('sidebar-open'); }

export function renderSidebar() {
  const nav = NAV_ITEMS.map((item) => `
    <button class="nav-item" type="button" data-view="${item.view}">
      <i class="fa-solid ${item.icon}"></i><span>${item.label}</span>
    </button>`).join('');

  const html = `
    <aside class="sidebar" id="sidebar">
      <div>
        <div class="brand">
          <div class="brand-title">PULSE</div>
          <div class="brand-slogan">FINANÇAS</div>
        </div>
        <nav class="nav-list">${nav}</nav>
      </div>
      <div class="sidebar-footer">
        <button class="btn btn-red btn-block btn-sm" id="btn-logout" type="button">
          <i class="fa-solid fa-right-from-bracket"></i> Trocar de perfil
        </button>
      </div>
    </aside>
    <button class="sidebar-overlay" id="sidebar-overlay" aria-label="Fechar menu" type="button"></button>`;

  document.getElementById('sidebar-root').innerHTML = html;

  document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => { navigate(btn.dataset.view); closeMobileMenu(); });
  });
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileMenu);
  document.getElementById('btn-logout').addEventListener('click', async () => {
    if (!confirm('Deseja trocar de perfil? Seus dados continuarão salvos neste navegador.')) return;
    await updateMeta({ onboarded: false });
    location.reload();
  });

  function updateActive(view) {
    document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }
  updateActive(currentView());
  const unsubscribe = onNavigate(updateActive);

  return { closeMobileMenu, openMobileMenu, unsubscribe };
}
