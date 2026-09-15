import { getData, mutate } from '../core/store.js';

export function listCards() { return getData().cartoes; }

export async function addCard({ nome, limite }) {
  await mutate((data) => { data.cartoes.push({ id: Date.now(), nome, limite: Number(limite) || 0 }); return data; });
}

export async function removeCard(id) {
  await mutate((data) => { data.cartoes = data.cartoes.filter((c) => c.id !== id); return data; });
}
