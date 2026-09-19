import { monthLabel } from '../utils/format.js';

function addMonthsToToday(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Quantos meses faltam para atingir a meta com um aporte mensal hipotético.
// Retorna null quando não dá pra calcular (meta já concluída ou aporte 0).
export function monthsToComplete(goal, aporteMensal) {
  const restante = goal.target - goal.current;
  if (restante <= 0) return 0;
  if (!aporteMensal || aporteMensal <= 0) return null;
  return Math.ceil(restante / aporteMensal);
}

export function projectedCompletionLabel(goal, aporteMensal = goal.aporteMensal) {
  const months = monthsToComplete(goal, aporteMensal);
  if (months === null) return 'Defina um aporte mensal para calcular a previsão.';
  if (months === 0) return 'Meta já concluída.';
  return monthLabel(addMonthsToToday(months));
}

// Aporte necessário para bater a meta exatamente no prazo informado (se houver).
export function requiredMonthlyContribution(goal) {
  if (!goal.prazo) return null;
  const restante = goal.target - goal.current;
  if (restante <= 0) return 0;
  const [y, m] = goal.prazo.split('-').map(Number);
  const today = new Date();
  const monthsLeft = (y - today.getFullYear()) * 12 + (m - (today.getMonth() + 1));
  if (monthsLeft <= 0) return restante; // prazo já vencido ou é este mês: precisa tudo agora
  return Math.round((restante / monthsLeft) * 100) / 100;
}

// Cenário "e se eu aportar X" — não persiste nada, só calcula.
export function simulateScenarios(goal, amounts) {
  return amounts.map((val) => ({ aporte: val, previsao: projectedCompletionLabel(goal, val) }));
}
