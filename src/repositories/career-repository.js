import { getData, mutate } from '../core/store.js';

export function listCareerEntries() {
  return [...getData().carreira].sort((a, b) => (b.dataInicio || '').localeCompare(a.dataInicio || ''));
}

export async function addCareerEntry({ cargo, empresa, salario, dataInicio, beneficios, observacoes }) {
  await mutate((data) => {
    data.carreira.push({
      id: Date.now(),
      cargo, empresa,
      salario: Number(salario) || 0,
      dataInicio: dataInicio || null,
      beneficios: beneficios || '',
      observacoes: observacoes || ''
    });
    return data;
  });
}

export async function removeCareerEntry(id) {
  await mutate((data) => { data.carreira = data.carreira.filter((c) => c.id !== id); return data; });
}
