import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '<div id="app-root"></div>';
});

describe('Modo Privado (seção 26)', () => {
  it('mascara apenas os dígitos, preservando símbolo e separadores', async () => {
    const { money } = await import('../src/utils/format.js');
    const { setPrivacyMode } = await import('../src/utils/privacy.js');

    const normal = money(1234.5);
    setPrivacyMode(true);
    const masked = money(1234.5);
    setPrivacyMode(false); // não vaza para outros testes deste arquivo

    expect(normal).toContain('1.234,50');
    expect(masked).not.toMatch(/\d/);
    expect(masked).toContain('R$');
    expect(masked.length).toBe(normal.length); // só os dígitos viram •, resto igual
  });

  it('togglePrivacyMode() persiste a preferência e atualiza a flag global usada por money()', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { togglePrivacyMode, getPreferences } = await import('../src/services/preferences-service.js');
    const { isPrivacyActive, setPrivacyMode } = await import('../src/utils/privacy.js');

    expect(getPreferences().privacyMode).toBe(false);
    await togglePrivacyMode();
    expect(getPreferences().privacyMode).toBe(true);
    expect(isPrivacyActive()).toBe(true);

    setPrivacyMode(false); // limpeza para não vazar para outros arquivos de teste
  });

  it('moneyRaw() nunca mascara, mesmo com o Modo Privado ativo — usado em relatórios e exportações', async () => {
    const { money, moneyRaw } = await import('../src/utils/format.js');
    const { setPrivacyMode } = await import('../src/utils/privacy.js');

    setPrivacyMode(true);
    const screenValue = money(1234.5);
    const reportValue = moneyRaw(1234.5);
    setPrivacyMode(false);

    expect(screenValue).not.toMatch(/\d/); // tela: mascarada
    expect(reportValue).toContain('1.234,50'); // relatório/exportação: valor real, sempre
  });
});

describe('Alertas financeiros (seção 14)', () => {
  it('avisa sobre uma despesa pendente que vence amanhã (configuração padrão: 1 dia antes)', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addTransaction } = await import('../src/repositories/transaction-repository.js');
    const { getUpcomingAlerts } = await import('../src/services/alert-service.js');

    await addAccount({ nome: 'Conta Alerta', saldo: 0 });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    await addTransaction({ id: 555001, desc: 'Conta Alerta Teste', val: 77, tipo: 'despesa', date: tomorrowStr, contaId: 'conta_1', cat: 'Geral', status: 'pendente' });

    const alerts = getUpcomingAlerts();
    const found = alerts.find((a) => a.text.includes('Conta Alerta Teste'));
    expect(found).toBeTruthy();
    expect(found.text).toContain('Amanhã');
    expect(found.text).toContain('R$');
  });

  it('avisa quando um orçamento ultrapassa o teto, independente da data', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addAccount } = await import('../src/repositories/account-repository.js');
    const { addCategory } = await import('../src/repositories/category-repository.js');
    const { addBudget } = await import('../src/repositories/budget-repository.js');
    const { saveTransaction } = await import('../src/services/transaction-service.js');
    const { currentMonth } = await import('../src/utils/format.js');
    const { getUpcomingAlerts } = await import('../src/services/alert-service.js');

    await addAccount({ nome: 'Conta Orçamento Alerta', saldo: 0 });
    await addCategory({ nome: 'Lazer Alerta', tipo: 'despesa' });
    await addBudget({ cat: 'Lazer Alerta', val: 100 });
    await saveTransaction({ desc: 'Gasto Estourado', val: 150, tipo: 'despesa', date: `${currentMonth()}-05`, contaId: 'conta_1', cat: 'Lazer Alerta', status: 'pago' });

    const found = getUpcomingAlerts().find((a) => a.tipo === 'orcamento' && a.text.includes('Lazer Alerta'));
    expect(found).toBeTruthy();
    expect(found.text).toContain('ultrapassou');
  });

  it('avisa sobre meta com prazo neste mês e valor ainda não atingido', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addGoal } = await import('../src/repositories/goal-repository.js');
    const { currentMonth } = await import('../src/utils/format.js');
    const { getUpcomingAlerts } = await import('../src/services/alert-service.js');

    await addGoal({ desc: 'Meta Prazo Alerta', target: 1000, current: 200, prazo: currentMonth() });

    const found = getUpcomingAlerts().find((a) => a.tipo === 'meta' && a.text.includes('Meta Prazo Alerta'));
    expect(found).toBeTruthy();
  });

  it('não gera nenhum alerta quando o usuário desativa nos Ajustes — nem os de orçamento', async () => {
    const { setPreference } = await import('../src/services/preferences-service.js');
    const { getUpcomingAlerts } = await import('../src/services/alert-service.js');

    await setPreference('alertLeadDays', -1);
    expect(getUpcomingAlerts()).toEqual([]);
  });
});
