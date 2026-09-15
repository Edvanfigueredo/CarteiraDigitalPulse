import { getMeta, updatePreferences } from '../core/store.js';
import { clamp } from '../utils/format.js';

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
}

export async function toggleTheme() {
  const next = getPreferences().theme === 'dark' ? 'light' : 'dark';
  await setPreference('theme', next);
}
