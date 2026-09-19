import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '<div id="app-root"></div>';
});

describe('Regra do último dia útil', () => {
  it('recua para sexta quando o último dia do mês cai no sábado ou domingo', async () => {
    const { lastBusinessDayOfMonth, toISODate } = await import('../src/utils/dates.js');
    // Novembro/2025 termina num domingo (30/11/2025) — checagem via Date nativa
    const nov2025LastDay = new Date(2025, 10, 30);
    expect(nov2025LastDay.getDay()).toBe(0); // domingo, garante a premissa do teste

    const result = lastBusinessDayOfMonth(2025, 10);
    expect(toISODate(result)).toBe('2025-11-28'); // sexta-feira anterior
  });

  it('mantém o próprio último dia quando ele já é útil', async () => {
    const { lastBusinessDayOfMonth, toISODate } = await import('../src/utils/dates.js');
    // Setembro/2026 termina numa quarta-feira
    const result = lastBusinessDayOfMonth(2026, 8);
    expect(toISODate(result)).toBe('2026-09-30');
  });
});

describe('Sistema de dívidas e parcelas (seções 4-6)', () => {
  it('gera parcelas cujo somatório fecha exatamente com o valor total', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addDebt, listDebts } = await import('../src/repositories/debt-repository.js');

    await addDebt({
      nome: 'Notebook Teste', categoria: 'Eletrônicos', valorTotal: 3600,
      parcelada: true, numParcelas: 12, primeiroVencimento: '2026-10-10', contaId: 'cartao_1'
    });

    const debt = listDebts().find((d) => d.nome === 'Notebook Teste');
    const sum = debt.parcelas.reduce((a, p) => a + p.valor, 0);

    expect(debt.parcelas.length).toBe(12);
    expect(Math.round(sum * 100) / 100).toBe(3600);
    expect(debt.parcelas[0].vencimento).toBe('2026-10-10');
    expect(debt.parcelas[11].vencimento).toBe('2027-09-10');
    expect(debt.status).toBe('aberta');
  });

  it('pagar uma parcela cria a transação real e a mesma some das pendências', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addDebt, listDebts, pendingInstallments } = await import('../src/repositories/debt-repository.js');
    const { payInstallment } = await import('../src/services/debt-service.js');
    const { listTransactions } = await import('../src/repositories/transaction-repository.js');

    await addDebt({ nome: 'Curso Teste', categoria: 'Educação', valorTotal: 900, parcelada: true, numParcelas: 3, primeiroVencimento: '2026-11-05', contaId: 'conta_1' });
    const debt = listDebts().find((d) => d.nome === 'Curso Teste');
    const pendingBefore = pendingInstallments().filter((p) => p.dividaId === debt.id).length;

    await payInstallment(debt.id, 1, {});

    const pendingAfter = pendingInstallments().filter((p) => p.dividaId === debt.id).length;
    const tx = listTransactions().find((t) => t.desc.includes('Curso Teste') && t.desc.includes('1/3'));

    expect(pendingBefore).toBe(3);
    expect(pendingAfter).toBe(2);
    expect(tx).toBeTruthy();
    expect(tx.val).toBe(300);
    expect(tx.tipo).toBe('despesa');
  });

  it('dívida fica "quitada" somente quando a última parcela é paga, e não some antes disso', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addDebt, listDebts } = await import('../src/repositories/debt-repository.js');
    const { payInstallment } = await import('../src/services/debt-service.js');

    await addDebt({ nome: 'Empréstimo Teste', categoria: 'Geral', valorTotal: 200, parcelada: true, numParcelas: 2, primeiroVencimento: '2026-12-01', contaId: 'conta_1' });
    const debt = listDebts().find((d) => d.nome === 'Empréstimo Teste');

    await payInstallment(debt.id, 1, {});
    let current = listDebts().find((d) => d.id === debt.id);
    expect(current.status).toBe('aberta'); // ainda falta 1 parcela — dívida não desaparece nem "quita" cedo

    await payInstallment(debt.id, 2, {});
    current = listDebts().find((d) => d.id === debt.id);
    expect(current.status).toBe('quitada');
  });

  it('desfazer pagamento remove a transação e volta a parcela para pendente', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addDebt, listDebts } = await import('../src/repositories/debt-repository.js');
    const { payInstallment, undoInstallmentPayment } = await import('../src/services/debt-service.js');
    const { listTransactions } = await import('../src/repositories/transaction-repository.js');

    await addDebt({ nome: 'Assinatura Teste', categoria: 'Geral', valorTotal: 50, parcelada: false, contaId: 'conta_1', primeiroVencimento: '2026-09-15' });
    const debt = listDebts().find((d) => d.nome === 'Assinatura Teste');

    await payInstallment(debt.id, 1, {});
    expect(listTransactions().some((t) => t.desc === 'Assinatura Teste')).toBe(true);

    await undoInstallmentPayment(debt.id, 1);
    expect(listTransactions().some((t) => t.desc === 'Assinatura Teste')).toBe(false);
    expect(listDebts().find((d) => d.id === debt.id).parcelas[0].status).toBe('pendente');
  });
});

describe('Calendário financeiro consolidado (seção 10)', () => {
  it('mostra parcela pendente de dívida no dia do vencimento', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addDebt } = await import('../src/repositories/debt-repository.js');
    const { getMonthEvents } = await import('../src/services/calendar-service.js');

    await addDebt({ nome: 'Financiamento Teste', categoria: 'Geral', valorTotal: 1200, parcelada: true, numParcelas: 4, primeiroVencimento: '2026-09-08', contaId: 'conta_1' });

    const events = getMonthEvents('2026-09');
    const found = events.find((e) => e.desc.includes('Financiamento Teste'));
    expect(found).toBeTruthy();
    expect(found.date).toBe('2026-09-08');
    expect(found.status).toBe('projetado');
  });

  it('renda recorrente no último dia útil aparece automaticamente no calendário do mês', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addRecurringIncome } = await import('../src/repositories/recurring-repository.js');
    const { getMonthEvents } = await import('../src/services/calendar-service.js');

    await addRecurringIncome({ desc: 'Salário Teste', val: 4200, ultimoDiaUtil: true, contaId: 'conta_1' });

    const events = getMonthEvents('2025-11'); // novembro/2025 termina domingo → cai dia 28
    const found = events.find((e) => e.desc === 'Salário Teste');
    expect(found).toBeTruthy();
    expect(found.date).toBe('2025-11-28');
    expect(found.tipo).toBe('receita');
  });

  it('não duplica quando já existe uma transação real igual à recorrência projetada', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addRecurringExpense } = await import('../src/repositories/recurring-repository.js');
    const { addTransaction } = await import('../src/repositories/transaction-repository.js');
    const { getMonthEvents } = await import('../src/services/calendar-service.js');

    await addRecurringExpense({ desc: 'Aluguel Teste', val: 1000, diaVencimento: 5, contaId: 'conta_1' });
    await addTransaction({ id: 999001, desc: 'Aluguel Teste', val: 1000, tipo: 'despesa', date: '2026-09-05', contaId: 'conta_1', cat: 'Moradia', status: 'pago' });

    const events = getMonthEvents('2026-09');
    const matches = events.filter((e) => e.desc.includes('Aluguel Teste'));
    expect(matches.length).toBe(1);
    expect(matches[0].status).toBe('pago');
  });
});
