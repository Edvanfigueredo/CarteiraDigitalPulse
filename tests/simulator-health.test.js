import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '<div id="app-root"></div>';
});

describe('Simulador "E se?" (seção 16) — nunca altera dados reais', () => {
  it('renda/economia extra soma o mesmo valor a cada mês projetado, de forma cumulativa', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { simulateExtraMonthly, baseline } = await import('../src/services/simulator-service.js');
    const { currentMonth } = await import('../src/utils/format.js');

    await addAccount({ nome: 'Conta Simulador', saldo: 0 });
    const month = currentMonth();
    const base = baseline(month, 3);
    const withExtra = simulateExtraMonthly(month, 3, 100);

    // mês 1: +100; mês 2: +200 acumulado; mês 3: +300 acumulado
    expect(withExtra[0].closing - base[0].closing).toBe(100);
    expect(withExtra[1].closing - base[1].closing).toBe(200);
    expect(withExtra[2].closing - base[2].closing).toBe(300);
  });

  it('reduzir uma categoria em 50% diminui exatamente a metade da despesa daquela categoria', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addCategory } = await import('../src/repositories/category-repository.js');
    const { addTransaction } = await import('../src/repositories/transaction-repository.js');
    const { simulateReduceCategory, compareToBaseline } = await import('../src/services/simulator-service.js');
    const { currentMonth } = await import('../src/utils/format.js');

    await addAccount({ nome: 'Conta Categoria Sim', saldo: 0 });
    await addCategory({ nome: 'Lazer Sim', tipo: 'despesa' });
    const month = currentMonth();
    await addTransaction({ id: 777001, desc: 'Cinema', val: 200, tipo: 'despesa', date: `${month}-10`, contaId: 'conta_1', cat: 'Lazer Sim', status: 'pago' });

    const scenario = simulateReduceCategory(month, 1, 'Lazer Sim', 50);
    const compared = compareToBaseline(month, 1, scenario);

    expect(compared[0].diff).toBe(100); // economiza metade de 200
  });

  it('quitar uma dívida remove suas parcelas futuras pendentes da projeção', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addDebt, listDebts } = await import('../src/repositories/debt-repository.js');
    const { simulatePayOffDebt, compareToBaseline } = await import('../src/services/simulator-service.js');
    const { currentMonth } = await import('../src/utils/format.js');

    await addAccount({ nome: 'Conta Quitar Sim', saldo: 0 });
    const month = currentMonth();
    await addDebt({ nome: 'Dívida Quitar Sim', categoria: 'Geral', valorTotal: 300, parcelada: true, numParcelas: 3, primeiroVencimento: `${month}-05`, contaId: 'conta_1' });
    const debt = listDebts().find((d) => d.nome === 'Dívida Quitar Sim');

    const scenario = simulatePayOffDebt(month, 3, debt.id);
    const compared = compareToBaseline(month, 3, scenario);

    // O saldo simulado é cumulativo mês a mês: cada parcela removida
    // beneficia também todos os meses seguintes (carry-forward do saldo).
    // Por isso o ganho cresce a cada mês (100, depois 200, depois 300) em
    // vez de somar simplesmente 100+100+100 — o último mês reflete o total.
    expect(compared[0].diff).toBe(100);
    expect(compared[1].diff).toBe(200);
    expect(compared[2].diff).toBe(300);
  });
});

describe('Saúde Financeira (seção 18) — sempre com explicação, nunca só número', () => {
  it('classifica parcela de dívida e despesa recorrente como fixas, transação avulsa como variável', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addDebt } = await import('../src/repositories/debt-repository.js');
    const { addRecurringExpense } = await import('../src/repositories/recurring-repository.js');
    const { addTransaction } = await import('../src/repositories/transaction-repository.js');
    const { fixedVsVariable } = await import('../src/services/health-service.js');
    const { currentMonth } = await import('../src/utils/format.js');

    await addAccount({ nome: 'Conta Saúde', saldo: 0 });
    const month = currentMonth();
    const before = fixedVsVariable(month); // baseline ANTES de adicionar, já que
    // outros testes deste arquivo podem ter deixado dados no mesmo mês corrente.

    await addDebt({ nome: 'Parcela Saúde', categoria: 'Geral', valorTotal: 100, parcelada: false, primeiroVencimento: `${month}-20`, contaId: 'conta_1' });
    await addRecurringExpense({ desc: 'Aluguel Saúde', val: 150, diaVencimento: 5, contaId: 'conta_1' });
    await addTransaction({ id: 888001, desc: 'Passeio Saúde', val: 80, tipo: 'despesa', date: `${month}-12`, contaId: 'conta_1', cat: 'Lazer', status: 'pago' });

    const after = fixedVsVariable(month);
    expect(after.fixas - before.fixas).toBe(250); // 100 (parcela) + 150 (recorrente)
    expect(after.variaveis - before.variaveis).toBe(80); // só a transação avulsa
  });

  it('todo indicador retorna um texto explicativo, mesmo quando o score é nulo por falta de dado', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { buildHealthIndicators } = await import('../src/services/health-service.js');

    const indicators = buildHealthIndicators();
    indicators.forEach((ind) => {
      expect(typeof ind.text).toBe('string');
      expect(ind.text.length).toBeGreaterThan(0);
    });
  });
});
