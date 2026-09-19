import { money } from '../../utils/format.js';

const TOPICS = [
  { title: 'Orçamento pessoal', text: 'Organizar receitas e despesas em categorias ajuda a enxergar para onde o dinheiro vai e onde é possível ajustar.' },
  { title: 'Reserva de emergência', text: 'Uma reserva cobre imprevistos (perda de renda, despesas médicas) sem recorrer a dívidas. O comum é buscar de 3 a 6 meses de despesas essenciais.' },
  { title: 'Inflação', text: 'É o aumento geral de preços ao longo do tempo, que reduz o poder de compra do dinheiro parado.' },
  { title: 'Juros e juros compostos', text: 'Juros simples incidem sobre o valor original; juros compostos incidem também sobre os juros já acumulados, acelerando o crescimento (ou a dívida).' },
  { title: 'Renda fixa, CDB e Tesouro', text: 'São formas de emprestar dinheiro a bancos ou ao governo em troca de uma remuneração combinada previamente.' },
  { title: 'Fundos, ações e ETFs', text: 'Fundos reúnem o dinheiro de vários investidores; ações representam participação em empresas; ETFs replicam uma cesta de ativos.' },
  { title: 'Diversificação e risco', text: 'Distribuir recursos entre diferentes tipos de investimento reduz o impacto de um resultado ruim isolado.' },
  { title: 'Liquidez', text: 'É a facilidade de transformar um investimento em dinheiro disponível sem perda significativa de valor.' }
];

export function renderLearn(root) {
  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Educação Financeira</h3></div>
      <div class="grid-2">
        ${TOPICS.map((t) => `<div class="card" style="background:var(--bg-input);"><h4 style="margin-bottom:6px;">${t.title}</h4><p class="text-muted" style="font-size:0.85rem;">${t.text}</p></div>`).join('')}
      </div>
      <p class="text-muted" style="margin-top:12px;font-size:0.78rem;">Conteúdo educacional geral. O Pulse não recomenda a compra ou venda de ativos específicos.</p>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Simulador — Reserva de Emergência</h3></div>
      <div class="form-grid">
        <div class="field"><label for="sim-despesas">Despesas mensais essenciais</label><input id="sim-despesas" type="number" step="0.01" placeholder="0,00" /></div>
        <div class="field"><label for="sim-meses">Meses de cobertura desejados</label><input id="sim-meses" type="number" value="6" /></div>
      </div>
      <p id="sim-reserva-result" class="stat-value" style="margin-top:12px;">${money(0)}</p>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Simulador — Meta Financeira</h3></div>
      <div class="form-grid">
        <div class="field"><label for="sim-meta-valor">Valor da meta</label><input id="sim-meta-valor" type="number" step="0.01" placeholder="0,00" /></div>
        <div class="field"><label for="sim-meta-mensal">Quanto pretende guardar por mês</label><input id="sim-meta-mensal" type="number" step="0.01" placeholder="0,00" /></div>
      </div>
      <p id="sim-meta-result" class="stat-value" style="margin-top:12px;">—</p>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Simulador — Juros Compostos</h3></div>
      <p class="text-muted" style="font-size:0.78rem;margin-bottom:10px;">Simulação matemática apenas para fins educativos — não representa promessa de rentabilidade.</p>
      <div class="form-grid">
        <div class="field"><label for="sim-juros-inicial">Valor inicial</label><input id="sim-juros-inicial" type="number" step="0.01" placeholder="0,00" /></div>
        <div class="field"><label for="sim-juros-mensal">Aporte mensal</label><input id="sim-juros-mensal" type="number" step="0.01" placeholder="0,00" /></div>
        <div class="field"><label for="sim-juros-taxa">Taxa mensal (%)</label><input id="sim-juros-taxa" type="number" step="0.01" placeholder="Ex: 0,8" /></div>
        <div class="field"><label for="sim-juros-meses">Período (meses)</label><input id="sim-juros-meses" type="number" placeholder="Ex: 12" /></div>
      </div>
      <p id="sim-juros-result" class="stat-value" style="margin-top:12px;">—</p>
    </div>`;

  const recalc = () => {
    const despesas = Number(document.getElementById('sim-despesas').value) || 0;
    const meses = Number(document.getElementById('sim-meses').value) || 0;
    document.getElementById('sim-reserva-result').textContent = money(despesas * meses);

    const metaValor = Number(document.getElementById('sim-meta-valor').value) || 0;
    const metaMensal = Number(document.getElementById('sim-meta-mensal').value) || 0;
    document.getElementById('sim-meta-result').textContent = metaMensal > 0
      ? `${Math.ceil(metaValor / metaMensal)} meses para atingir a meta`
      : '—';

    const inicial = Number(document.getElementById('sim-juros-inicial').value) || 0;
    const aporte = Number(document.getElementById('sim-juros-mensal').value) || 0;
    const taxa = (Number(document.getElementById('sim-juros-taxa').value) || 0) / 100;
    const periodos = Number(document.getElementById('sim-juros-meses').value) || 0;
    let total = inicial;
    for (let i = 0; i < periodos; i++) total = total * (1 + taxa) + aporte;
    document.getElementById('sim-juros-result').textContent = periodos > 0 ? money(total) : '—';
  };

  root.querySelectorAll('input').forEach((input) => input.addEventListener('input', recalc));
}
