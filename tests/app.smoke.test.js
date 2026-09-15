import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chart.js precisa de canvas 2D real (indisponível no jsdom) — mockamos o
// wrapper de gráficos para este teste de fumaça, que valida navegação,
// estado e ausência de exceções, não a renderização visual dos gráficos.
vi.mock('../src/ui/components/charts.js', () => ({
  renderChart: vi.fn(),
  barIncomeExpense: vi.fn(),
  doughnutCategories: vi.fn(),
  lineEvolution: vi.fn()
}));

beforeEach(() => {
  document.body.innerHTML = '<div id="app-root"></div>';
  window.HTMLCanvasElement.prototype.getContext = () => null;
});

// NOTA: mountApp() cria assinaturas de longa duração no store/router (por
// design — em produção ele vive por toda a sessão da página). Por isso, no
// arquivo de teste, ele só é chamado no último teste, depois que os demais
// já validaram o estado zerado e a lógica de dados isoladamente.
describe('Pulse Finance — fluxo principal', () => {
  it('primeiro acesso mostra onboarding com sistema zerado (sem dados fictícios)', async () => {
    const { initStore, getMeta } = await import('../src/core/store.js');
    await initStore();
    expect(getMeta().onboarded).toBe(false);

    const { renderOnboarding } = await import('../src/ui/views/onboarding-view.js');
    let mounted = false;
    renderOnboarding(document.getElementById('app-root'), () => { mounted = true; });

    expect(document.getElementById('onboarding-name')).toBeTruthy();
    document.getElementById('onboarding-name').value = 'Edvan';
    document.getElementById('onboarding-form').dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(mounted).toBe(true);
    expect(getMeta().profileName).toBe('Edvan');
  });

  it('dashboard mostra estado zerado logo após o onboarding, sem valores fictícios', async () => {
    const { renderDashboard } = await import('../src/ui/views/dashboard-view.js');
    const container = document.getElementById('app-root');
    renderDashboard(container);

    expect(container.innerHTML).toContain('0,00');
    expect(container.innerHTML).toContain('Você ainda não possui transações');
    expect(container.innerHTML).not.toMatch(/\bundefined\b/);
    expect(container.innerHTML).not.toMatch(/\bNaN\b/);
  });

  it('regressão: dashboard não mostra gráficos vazios quando há dados só em outro mês', async () => {
    // Reproduz o bug relatado: transações existentes fora do mês atual não
    // devem acionar os gráficos (que ficariam com fluxo zerado e "Sem
    // dados"); o dashboard deve mostrar o estado vazio específico do mês.
    const { addAccount, listAccounts } = await import('../src/repositories/account-repository.js');
    const { saveTransaction } = await import('../src/services/transaction-service.js');
    const { renderDashboard } = await import('../src/ui/views/dashboard-view.js');

    await addAccount({ nome: 'Conta Mês Passado', saldo: 0 });
    const conta = listAccounts().find((c) => c.nome === 'Conta Mês Passado');
    await saveTransaction({
      desc: 'Lançamento Antigo', val: '100', tipo: 'despesa',
      date: '2020-01-10', contaId: `conta_${conta.id}`, cat: 'Geral', status: 'pago'
    });

    const container = document.getElementById('app-root');
    renderDashboard(container);

    expect(container.innerHTML).not.toContain('chart-flow');
    expect(container.innerHTML).toContain('Nenhum lançamento em');
  });

  it('cria conta, categoria e transação; totais refletem os dados reais', async () => {
    const { addAccount, listAccounts } = await import('../src/repositories/account-repository.js');
    const { addCategory } = await import('../src/repositories/category-repository.js');
    const { saveTransaction } = await import('../src/services/transaction-service.js');
    const { totalsForMonth } = await import('../src/services/insight-service.js');
    const { currentMonth } = await import('../src/utils/format.js');

    await addAccount({ nome: 'Conta Teste', saldo: 100 });
    await addCategory({ nome: 'Alimentação Teste', tipo: 'despesa', essencial: true });
    const conta = listAccounts().find((c) => c.nome === 'Conta Teste');

    await saveTransaction({
      desc: 'Mercado', val: '250.5', tipo: 'despesa',
      date: `${currentMonth()}-05`, contaId: `conta_${conta.id}`, cat: 'Alimentação Teste', status: 'pago'
    });

    const totals = totalsForMonth(currentMonth());
    expect(totals.expenses).toBeGreaterThanOrEqual(250.5);
    expect(totals.entries.some((t) => t.desc === 'Mercado')).toBe(true);
  });

  it('parcelamento divide o valor total sem perda de centavos', async () => {
    const { createInstallmentPurchase } = await import('../src/services/transaction-service.js');
    const { listTransactions } = await import('../src/repositories/transaction-repository.js');

    await createInstallmentPurchase({ desc: 'Compra Parcelada', total: 100, count: 3, baseDate: '2026-01-31', cardId: 'cartao_1', cat: 'Geral' });
    const parcels = listTransactions().filter((t) => t.desc === 'Compra Parcelada');
    const sum = parcels.reduce((a, t) => a + t.val, 0);

    expect(parcels.length).toBe(3);
    expect(Math.round(sum * 100) / 100).toBe(100);
  });

  it('modo demonstração não interfere nos dados reais', async () => {
    const { activateDemo, deactivateDemo } = await import('../src/services/demo-service.js');
    const { listTransactions } = await import('../src/repositories/transaction-repository.js');

    const realCountBefore = listTransactions().length;
    await activateDemo();
    const demoCount = listTransactions().length;
    expect(demoCount).toBeGreaterThan(0);

    await deactivateDemo();
    const realCountAfter = listTransactions().length;
    expect(realCountAfter).toBe(realCountBefore);
  });

  it('monta o app completo e navega por todas as telas sem lançar exceções', async () => {
    const { mountApp } = await import('../src/ui/render.js');
    const { navigate, VIEWS } = await import('../src/core/router.js');

    expect(() => mountApp()).not.toThrow();

    for (const view of VIEWS) {
      expect(() => navigate(view)).not.toThrow();
      const html = document.getElementById('view-container').innerHTML;
      // Critério de aceitação: nunca mostrar erro técnico cru ao usuário
      expect(html).not.toMatch(/\bundefined\b/);
      expect(html).not.toMatch(/\bNaN\b/);
      expect(html).not.toContain('[object Object]');
    }
  });
});
