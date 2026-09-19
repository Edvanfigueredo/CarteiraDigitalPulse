import { totalsForMonth, categoryBreakdown } from './insight-service.js';
import { listGoals } from '../repositories/goal-repository.js';
import { listAssets } from '../repositories/networth-repository.js';
import { outstandingBalance } from '../repositories/debt-repository.js';
import { moneyRaw as money, monthLabel } from '../utils/format.js';
import { escapeHtml } from '../utils/sanitize.js';

export const CHATGPT_PROMPT = `Você é um analista financeiro pessoal. Analise o relatório financeiro que será fornecido abaixo e produza um diagnóstico claro, realista e prático sobre a situação financeira do usuário.
Objetivo
Avaliar a saúde financeira atual do usuário em 3 níveis:

* 🟢 Nível 1 — Saudável: situação controlada, capacidade de poupar/investir e boa margem financeira.
* 🟡 Nível 2 — Atenção: situação administrável, mas existem desequilíbrios, dívidas, pouca margem ou riscos que precisam ser corrigidos.
* 🔴 Nível 3 — Crítico: comprometimento financeiro elevado, déficit, dívidas preocupantes ou risco de inadimplência, exigindo ações imediatas.

Analise obrigatoriamente:

1. Receitas: renda líquida, estabilidade e possíveis fontes adicionais.
2. Despesas: custos fixos, variáveis e gastos que podem ser reduzidos.
3. Saldo mensal: quanto sobra ou falta no final do mês.
4. Comprometimento da renda: percentual destinado a despesas e dívidas.
5. Dívidas: valor, parcelas, juros quando disponíveis e prioridade de pagamento.
6. Reserva financeira: existência, valor e meses de despesas que consegue cobrir.
7. Capacidade de poupança/investimento.
8. Riscos financeiros: gastos extraordinários, dependência de renda extra, excesso de parcelas etc.
9. Evolução: identifique tendências positivas ou negativas quando houver dados de meses anteriores.

Resultado
Apresente nesta ordem:
1. Diagnóstico geral
Informe o nível 🟢 🟡 🔴 e explique em poucas linhas o motivo.
2. Raio-X financeiro
Mostre os principais números em uma tabela: receitas, despesas, dívidas, saldo, percentual comprometido e reserva.
3. Principais problemas
Liste os 3 a 5 pontos que mais prejudicam a situação financeira.
4. Pontos positivos
Liste o que o usuário já está fazendo corretamente.
5. Plano de ação
Crie recomendações em três horizontes:

* Agora (0–30 dias)
* Curto prazo (1–6 meses)
* Médio prazo (6–24 meses)

Priorize ações que tenham maior impacto financeiro.
6. Meta financeira
Sugira uma meta mensal realista para:

* redução de dívidas;
* formação de reserva;
* aumento do patrimônio;
* melhoria da renda, quando aplicável.

7. Conclusão
Diga de forma direta: "A situação financeira está [saudável / em atenção / crítica]", explique o principal motivo e indique qual deve ser a prioridade número 1.
Regras

* Não invente informações que não estejam no relatório.
* Quando faltar um dado importante, informe que ele não foi fornecido.
* Faça cálculos e percentuais quando os dados permitirem.
* Não considere cartão de crédito como "renda disponível".
* Diferencie despesas essenciais de gastos que podem ser reduzidos.
* Não recomende investimentos antes de considerar dívidas caras e reserva de emergência.
* Considere a realidade financeira brasileira e valores em R$.
* Seja direto, sem julgamentos e sem discurso genérico.
* Sempre explique o porquê de cada recomendação.
* Se houver mais de uma estratégia possível, apresente a melhor opção e uma alternativa.
* Não trate o diagnóstico como aconselhamento financeiro profissional; apresente-o como análise e orientação educacional baseada nos dados fornecidos.

RELATÓRIO FINANCEIRO:
[COLE O RELATÓRIO AQUI]`;

export async function copyChatGptPrompt() {
  try {
    await navigator.clipboard.writeText(CHATGPT_PROMPT);
    return true;
  } catch {
    return false;
  }
}

export function openChatGpt() {
  window.open('https://chatgpt.com/', '_blank', 'noopener');
}

function buildReportHtml(yyyyMm) {
  const { entries, income, expenses } = totalsForMonth(yyyyMm);
  const categories = categoryBreakdown(entries, 'despesa');
  const goals = listGoals();
  const assets = listAssets();
  const debtTotal = outstandingBalance();
  const label = monthLabel(yyyyMm);

  const catRows = categories.length
    ? categories.map(([name, val]) => `<tr><td>${escapeHtml(name)}</td><td>${money(val)}</td></tr>`).join('')
    : '<tr><td colspan="2">Sem despesas no período.</td></tr>';

  const txRows = entries.length
    ? entries.map((t) => `<tr><td>${escapeHtml(t.date)}</td><td>${escapeHtml(t.desc)}</td><td>${escapeHtml(t.cat || 'Geral')}</td><td>${escapeHtml(t.tipo)}</td><td>${money(t.val)}</td></tr>`).join('')
    : '<tr><td colspan="5">Sem movimentações no período.</td></tr>';

  const goalRows = goals.length
    ? goals.map((g) => `<tr><td>${escapeHtml(g.desc)}</td><td>${money(g.current)} / ${money(g.target)}</td></tr>`).join('')
    : '<tr><td colspan="2">Nenhuma meta cadastrada.</td></tr>';

  const assetTotal = assets.reduce((a, p) => a + (p.val || 0), 0);

  return `
    <article id="print-report">
      <header><h1>Resumo financeiro</h1><p>${escapeHtml(label)}</p></header>
      <section class="summary">
        <div><small>Receitas</small><strong>${money(income)}</strong></div>
        <div><small>Despesas</small><strong>${money(expenses)}</strong></div>
        <div><small>Saldo</small><strong>${money(income - expenses)}</strong></div>
      </section>
      <h2>Despesas por categoria</h2>
      <table><thead><tr><th>Categoria</th><th>Total</th></tr></thead><tbody>${catRows}</tbody></table>
      <h2>Patrimônio</h2>
      <p>Ativos: ${money(assetTotal)} · Passivos: ${money(debtTotal)} · Líquido: ${money(assetTotal - debtTotal)}</p>
      <h2>Metas</h2>
      <table><thead><tr><th>Meta</th><th>Progresso</th></tr></thead><tbody>${goalRows}</tbody></table>
      <h2>Movimentações</h2>
      <table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>${txRows}</tbody></table>
      <footer>Relatório educativo gerado localmente pelo Pulse. Revise dados pessoais antes de compartilhar.</footer>
    </article>`;
}

export function emitPrintableReport(yyyyMm) {
  document.getElementById('print-report')?.remove();
  document.body.insertAdjacentHTML('beforeend', buildReportHtml(yyyyMm));
  const title = document.title;
  document.title = `Resumo financeiro — ${monthLabel(yyyyMm)}`;
  window.print();
  document.title = title;
  document.getElementById('print-report')?.remove();
}
