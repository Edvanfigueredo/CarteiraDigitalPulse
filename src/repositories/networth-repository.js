import { getData, mutate } from '../core/store.js';

export function listNetWorth() { return getData().patrimonio; }
export function listAssets() { return listNetWorth().filter((p) => p.tipo === 'ativo'); }
export function listLiabilities() { return listNetWorth().filter((p) => p.tipo === 'passivo'); }

export async function addItem({ tipo, nome, val }) {
  await mutate((data) => { data.patrimonio.push({ id: Date.now(), tipo, nome, val: Number(val) || 0 }); return data; });
}

export async function removeItem(id) {
  await mutate((data) => { data.patrimonio = data.patrimonio.filter((p) => p.id !== id); return data; });
}
