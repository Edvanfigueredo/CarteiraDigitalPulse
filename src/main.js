import './styles/tokens.css';
import './styles/base.css';
import './styles/print.css';

import { initStore, getMeta } from './core/store.js';
import { applyPreferencesToDom } from './services/preferences-service.js';
import { renderOnboarding } from './ui/views/onboarding-view.js';
import { mountApp } from './ui/render.js';

async function bootstrap() {
  await initStore();
  applyPreferencesToDom();

  const root = document.getElementById('app-root');
  if (!getMeta().onboarded) {
    renderOnboarding(root, () => { applyPreferencesToDom(); mountApp(); });
  } else {
    mountApp();
  }
}

bootstrap();
