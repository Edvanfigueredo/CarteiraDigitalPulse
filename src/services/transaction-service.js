import { addTransaction, updateTransaction, removeTransaction, addMany, nextId } from '../repositories/transaction-repository.js';

export async function saveTransaction(form, existingId) {
  const payload = {
    id: existingId ? Number(existingId) : nextId(),
    desc: form.desc?.trim() || 'Sem descrição',
    val: Math.abs(Number(form.val)) || 0,
    tipo: form.tipo,
    date: form.date,
    contaId: form.contaId,
    cat: form.cat || 'Geral',
    tag: form.tag || '',
    status: form.status || 'pago'
  };
  if (existingId) await updateTransaction(payload.id, payload);
  else await addTransaction(payload);
}

export async function deleteTransaction(id) {
  await removeTransaction(id);
}

// Divide uma compra em N parcelas mensais, empurrando a última parcela para
// absorver o resto do arredondamento (evita diferenças de centavos).
export function nextMonthDate(dateStr, offset) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1 + offset, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const adjustedDay = Math.min(day, lastDay);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;
}

export async function createInstallmentPurchase({ desc, total, count, baseDate, cardId, cat }) {
  const group = nextId();
  const portion = Math.round((total / count) * 100) / 100;
  const items = [];
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const val = isLast ? Math.round((total - portion * (count - 1)) * 100) / 100 : portion;
    items.push({
      id: group + i,
      desc,
      val,
      tipo: 'despesa',
      date: nextMonthDate(baseDate, i),
      contaId: cardId,
      cat,
      tag: `Parcela ${i + 1}/${count}`,
      status: i === 0 ? 'pago' : 'pendente',
      installmentGroup: group
    });
  }
  await addMany(items);
  return items.length;
}
