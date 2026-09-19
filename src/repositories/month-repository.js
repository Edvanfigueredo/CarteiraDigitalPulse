import { getData, mutate } from '../core/store.js';
import { currentMonth } from '../utils/format.js';

// Observação de arquitetura: categorias, contas, cartões, orçamentos e metas
// são entidades globais (não presas a um mês específico) — por isso já ficam
// automaticamente disponíveis em qualquer mês novo, sem necessidade de um
// passo manual de "copiar". O que É específico de cada mês são as
// transações, que nunca são duplicadas ao criar um novo mês.

export function listMonths() {
  const data = getData();
  const fromTx = new Set(
    (data.transacoes || [])
      .filter((t) => /^\d{4}-\d{2}/.test(t.date || ''))
      .map((t) => t.date.slice(0, 7))
  );
  (data.months || []).forEach((m) => fromTx.add(m));
  fromTx.add(currentMonth());
  return Array.from(fromTx).sort().reverse();
}

export async function createMonth(yyyyMm) {
  await mutate((data) => {
    data.months = Array.from(new Set([...(data.months || []), yyyyMm]));
    return data;
  });
}
