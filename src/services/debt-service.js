import { listDebts, setInstallmentStatus } from '../repositories/debt-repository.js';
import { addTransaction, removeTransaction, nextId } from '../repositories/transaction-repository.js';
import { todayISO } from '../utils/format.js';

// Marca uma parcela (ou uma dívida não parcelada, que tem uma única
// "parcela 1/1") como paga. Isso:
//  1. registra uma transação real de despesa;
//  2. atualiza o status da parcela e guarda o vínculo com a transação;
//  3. recalcula o status da dívida (quitada quando não sobra parcela pendente).
// Nada disso duplica lançamento: a transação criada aqui é a mesma que
// aparece em Transações, Relatórios, Dashboard e Calendário — todos leem a
// mesma fonte (transaction-repository).
export async function payInstallment(debtId, numero, { contaId, dataPagamento } = {}) {
  const debt = listDebts().find((d) => d.id === debtId);
  if (!debt) return;
  const parcela = debt.parcelas.find((p) => p.numero === numero);
  if (!parcela || parcela.status === 'paga') return;

  const destino = contaId || parcela.contaId;
  const pagamento = dataPagamento || todayISO();
  const txId = nextId();

  await addTransaction({
    id: txId,
    desc: debt.parcelada ? `${debt.nome} (parcela ${numero}/${debt.numParcelas})` : debt.nome,
    val: parcela.valor,
    tipo: 'despesa',
    date: pagamento,
    contaId: destino,
    cat: debt.categoria,
    tag: 'Dívida',
    status: 'pago'
  });

  await setInstallmentStatus(debtId, numero, {
    status: 'paga',
    dataPagamento: pagamento,
    contaId: destino,
    transacaoId: txId
  });
}

// Desfaz o pagamento: remove a transação gerada e volta a parcela para
// pendente. Existe para corrigir marcações feitas por engano.
export async function undoInstallmentPayment(debtId, numero) {
  const debt = listDebts().find((d) => d.id === debtId);
  const parcela = debt?.parcelas.find((p) => p.numero === numero);
  if (!parcela || parcela.status !== 'paga') return;

  if (parcela.transacaoId) await removeTransaction(parcela.transacaoId);
  await setInstallmentStatus(debtId, numero, { status: 'pendente', dataPagamento: null, transacaoId: null });
}
