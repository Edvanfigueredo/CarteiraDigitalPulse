import { getData, mutate } from '../core/store.js';

export function listGoals() { return getData().metas; }

export async function addGoal({ desc, target, current, prazo, aporteMensal, categoria, prioridade, contaId }) {
  await mutate((data) => {
    data.metas.push({
      id: Date.now(),
      desc,
      target: Number(target) || 0,
      current: Number(current) || 0,
      prazo: prazo || null,
      aporteMensal: Number(aporteMensal) || 0,
      categoria: categoria || 'Geral',
      prioridade: prioridade || 'media',
      contaId: contaId || null
    });
    return data;
  });
}

export async function removeGoal(id) {
  await mutate((data) => { data.metas = data.metas.filter((m) => m.id !== id); return data; });
}

// Registra um aporte real: soma ao valor atual da meta (não substitui).
export async function addContribution(id, amount) {
  await mutate((data) => {
    const goal = data.metas.find((m) => m.id === id);
    if (goal) goal.current = Math.round((goal.current + (Number(amount) || 0)) * 100) / 100;
    return data;
  });
}
