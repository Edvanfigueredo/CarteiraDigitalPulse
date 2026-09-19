import { listTransactions } from '../repositories/transaction-repository.js';
import { listCategories } from '../repositories/category-repository.js';

export function buildStaging(items, destinoId) {
  const existing = listTransactions();
  const categorias = listCategories();
  const defaultCat = categorias[0]?.nome || 'Geral';

  return items.map((item, index) => {
    let matchStatus = 'novo';
    const exact = existing.find((t) => t.date === item.date && t.val === item.val && (t.desc || '').toLowerCase() === (item.desc || '').toLowerCase());
    if (exact) {
      matchStatus = 'duplicado_exato';
    } else {
      const partial = existing.find((t) => {
        if (t.val !== item.val || !t.date || !item.date) return false;
        const diffDays = Math.abs((new Date(t.date) - new Date(item.date)) / 86400000);
        return diffDays <= 3;
      });
      if (partial) matchStatus = 'duplicado_parcial';
    }

    const validCat = categorias.some((c) => c.nome.toLowerCase() === (item.cat || '').toLowerCase());

    return {
      idTemp: index,
      date: item.date,
      desc: item.desc,
      val: item.val,
      tipo: item.tipo,
      cat: validCat ? item.cat : defaultCat,
      contaId: destinoId,
      status: 'pago',
      matchStatus,
      observacao: ''
    };
  });
}

export function summarize(staging) {
  const income = staging.filter((s) => s.tipo === 'receita').reduce((a, s) => a + s.val, 0);
  const expenses = staging.filter((s) => s.tipo === 'despesa').reduce((a, s) => a + s.val, 0);
  const dates = staging.map((s) => s.date).filter(Boolean).sort();
  const duplicates = staging.filter((s) => s.matchStatus !== 'novo').length;
  return {
    count: staging.length,
    income,
    expenses,
    periodStart: dates[0] || null,
    periodEnd: dates[dates.length - 1] || null,
    duplicates
  };
}
