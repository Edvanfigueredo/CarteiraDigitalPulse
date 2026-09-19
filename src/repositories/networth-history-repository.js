import { getData, mutate } from '../core/store.js';
import { currentMonth } from '../utils/format.js';

export function listSnapshots() {
  return [...getData().patrimonioHistorico].sort((a, b) => a.month.localeCompare(b.month));
}

// Grava (ou atualiza) o snapshot do mês corrente com o valor de patrimônio
// líquido calculado agora. Nunca fabrica pontos para meses passados sem
// dados reais — a série só cresce conforme o usuário de fato usa o app.
export async function recordSnapshot(value) {
  const month = currentMonth();
  await mutate((data) => {
    const existing = data.patrimonioHistorico.find((s) => s.month === month);
    if (existing) existing.value = value;
    else data.patrimonioHistorico.push({ month, value });
    return data;
  });
}
