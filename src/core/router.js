// Router simples baseado em hash (#dashboard, #transacoes, ...).
// Suficiente para uma SPA estática sem backend, e preserva o back button.

const listeners = new Set();

export const VIEWS = [
<<<<<<< HEAD
  'dashboard', 'calendario', 'previsao', 'saude', 'transacoes', 'contas', 'categorias', 'planejamento',
  'patrimonio', 'carreira', 'relatorios', 'meses', 'educacao', 'inteligencia',
=======
  'dashboard', 'transacoes', 'contas', 'categorias', 'planejamento',
  'patrimonio', 'relatorios', 'meses', 'educacao', 'inteligencia',
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
  'importacao', 'configuracoes'
];

export function currentView() {
  const hash = (location.hash || '').replace('#', '');
  return VIEWS.includes(hash) ? hash : 'dashboard';
}

export function navigate(view) {
  if (!VIEWS.includes(view)) view = 'dashboard';
  if (location.hash.replace('#', '') === view) { emit(view); return; }
  location.hash = view;
}

function emit(view) { listeners.forEach((fn) => fn(view)); }

export function onNavigate(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

window.addEventListener('hashchange', () => emit(currentView()));
