// Store central: mantém o estado em memória, persiste no IndexedDB (com
// fallback em localStorage) e notifica assinantes (a UI) quando algo muda.
// Repositórios leem/escrevem através deste módulo — nunca direto no db.js.

import { idbGet, idbSet, isIndexedDbAvailable, localFallback } from './db.js';
import { emptyDataset, demoDataset, defaultMeta, validateDataset } from '../models/schema.js';

let meta = defaultMeta();
let datasets = { real: emptyDataset(), demo: demoDataset() };
let ready = false;
const listeners = new Set();

async function persistMeta() {
  if (isIndexedDbAvailable()) { try { await idbSet('meta', meta); return; } catch { /* cai no fallback abaixo */ } }
  localFallback.set('meta', meta);
}

async function persistDataset(id) {
  if (isIndexedDbAvailable()) { try { await idbSet(`dataset:${id}`, datasets[id]); return; } catch { /* cai no fallback abaixo */ } }
  localFallback.set(`dataset:${id}`, datasets[id]);
}

export async function initStore() {
  let loadedMeta, loadedReal, loadedDemo;
  if (isIndexedDbAvailable()) {
    try {
      [loadedMeta, loadedReal, loadedDemo] = await Promise.all([
        idbGet('meta'), idbGet('dataset:real'), idbGet('dataset:demo')
      ]);
    } catch { /* segue para fallback */ }
  }
  if (!loadedMeta) loadedMeta = localFallback.get('meta');
  if (!loadedReal) loadedReal = localFallback.get('dataset:real');
  if (!loadedDemo) loadedDemo = localFallback.get('dataset:demo');

  meta = loadedMeta && typeof loadedMeta === 'object'
    // Merge raso no nível de topo, mas profundo em `preferences`: sem isso,
    // um usuário que já tinha dados salvos antes de uma preferência nova
    // existir (ex: Modo Privado) perderia esse campo por inteiro, porque o
    // objeto `preferences` salvo sobrescreveria o default inteiro.
    ? { ...defaultMeta(), ...loadedMeta, preferences: { ...defaultMeta().preferences, ...(loadedMeta.preferences || {}) } }
    : defaultMeta();
  datasets.real = loadedReal ? validateDataset(loadedReal) : emptyDataset();
  datasets.demo = loadedDemo ? validateDataset(loadedDemo) : demoDataset();

  if (!loadedReal) await persistDataset('real');
  if (!loadedDemo) await persistDataset('demo');
  if (!loadedMeta) await persistMeta();

  ready = true;
  notify();
}

export function isReady() { return ready; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() { listeners.forEach((fn) => fn()); }

// ---------- Meta (perfil, preferências, dataset ativo) ----------
export function getMeta() { return meta; }

export async function updateMeta(partial) {
  meta = { ...meta, ...partial };
  await persistMeta();
  notify();
}

export async function updatePreferences(partial) {
  meta = { ...meta, preferences: { ...meta.preferences, ...partial } };
  await persistMeta();
  notify();
}

// ---------- Dataset ativo ----------
export function getActiveDatasetId() { return meta.activeDataset; }

export function getData() { return datasets[meta.activeDataset]; }

export async function mutate(mutator) {
  // mutator recebe o dataset ativo e o modifica in-place (ou retorna um novo)
  const id = meta.activeDataset;
  const result = mutator(datasets[id]);
  if (result) datasets[id] = result;
  await persistDataset(id);
  notify();
}

export async function setActiveDataset(id) {
  if (id !== 'real' && id !== 'demo') return;
  await updateMeta({ activeDataset: id });
}

export async function resetDemoData() {
  datasets.demo = demoDataset();
  await persistDataset('demo');
  notify();
}

export async function wipeRealData() {
  datasets.real = emptyDataset();
  await persistDataset('real');
  notify();
}

export async function replaceRealData(newData) {
  datasets.real = validateDataset(newData);
  await persistDataset('real');
  notify();
}
