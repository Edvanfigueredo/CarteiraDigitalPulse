import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  document.body.innerHTML = '<div id="app-root"></div>';
});

describe('Metas 2.0 (seções 19-20)', () => {
  it('calcula meses restantes e não fabrica número quando não há aporte', async () => {
    const { monthsToComplete } = await import('../src/services/goal-service.js');

    const goal = { target: 1000, current: 400 };
    expect(monthsToComplete(goal, 200)).toBe(3); // 600 restantes / 200 = 3 (arredonda pra cima)
    expect(monthsToComplete(goal, 0)).toBeNull();
    expect(monthsToComplete({ target: 1000, current: 1000 }, 200)).toBe(0); // já concluída
  });

  it('simulação de cenário ("e se?") não altera a meta real', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addGoal, listGoals } = await import('../src/repositories/goal-repository.js');
    const { monthsToComplete } = await import('../src/services/goal-service.js');

    await addGoal({ desc: 'Meta Simulação', target: 1200, current: 0, aporteMensal: 100 });
    const goal = listGoals().find((g) => g.desc === 'Meta Simulação');

    const comAporteAtual = monthsToComplete(goal, goal.aporteMensal);
    const comAporteMaior = monthsToComplete(goal, 400);

    expect(comAporteAtual).toBe(12);
    expect(comAporteMaior).toBe(3);
    // a meta real no repositório continua com o aporte original, intacta
    expect(listGoals().find((g) => g.desc === 'Meta Simulação').aporteMensal).toBe(100);
  });

  it('aporte necessário para bater o prazo é recalculado a partir do valor restante', async () => {
    const { requiredMonthlyContribution } = await import('../src/services/goal-service.js');

    const daqui4Meses = new Date();
    daqui4Meses.setMonth(daqui4Meses.getMonth() + 4);
    const prazo = `${daqui4Meses.getFullYear()}-${String(daqui4Meses.getMonth() + 1).padStart(2, '0')}`;

    const goal = { target: 2000, current: 800, prazo };
    const necessario = requiredMonthlyContribution(goal);

    expect(necessario).toBe(300); // 1200 restantes / 4 meses
  });

  it('registrar aporte soma ao valor atual sem substituir', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { addGoal, addContribution, listGoals } = await import('../src/repositories/goal-repository.js');

    await addGoal({ desc: 'Meta Aporte', target: 1000, current: 100 });
    const goal = listGoals().find((g) => g.desc === 'Meta Aporte');

    await addContribution(goal.id, 50);
    expect(listGoals().find((g) => g.id === goal.id).current).toBe(150);
  });
});

describe('Evolução do Patrimônio (seção 21)', () => {
  it('registra um snapshot real por mês, sem duplicar ao visitar a tela mais de uma vez', async () => {
    const { initStore } = await import('../src/core/store.js');
    await initStore();
    const { recordSnapshot, listSnapshots } = await import('../src/repositories/networth-history-repository.js');

    await recordSnapshot(5000);
    await recordSnapshot(5200); // segunda "visita" no mesmo mês: atualiza, não duplica

    const snapshots = listSnapshots();
    expect(snapshots.length).toBe(1);
    expect(snapshots[0].value).toBe(5200);
  });
});
