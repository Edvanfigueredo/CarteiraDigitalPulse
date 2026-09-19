import { getData, mutate } from '../core/store.js';

export function listRecurringIncomes() { return getData().rendasRecorrentes; }
export function listRecurringExpenses() { return getData().despesasRecorrentes; }
export function listActiveRecurringIncomes() { return listRecurringIncomes().filter((r) => r.ativo); }
export function listActiveRecurringExpenses() { return listRecurringExpenses().filter((r) => r.ativo); }

export async function addRecurringIncome(form) {
  const item = {
    id: Date.now(),
    desc: form.desc,
    val: Number(form.val) || 0,
    frequencia: form.frequencia || 'mensal',
    ultimoDiaUtil: !!form.ultimoDiaUtil,
    diaFixo: form.ultimoDiaUtil ? null : (Number(form.diaFixo) || 1),
    contaId: form.contaId || null,
    ativo: true
  };
  await mutate((data) => { data.rendasRecorrentes.push(item); return data; });
  return item;
}

export async function removeRecurringIncome(id) {
  await mutate((data) => { data.rendasRecorrentes = data.rendasRecorrentes.filter((r) => r.id !== id); return data; });
}

export async function toggleRecurringIncome(id, ativo) {
  await mutate((data) => {
    const item = data.rendasRecorrentes.find((r) => r.id === id);
    if (item) item.ativo = ativo;
    return data;
  });
}

export async function addRecurringExpense(form) {
  const item = {
    id: Date.now(),
    desc: form.desc,
    val: Number(form.val) || 0,
    diaVencimento: Number(form.diaVencimento) || 1,
    categoria: form.categoria || 'Geral',
    contaId: form.contaId || null,
    ativo: true
  };
  await mutate((data) => { data.despesasRecorrentes.push(item); return data; });
  return item;
}

export async function removeRecurringExpense(id) {
  await mutate((data) => { data.despesasRecorrentes = data.despesasRecorrentes.filter((r) => r.id !== id); return data; });
}

export async function toggleRecurringExpense(id, ativo) {
  await mutate((data) => {
    const item = data.despesasRecorrentes.find((r) => r.id === id);
    if (item) item.ativo = ativo;
    return data;
  });
}
