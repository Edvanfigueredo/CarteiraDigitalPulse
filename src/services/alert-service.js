import { getMonthEvents } from './calendar-service.js';
import { getPreferences } from './preferences-service.js';
import { listBudgets, spentForCategory } from '../repositories/budget-repository.js';
import { listTransactions } from '../repositories/transaction-repository.js';
import { listGoals } from '../repositories/goal-repository.js';
import { money, percent } from '../utils/format.js';

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function timePhrase(leadDays) {
  if (leadDays === 0) return 'hoje';
  if (leadDays === 1) return 'amanhã';
  return `em ${leadDays} dias`;
}

function dueDateAlerts(leadDays) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const targetDate = addDays(todayStr, leadDays);
  const targetMonth = targetDate.slice(0, 7);
  const when = timePhrase(leadDays);

  return getMonthEvents(targetMonth)
    .filter((e) => e.date === targetDate && e.status !== 'pago')
    .map((e) => ({
      tipo: e.tipo,
      text: e.tipo === 'despesa'
        ? `⚠️ ${when.charAt(0).toUpperCase() + when.slice(1)} vence ${e.desc} de ${money(e.val)}.`
        : `💰 ${when.charAt(0).toUpperCase() + when.slice(1)} você recebe ${e.desc} de ${money(e.val)}.`
    }));
}

// Orçamento perto ou acima do teto — considerado mesmo com alertas de data
// desativados, porque não é um aviso de vencimento e sim de estouro.
function budgetAlerts() {
  const tx = listTransactions();
  return listBudgets()
    .map((b) => ({ b, pct: b.val > 0 ? percent(spentForCategory(b.cat, tx), b.val) : 0 }))
    .filter(({ pct }) => pct >= 90)
    .map(({ b, pct }) => ({
      tipo: 'orcamento',
      text: pct >= 100
        ? `🚨 Seu orçamento de ${b.cat} já ultrapassou o teto (${pct}% usado).`
        : `⚠️ Seu orçamento de ${b.cat} está em ${pct}% do teto — perto de estourar.`
    }));
}

// Meta com prazo próximo e ainda não concluída.
function goalDeadlineAlerts(leadDays) {
  if (leadDays < 0) return [];
  const targetMonth = addDays(new Date().toISOString().slice(0, 10), leadDays).slice(0, 7);
  return listGoals()
    .filter((g) => g.prazo === targetMonth && g.target > 0 && g.current < g.target)
    .map((g) => ({
      tipo: 'meta',
      text: `🎯 Sua meta "${g.desc}" vence este mês e ainda faltam ${money(g.target - g.current)}.`
    }));
}

// Gera avisos determinísticos (nunca inventa dado) para o horizonte definido
// em Ajustes → Alertas. -1 = desativado (nenhum alerta, de nenhum tipo),
// 0 = no dia, 1/2/3 = dias de antecedência para vencimentos e prazos de meta;
// o alerta de orçamento estourado usa o mesmo interruptor, para que
// "Desativado" realmente desligue todos os tipos, como a tela promete.
export function getUpcomingAlerts() {
  const leadDays = getPreferences().alertLeadDays;
  if (leadDays === -1 || leadDays === undefined) return [];
  return [...budgetAlerts(), ...dueDateAlerts(leadDays), ...goalDeadlineAlerts(leadDays)];
}
