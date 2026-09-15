import { getData, mutate } from '../core/store.js';

export function listGoals() { return getData().metas; }

export async function addGoal({ desc, target, current }) {
  await mutate((data) => {
    data.metas.push({ id: Date.now(), desc, target: Number(target) || 0, current: Number(current) || 0 });
    return data;
  });
}

export async function removeGoal(id) {
  await mutate((data) => { data.metas = data.metas.filter((m) => m.id !== id); return data; });
}
