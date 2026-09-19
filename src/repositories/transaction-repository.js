import { getData, mutate } from '../core/store.js';

export function listTransactions() { return getData().transacoes; }

export function listByMonth(yyyyMm) {
  return listTransactions().filter((t) => (t.date || '').startsWith(yyyyMm));
}

export async function addTransaction(tx) {
  await mutate((data) => { data.transacoes.push(tx); return data; });
}

export async function updateTransaction(id, patch) {
  await mutate((data) => {
    const idx = data.transacoes.findIndex((t) => t.id === id);
    if (idx !== -1) data.transacoes[idx] = { ...data.transacoes[idx], ...patch };
    return data;
  });
}

export async function removeTransaction(id) {
  await mutate((data) => { data.transacoes = data.transacoes.filter((t) => t.id !== id); return data; });
}

export async function addMany(list) {
  await mutate((data) => { data.transacoes.push(...list); return data; });
}

export function nextId() { return Date.now() + Math.floor(Math.random() * 1000); }
