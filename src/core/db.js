// Camada de armazenamento. Único módulo que fala diretamente com IndexedDB.
// UI -> Services -> Repositories -> Store -> (db.js) -> IndexedDB
// Isso permite, no futuro, trocar IndexedDB por chamadas de API sem tocar
// no restante da aplicação (basta reescrever este arquivo).

const DB_NAME = 'pulse-finance';
const DB_VERSION = 1;
const STORE = 'kv';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function idbDelete(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Fallback: se IndexedDB estiver indisponível (modo privado restrito em
// navegadores antigos), degrada para localStorage com o mesmo contrato.
export function isIndexedDbAvailable() {
  try { return typeof indexedDB !== 'undefined'; } catch { return false; }
}

const LS_PREFIX = 'pulse-finance:';
export const localFallback = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + key)); } catch { return undefined; }
  },
  set(key, value) {
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); } catch { /* quota excedida: ignora silenciosamente */ }
  }
};
