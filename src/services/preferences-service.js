import { getMeta, updatePreferences } from '../core/store.js';
import { clamp } from '../utils/format.js';
<<<<<<< HEAD
import { setPrivacyMode } from '../utils/privacy.js';
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078

export function getPreferences() { return getMeta().preferences; }

export async function setPreference(key, value) {
  await updatePreferences({ [key]: value });
}

export async function setFontScale(delta) {
  const current = getPreferences().fontScale;
  await updatePreferences({ fontScale: clamp(current + delta, 80, 130) });
}

export function applyPreferencesToDom() {
  const prefs = getPreferences();
  const root = document.documentElement;
  root.setAttribute('data-theme', prefs.theme);
  root.setAttribute('data-palette', prefs.palette);
  root.setAttribute('data-colorblind', prefs.colorMode === 'daltonico' ? 'true' : 'false');
  document.body.style.fontSize = `${clamp(prefs.fontScale, 80, 130)}%`;
<<<<<<< HEAD
  setPrivacyMode(prefs.privacyMode);
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
}

export async function toggleTheme() {
  const next = getPreferences().theme === 'dark' ? 'light' : 'dark';
  await setPreference('theme', next);
}
<<<<<<< HEAD

// A flag de privacidade é atualizada de forma síncrona ANTES de persistir/
// notificar: o `updatePreferences` dispara um re-render imediatamente (via
// store.subscribe), e esse re-render precisa já enxergar o novo valor de
// `isPrivacyActive()` — senão a tela só mascara/desmascara um clique depois.
export async function togglePrivacyMode() {
  const next = !getPreferences().privacyMode;
  setPrivacyMode(next);
  await setPreference('privacyMode', next);
}
=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
