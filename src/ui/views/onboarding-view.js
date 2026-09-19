import { updateMeta } from '../../core/store.js';

export function renderOnboarding(root, onDone) {
  root.innerHTML = `
    <div class="onboarding-screen">
      <div class="onboarding-card">
        <div class="onboarding-emoji" aria-hidden="true">👋</div>
        <h1>Olá! Vamos organizar sua vida financeira?</h1>
        <p>Seus dados ficam somente neste navegador. Não é uma conta online — apenas seu espaço pessoal e privado.</p>
        <form id="onboarding-form" class="field" style="text-align:left;">
          <label for="onboarding-name">Qual é o seu nome?</label>
          <input id="onboarding-name" name="name" required autocomplete="given-name" placeholder="Como você quer ser chamado(a)?" />
          <button class="btn btn-primary btn-block" type="submit" style="margin-top:8px;">Começar</button>
        </form>
        <p class="text-muted" style="font-size:0.75rem;">Você começará com o sistema zerado. Nenhum valor ou transação fictícia será criada.</p>
      </div>
    </div>`;

  document.getElementById('onboarding-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('onboarding-name').value.trim();
    if (!name) return;
    await updateMeta({ onboarded: true, profileName: name });
    onDone();
  });
}
