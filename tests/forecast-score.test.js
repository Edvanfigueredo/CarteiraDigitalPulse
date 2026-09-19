import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '<div id="app-root"></div>';
});

// A "Pulse Score" roda antes da "Previsão Financeira" neste arquivo de
// propósito: como os testes de um mesmo arquivo compartilham a mesma
// instância do store (sem resetModules), o teste que exige "nenhuma dívida
// em aberto" precisa rodar antes de qualquer teste que cadastre dívida.
describe('Pulse Score (seção 17) — transparente e explicável', () => {
  it('fator de dívidas é 100 quando não há saldo devedor', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { computePulseScore } = await import('../src/services/score-service.js');

    const result = computePulseScore();
    expect(result.factors.dividas.score).toBe(100);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('fator de orçamento reflete quantos orçamentos estão dentro do teto', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addCategory } = await import('../src/repositories/category-repository.js');
    const { addBudget } = await import('../src/repositories/budget-repository.js');
    const { saveTransaction } = await import('../src/services/transaction-service.js');
    const { currentMonth } = await import('../src/utils/format.js');
    const { computePulseScore } = await import('../src/services/score-service.js');

    await addAccount({ nome: 'Conta Score', saldo: 0 });
    await addCategory({ nome: 'Categoria Score', tipo: 'despesa' });
    await addBudget({ cat: 'Categoria Score', val: 100 });
    await saveTransaction({ desc: 'Gasto dentro do teto', val: 50, tipo: 'despesa', date: `${currentMonth()}-05`, contaId: 'conta_1', cat: 'Categoria Score', status: 'pago' });

    const result = computePulseScore();
    expect(result.factors.orcamento.score).toBe(100); // 1 de 1 orçamento dentro do teto
  });

  it('todos os fatores ficam sempre entre 0 e 100, mesmo sem nenhum dado cadastrado', async () => {
    const { computePulseScore } = await import('../src/services/score-service.js');

    const result = computePulseScore();
    Object.values(result.factors).forEach((f) => {
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(100);
      expect(typeof f.detail).toBe('string');
    });
  });
});

describe('Previsão Financeira (seção 15)', () => {
  it('projeta o saldo futuro somando renda e despesa recorrentes ao saldo atual das contas', async () => {
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addRecurringIncome, addRecurringExpense } = await import('../src/repositories/recurring-repository.js');
    const { projectMonths } = await import('../src/services/forecast-service.js');
    const { currentMonth } = await import('../src/utils/format.js');

    await addAccount({ nome: 'Conta Previsão', saldo: 1000 });
    await addRecurringIncome({ desc: 'Renda Previsão', val: 2000, diaFixo: 5, contaId: 'conta_1' });
    await addRecurringExpense({ desc: 'Despesa Previsão', val: 500, diaVencimento: 10, contaId: 'conta_1' });

    const months = projectMonths(currentMonth(), 3);

    expect(months).toHaveLength(3);
    // saldo inicial (contas já existentes na suíte + 1000 desta conta) sobe
    // em exatamente 1500 (2000-500) a cada mês projetado — é essa diferença
    // constante entre meses consecutivos que comprova a soma correta,
    // independente do saldo inicial acumulado por outros testes do arquivo.
    expect(months[1].closing - months[0].closing).toBe(1500);
    expect(months[2].closing - months[1].closing).toBe(1500);
  });

  it('explica a variação quando a última parcela de uma dívida termina no mês anterior', async () => {
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addDebt } = await import('../src/repositories/debt-repository.js');
    const { addMonths } = await import('../src/utils/dates.js');
    const { projectMonths, explainVariations } = await import('../src/services/forecast-service.js');
    const { currentMonth } = await import('../src/utils/format.js');

    await addAccount({ nome: 'Conta Dívida Previsão', saldo: 0 });
    const month = currentMonth();
    // 2 parcelas começando no mês anterior: a última (parcela 2) vence no
    // mês corrente — então a projeção do mês SEGUINTE (índice 1) deve
    // explicar que o saldo melhora porque essa dívida acabou de terminar.
    const primeiroVencimento = addMonths(`${month}-05`, -1);
    await addDebt({ nome: 'Empréstimo Previsão', categoria: 'Geral', valorTotal: 400, parcelada: true, numParcelas: 2, primeiroVencimento, contaId: 'conta_1' });

    const months = explainVariations(projectMonths(month, 3));
    const secondMonth = months[1];

    expect(secondMonth.explanation).toBeTruthy();
    expect(secondMonth.explanation).toContain('Empréstimo Previsão');
  });
});
