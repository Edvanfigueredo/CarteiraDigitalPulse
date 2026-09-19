// Modelo de dados do Pulse. Duas fábricas: dataset real (sempre zerado)
// e dataset de demonstração (dados fictícios, isolado do dataset real).

export function emptyDataset() {
  return {
<<<<<<< HEAD
    schemaVersion: 3,
=======
    schemaVersion: 2,
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
    categorias: [],
    contas: [],
    cartoes: [],
    transacoes: [],
    limites: [],   // orçamentos por categoria
    metas: [],
<<<<<<< HEAD
    patrimonio: [],       // apenas bens/ativos a partir da v3 — passivos viraram "dividas"
    patrimonioHistorico: [], // snapshots mensais de patrimônio líquido (seção 21)
    dividas: [],          // dívidas com ou sem parcelamento (v3)
    rendasRecorrentes: [], // salário e outras receitas recorrentes (v3)
    despesasRecorrentes: [], // aluguel, internet etc. (v3)
    carreira: [], // histórico de cargo/empresa/salário (v3, opcional — seção 25)
=======
    patrimonio: [],
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
    months: []     // meses criados explicitamente (além do mês corrente, sempre disponível)
  };
}

// Categorias padrão sugeridas no onboarding (não são "dados fictícios financeiros",
// apenas rótulos — o usuário pode remover todas se quiser).
export function starterCategories() {
  return [
    { id: 1, nome: 'Alimentação', tipo: 'despesa', essencial: true },
    { id: 2, nome: 'Transporte', tipo: 'despesa', essencial: true },
    { id: 3, nome: 'Moradia', tipo: 'despesa', essencial: true },
    { id: 4, nome: 'Saúde', tipo: 'despesa', essencial: true },
    { id: 5, nome: 'Lazer', tipo: 'despesa', essencial: false },
    { id: 6, nome: 'Salário', tipo: 'receita', essencial: false },
    { id: 7, nome: 'Investimentos', tipo: 'receita', essencial: false }
  ];
}

export function demoDataset() {
  const base = emptyDataset();
  base.categorias = starterCategories();
  base.contas = [
    { id: 1, nome: 'Nubank', saldo: 2850.0 },
    { id: 2, nome: 'Itaú', saldo: 1420.5 }
  ];
  base.cartoes = [
    { id: 1, nome: 'Nubank Mastercard', limite: 6000.0 },
    { id: 2, nome: 'Itaú Visa Click', limite: 4500.0 }
  ];
  const month = new Date().toISOString().slice(0, 7);
  base.transacoes = [
    { id: 1, desc: 'Salário Mensal (demonstração)', val: 6500.0, tipo: 'receita', date: `${month}-01`, contaId: 'conta_1', cat: 'Salário', tag: 'Fixo', status: 'pago' },
    { id: 2, desc: 'Supermercado (demonstração)', val: 580.4, tipo: 'despesa', date: `${month}-12`, contaId: 'cartao_1', cat: 'Alimentação', tag: '', status: 'pago' },
    { id: 3, desc: 'Internet Fibra (demonstração)', val: 129.9, tipo: 'despesa', date: `${month}-20`, contaId: 'conta_2', cat: 'Moradia', tag: '', status: 'pendente' }
  ];
  base.limites = [{ id: 1, cat: 'Alimentação', val: 1200.0 }];
<<<<<<< HEAD
  base.metas = [{
    id: 1, desc: 'Reserva de Emergência (demonstração)', target: 15000.0, current: 4270.5,
    aporteMensal: 500, prazo: null, categoria: 'Reserva', prioridade: 'alta', contaId: 'conta_1'
  }];
  base.patrimonioHistorico = [
    { month: month, value: 8500.0 }
  ];
  base.patrimonio = [
    { id: 1, tipo: 'ativo', nome: 'Ações / FIIs (demonstração)', val: 8500.0 }
  ];
  base.rendasRecorrentes = [
    { id: 1, desc: 'Salário CLT (demonstração)', val: 4200.0, frequencia: 'mensal', ultimoDiaUtil: true, diaFixo: null, contaId: 'conta_1', ativo: true }
  ];
  base.despesasRecorrentes = [
    { id: 1, desc: 'Aluguel (demonstração)', val: 1000.0, diaVencimento: 5, categoria: 'Moradia', contaId: 'conta_1', ativo: true },
    { id: 2, desc: 'Internet (demonstração)', val: 129.9, diaVencimento: 10, categoria: 'Moradia', contaId: 'conta_1', ativo: true }
  ];
  base.dividas = [{
    id: 1,
    nome: 'Notebook (demonstração)',
    categoria: 'Eletrônicos',
    credor: 'Loja XPTO',
    valorTotal: 3600,
    dataContratacao: `${month}-01`,
    parcelada: true,
    numParcelas: 12,
    valorParcela: 300,
    juros: 0,
    observacoes: '',
    status: 'aberta',
    parcelas: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      vencimento: `${month}-10`,
      valor: 300,
      status: i === 0 ? 'paga' : 'pendente',
      dataPagamento: i === 0 ? `${month}-10` : null,
      contaId: 'cartao_1',
      transacaoId: null
    }))
  }];
=======
  base.metas = [{ id: 1, desc: 'Reserva de Emergência (demonstração)', target: 15000.0, current: 4270.5 }];
  base.patrimonio = [
    { id: 1, tipo: 'ativo', nome: 'Ações / FIIs (demonstração)', val: 8500.0 },
    { id: 2, tipo: 'passivo', nome: 'Financiamento Veículo (demonstração)', val: 14000.0 }
  ];
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
  return base;
}

export function defaultMeta() {
  return {
    onboarded: false,
    profileName: '',
    activeDataset: 'real', // 'real' | 'demo'
    preferences: {
      theme: 'dark',
      palette: 'preto',
      fontScale: 100,
      colorMode: 'padrao',
<<<<<<< HEAD
      currency: 'BRL',
      privacyMode: false,
      alertLeadDays: 1 // 0 = no dia, -1 = desativado
=======
      currency: 'BRL'
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
    }
  };
}

export function validateDataset(data) {
  if (!data || typeof data !== 'object') return emptyDataset();
  const safe = emptyDataset();
  for (const key of Object.keys(safe)) {
    if (key === 'schemaVersion') continue;
    if (Array.isArray(safe[key])) safe[key] = Array.isArray(data[key]) ? data[key] : [];
  }
<<<<<<< HEAD

  // Migração v2 → v3: patrimônio misturava ativos e passivos genéricos.
  // Passivos antigos viram dívidas simples (sem parcelamento) para não
  // perder dado nenhum do usuário; ativos continuam em `patrimonio`.
  const legacyLiabilities = safe.patrimonio.filter((p) => p.tipo === 'passivo');
  if (legacyLiabilities.length) {
    safe.patrimonio = safe.patrimonio.filter((p) => p.tipo !== 'passivo');
    legacyLiabilities.forEach((p) => {
      safe.dividas.push({
        id: p.id,
        nome: p.nome,
        categoria: 'Geral',
        credor: '',
        valorTotal: p.val,
        dataContratacao: null,
        parcelada: false,
        numParcelas: 1,
        valorParcela: p.val,
        juros: 0,
        observacoes: 'Migrado automaticamente do patrimônio (versão anterior).',
        status: 'aberta',
        parcelas: [{ numero: 1, vencimento: null, valor: p.val, status: 'pendente', dataPagamento: null, contaId: null, transacaoId: null }]
      });
    });
  }

=======
>>>>>>> 84bf2b54eda975d7547784d19f636e0a8fc32078
  return safe;
}
