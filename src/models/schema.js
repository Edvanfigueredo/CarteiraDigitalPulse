// Modelo de dados do Pulse. Duas fábricas: dataset real (sempre zerado)
// e dataset de demonstração (dados fictícios, isolado do dataset real).

export function emptyDataset() {
  return {
    schemaVersion: 2,
    categorias: [],
    contas: [],
    cartoes: [],
    transacoes: [],
    limites: [],   // orçamentos por categoria
    metas: [],
    patrimonio: [],
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
  base.metas = [{ id: 1, desc: 'Reserva de Emergência (demonstração)', target: 15000.0, current: 4270.5 }];
  base.patrimonio = [
    { id: 1, tipo: 'ativo', nome: 'Ações / FIIs (demonstração)', val: 8500.0 },
    { id: 2, tipo: 'passivo', nome: 'Financiamento Veículo (demonstração)', val: 14000.0 }
  ];
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
      currency: 'BRL'
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
  return safe;
}
