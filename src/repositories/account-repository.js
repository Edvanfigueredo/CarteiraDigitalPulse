import { getData, mutate } from '../core/store.js';

export function listAccounts() { return getData().contas; }

export async function addAccount({ nome, saldo }) {
  await mutate((data) => { data.contas.push({ id: Date.now(), nome, saldo: Number(saldo) || 0 }); return data; });
}

export async function removeAccount(id) {
  await mutate((data) => { data.contas = data.contas.filter((c) => c.id !== id); return data; });
}
