import { getData, mutate } from '../core/store.js';
import { addMonths } from '../utils/dates.js';

export function listDebts() { return getData().dividas; }
export function listOpenDebts() { return listDebts().filter((d) => d.status !== 'quitada'); }

export function pendingInstallments() {
  const out = [];
  listDebts().forEach((d) => {
    d.parcelas.forEach((p) => { if (p.status === 'pendente') out.push({ ...p, dividaId: d.id, dividaNome: d.nome, categoria: d.categoria }); });
  });
  return out;
}

// Saldo devedor: soma das parcelas ainda não pagas de todas as dívidas abertas.
export function outstandingBalance() {
  return listDebts().reduce((total, d) => total + d.parcelas.filter((p) => p.status === 'pendente').reduce((a, p) => a + p.valor, 0), 0);
}

function buildInstallments({ parcelada, numParcelas, valorTotal, primeiroVencimento, contaId }) {
  const count = parcelada ? Math.max(1, Number(numParcelas) || 1) : 1;
  const portion = Math.round((valorTotal / count) * 100) / 100;
  return Array.from({ length: count }, (_, i) => {
    const isLast = i === count - 1;
    const valor = isLast ? Math.round((valorTotal - portion * (count - 1)) * 100) / 100 : portion;
    return {
      numero: i + 1,
      vencimento: primeiroVencimento ? addMonths(primeiroVencimento, i) : null,
      valor,
      status: 'pendente',
      dataPagamento: null,
      contaId: contaId || null,
      transacaoId: null
    };
  });
}

export async function addDebt(form) {
  const valorTotal = Number(form.valorTotal) || 0;
  const parcelada = !!form.parcelada;
  const numParcelas = parcelada ? Math.max(1, Number(form.numParcelas) || 1) : 1;
  const parcelas = buildInstallments({
    parcelada, numParcelas, valorTotal,
    primeiroVencimento: form.primeiroVencimento, contaId: form.contaId
  });
  const debt = {
    id: Date.now(),
    nome: form.nome,
    categoria: form.categoria || 'Geral',
    credor: form.credor || '',
    valorTotal,
    dataContratacao: form.dataContratacao || null,
    parcelada,
    numParcelas,
    valorParcela: parcelas[0]?.valor || valorTotal,
    juros: Number(form.juros) || 0,
    observacoes: form.observacoes || '',
    status: 'aberta',
    parcelas
  };
  await mutate((data) => { data.dividas.push(debt); return data; });
  return debt;
}

export async function removeDebt(id) {
  await mutate((data) => { data.dividas = data.dividas.filter((d) => d.id !== id); return data; });
}

// Retorna o id de repositório de transação usado (útil para o serviço que
// cria a transação real correspondente ao pagamento).
export async function setInstallmentStatus(debtId, numero, patch) {
  await mutate((data) => {
    const debt = data.dividas.find((d) => d.id === debtId);
    if (!debt) return data;
    const parcela = debt.parcelas.find((p) => p.numero === numero);
    if (!parcela) return data;
    Object.assign(parcela, patch);
    debt.status = debt.parcelas.every((p) => p.status === 'paga') ? 'quitada' : 'aberta';
    return data;
  });
}
