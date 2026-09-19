import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '<div id="app-root"></div>';
});

describe('Gamificação (seção 22) — conquistas calculadas ao vivo, nunca fabricadas', () => {
  it('marca "primeira dívida quitada" apenas depois de quitar de verdade', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addDebt, listDebts } = await import('../src/repositories/debt-repository.js');
    const { payInstallment } = await import('../src/services/debt-service.js');
    const { buildAchievements } = await import('../src/services/gamification-service.js');

    await addAccount({ nome: 'Conta Gamif', saldo: 0 });
    const before = buildAchievements().find((a) => a.id === 'divida-quitada');
    expect(before.done).toBe(false);

    await addDebt({ nome: 'Dívida Gamif', categoria: 'Geral', valorTotal: 100, parcelada: false, primeiroVencimento: '2026-09-01', contaId: 'conta_1' });
    const debt = listDebts().find((d) => d.nome === 'Dívida Gamif');
    await payInstallment(debt.id, 1, {});

    const after = buildAchievements().find((a) => a.id === 'divida-quitada');
    expect(after.done).toBe(true);
  });

  it('marca "primeiros R$1.000 de reserva" com base no saldo real das contas', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { buildAchievements } = await import('../src/services/gamification-service.js');

    await addAccount({ nome: 'Conta Reserva Gamif', saldo: 1500 });
    const achievement = buildAchievements().find((a) => a.id === 'reserva-mil');
    expect(achievement.done).toBe(true);
  });
});

describe('Carreira Financeira (seção 25) — renda vem das transações reais, não do cadastro manual', () => {
  it('evolução de renda por ano soma transações reais de receita, ignorando o salário informado em Carreira', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addTransaction } = await import('../src/repositories/transaction-repository.js');
    const { addCareerEntry } = await import('../src/repositories/career-repository.js');
    const { incomeByYear } = await import('../src/services/career-service.js');

    await addAccount({ nome: 'Conta Carreira', saldo: 0 });
    await addTransaction({ id: 444001, desc: 'Salário Real Carreira', val: 5000, tipo: 'receita', date: '2026-03-01', contaId: 'conta_1', cat: 'Salário', status: 'pago' });
    // Cadastro manual de carreira com valor DIFERENTE — não deve contaminar o cálculo real
    await addCareerEntry({ cargo: 'Dev', empresa: 'Empresa X', salario: 9999, dataInicio: '2026-01-01' });

    const result = incomeByYear();
    const year2026 = result.find((r) => r.year === '2026');
    expect(year2026.income).toBeGreaterThanOrEqual(5000);
    expect(year2026.income).not.toBe(9999);
  });
});

describe('Meu Ano Financeiro (seção 24) — consolidado real, sem inventar dado', () => {
  it('soma receitas/despesas do ano inteiro a partir dos 12 meses e identifica dívida quitada no ano', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addTransaction } = await import('../src/repositories/transaction-repository.js');
    const { addDebt, listDebts } = await import('../src/repositories/debt-repository.js');
    const { payInstallment } = await import('../src/services/debt-service.js');
    const { buildAnnualReport } = await import('../src/services/annual-report-service.js');

    await addAccount({ nome: 'Conta Ano', saldo: 0 });
    await addTransaction({ id: 333001, desc: 'Receita Ano Teste', val: 1000, tipo: 'receita', date: '2027-02-10', contaId: 'conta_1', cat: 'Geral', status: 'pago' });
    await addTransaction({ id: 333002, desc: 'Despesa Ano Teste', val: 400, tipo: 'despesa', date: '2027-05-10', contaId: 'conta_1', cat: 'Geral', status: 'pago' });
    await addDebt({ nome: 'Dívida Ano Teste', categoria: 'Geral', valorTotal: 50, parcelada: false, primeiroVencimento: '2027-06-01', contaId: 'conta_1' });
    const debt = listDebts().find((d) => d.nome === 'Dívida Ano Teste');
    await payInstallment(debt.id, 1, { dataPagamento: '2027-06-02' });

    const report = buildAnnualReport(2027);
    expect(report.income).toBeGreaterThanOrEqual(1000);
    expect(report.expenses).toBeGreaterThanOrEqual(450); // 400 + a parcela paga de 50
    expect(report.debtsClosedThisYear).toBeGreaterThanOrEqual(1);
  });
});
