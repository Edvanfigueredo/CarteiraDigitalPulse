import { getData, mutate } from '../core/store.js';

export function listBudgets() { return getData().limites; }

export async function addBudget({ cat, val }) {
  await mutate((data) => { data.limites.push({ id: Date.now(), cat, val: Number(val) || 0 }); return data; });
}

export async function removeBudget(id) {
  await mutate((data) => { data.limites = data.limites.filter((l) => l.id !== id); return data; });
}

export function spentForCategory(cat, transacoes) {
  return transacoes
    .filter((t) => t.tipo === 'despesa' && (t.cat || '').toLowerCase() === (cat || '').toLowerCase())
    .reduce((sum, t) => sum + (t.val || 0), 0);
}
