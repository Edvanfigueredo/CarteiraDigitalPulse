import { getMonthEvents, groupEventsByDay, monthTotals } from '../../services/calendar-service.js';
import { addRecurringIncome, addRecurringExpense, listRecurringIncomes, listRecurringExpenses, removeRecurringIncome, removeRecurringExpense } from '../../repositories/recurring-repository.js';
import { listAccounts } from '../../repositories/account-repository.js';
import { payInstallment } from '../../services/debt-service.js';
import { saveTransaction } from '../../services/transaction-service.js';
import { money, monthLabel, currentMonth, todayISO } from '../../utils/format.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
let viewingMonth = currentMonth();

function shiftMonth(yyyyMm, delta) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Semana começa na segunda-feira: Date#getDay() retorna 0=domingo..6=sábado,
// então convertemos para 0=segunda..6=domingo.
function mondayFirstIndex(date) { return (date.getDay() + 6) % 7; }

function chipLabel(val) {
  // Trunca como no app de referência ("+R$..."), mantendo o sinal visível
  // mesmo em telas estreitas; o valor completo aparece no modal do dia.
  const text = money(val).replace(/\s/g, '');
  return text.length > 9 ? `${text.slice(0, 8)}…` : text;
}

function destinoOptions() {
  const contas = listAccounts().map((c) => `<option value="conta_${c.id}">${escapeHtml(c.nome)}</option>`);
  return contas.join('') || '<option value="">Nenhuma conta cadastrada</option>';
}

export function renderCalendar(root) {
  const events = getMonthEvents(viewingMonth);
  const byDay = groupEventsByDay(events);
  const totals = monthTotals(events);
  const [year, monthNum] = viewingMonth.split('-').map(Number);
  const firstWeekday = mondayFirstIndex(new Date(year, monthNum - 1, 1));
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const today = todayISO();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  root.innerHTML = `
    <div class="card">
      <div class="calendar-nav">
        <button class="btn btn-ghost btn-sm" id="cal-prev" type="button" aria-label="Mês anterior"><i class="fa-solid fa-chevron-left"></i></button>
        <span class="calendar-month-label">${escapeHtml(monthLabel(viewingMonth))}</span>
        <button class="btn btn-ghost btn-sm" id="cal-next" type="button" aria-label="Próximo mês"><i class="fa-solid fa-chevron-right"></i></button>
      </div>

      <div class="calendar-summary">
        <span class="legend-row"><span class="legend-dot legend-dot-entrada"></span> Entradas <span class="val-plus">+${money(totals.entradas)}</span></span>
        <span class="legend-row"><span class="legend-dot legend-dot-saida"></span> Saídas <span class="val-minus">-${money(totals.saidas)}</span></span>
        <span class="legend-row">Saldo <span class="${totals.saldo >= 0 ? 'val-plus' : 'val-minus'}">${money(totals.saldo)}</span></span>
      </div>

      <div class="calendar-grid">
        ${WEEKDAYS.map((w) => `<div class="calendar-weekday">${w}</div>`).join('')}
        ${cells.map((d) => {
          if (!d) return '<div class="calendar-day empty"></div>';
          const dateStr = `${viewingMonth}-${String(d).padStart(2, '0')}`;
          const dayEvents = byDay[dateStr] || [];
          const isToday = dateStr === today;
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;
          return `<button class="calendar-day${isToday ? ' today' : ''}" type="button" data-date="${dateStr}">
            <span class="day-number">${d}</span>
            ${visible.map((e) => `<span class="chip chip-${e.tipo}${e.status === 'pago' ? ' chip-paga' : ''}">${e.tipo === 'receita' ? '+' : '−'}${chipLabel(e.val)}</span>`).join('')}
            ${overflow > 0 ? `<span class="chip-more">+${overflow}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Receitas e Despesas Recorrentes</h3></div>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:12px;">Cadastradas aqui, elas entram automaticamente no calendário e na previsão de todos os meses seguintes.</p>

      <div class="form-grid" style="margin-bottom:14px;">
        <form id="income-form" class="field" style="grid-column:1/-1;border:1px dashed var(--border);border-radius:var(--radius-sm);padding:12px;">
          <label style="font-weight:700;">+ Renda recorrente</label>
          <div class="form-grid">
            <input id="inc-desc" placeholder="Ex: Salário" required />
            <input id="inc-val" type="number" step="0.01" placeholder="Valor" required />
            <select id="inc-conta">${destinoOptions()}</select>
            <label style="flex-direction:row;align-items:center;gap:8px;">
              <input id="inc-ultimo-dia" type="checkbox" style="width:auto;min-height:auto;" checked />
              <span>Recebo no último dia útil do mês</span>
            </label>
            <input id="inc-dia-fixo" type="number" min="1" max="31" placeholder="Ou dia fixo (1-31)" disabled />
          </div>
          <button class="btn btn-secondary btn-sm" type="submit" style="margin-top:8px;">Adicionar renda</button>
        </form>
      </div>

      ${listRecurringIncomes().length ? `<div class="table-wrap" style="margin-bottom:16px;"><table><thead><tr><th>Renda</th><th>Valor</th><th>Recebimento</th><th></th></tr></thead><tbody>
        ${listRecurringIncomes().map((r) => `<tr>
          <td data-label="Renda">${escapeHtml(r.desc)}</td>
          <td data-label="Valor" class="val-plus">${money(r.val)}</td>
          <td data-label="Recebimento">${r.ultimoDiaUtil ? 'Último dia útil' : `Dia ${r.diaFixo}`}</td>
          <td data-label=""><button class="btn btn-ghost btn-sm" type="button" data-remove-income="${r.id}"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('')}
      </tbody></table></div>` : ''}

      <form id="expense-form" class="field" style="border:1px dashed var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:14px;">
        <label style="font-weight:700;">+ Despesa recorrente</label>
        <div class="form-grid">
          <input id="exp-desc" placeholder="Ex: Aluguel" required />
          <input id="exp-val" type="number" step="0.01" placeholder="Valor" required />
          <input id="exp-dia" type="number" min="1" max="31" placeholder="Dia do vencimento" required />
          <select id="exp-conta">${destinoOptions()}</select>
        </div>
        <button class="btn btn-secondary btn-sm" type="submit" style="margin-top:8px;">Adicionar despesa</button>
      </form>

      ${listRecurringExpenses().length ? `<div class="table-wrap"><table><thead><tr><th>Despesa</th><th>Valor</th><th>Vencimento</th><th></th></tr></thead><tbody>
        ${listRecurringExpenses().map((r) => `<tr>
          <td data-label="Despesa">${escapeHtml(r.desc)}</td>
          <td data-label="Valor" class="val-minus">${money(r.val)}</td>
          <td data-label="Vencimento">Todo dia ${r.diaVencimento}</td>
          <td data-label=""><button class="btn btn-ghost btn-sm" type="button" data-remove-expense="${r.id}"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`).join('')}
      </tbody></table></div>` : ''}
    </div>`;

  document.getElementById('cal-prev').addEventListener('click', () => { viewingMonth = shiftMonth(viewingMonth, -1); renderCalendar(root); });
  document.getElementById('cal-next').addEventListener('click', () => { viewingMonth = shiftMonth(viewingMonth, 1); renderCalendar(root); });

  document.getElementById('inc-ultimo-dia').addEventListener('change', (e) => {
    document.getElementById('inc-dia-fixo').disabled = e.target.checked;
  });

  root.querySelectorAll('[data-date]').forEach((btn) => btn.addEventListener('click', () => openDayModal(btn.dataset.date, byDay[btn.dataset.date] || [], root)));

  document.getElementById('income-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addRecurringIncome({
      desc: document.getElementById('inc-desc').value,
      val: document.getElementById('inc-val').value,
      contaId: document.getElementById('inc-conta').value,
      ultimoDiaUtil: document.getElementById('inc-ultimo-dia').checked,
      diaFixo: document.getElementById('inc-dia-fixo').value
    });
    showToast('Renda recorrente adicionada.', 'success');
    renderCalendar(root);
  });

  document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addRecurringExpense({
      desc: document.getElementById('exp-desc').value,
      val: document.getElementById('exp-val').value,
      diaVencimento: document.getElementById('exp-dia').value,
      contaId: document.getElementById('exp-conta').value
    });
    showToast('Despesa recorrente adicionada.', 'success');
    renderCalendar(root);
  });

  root.querySelectorAll('[data-remove-income]').forEach((btn) => btn.addEventListener('click', async () => { await removeRecurringIncome(Number(btn.dataset.removeIncome)); renderCalendar(root); }));
  root.querySelectorAll('[data-remove-expense]').forEach((btn) => btn.addEventListener('click', async () => { await removeRecurringExpense(Number(btn.dataset.removeExpense)); renderCalendar(root); }));
}

function openDayModal(dateStr, dayEvents, root) {
  const rows = dayEvents.length
    ? dayEvents.map((e, i) => `
      <div class="card" style="background:var(--bg-input);margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <div>
            <p style="font-weight:600;">${escapeHtml(e.desc)}</p>
            <p class="text-muted" style="font-size:0.75rem;">${e.tipo === 'receita' ? 'Receita' : 'Despesa'} · ${e.status === 'pago' ? 'Pago' : e.status === 'pendente' ? 'Pendente' : 'Projetado'}</p>
          </div>
          <p class="${e.tipo === 'receita' ? 'val-plus' : 'val-minus'}" style="font-weight:700;">${money(e.val)}</p>
        </div>
        ${e.status !== 'pago' && (e.origem === 'parcela' || e.origem === 'despesa_recorrente') ? `<button class="btn btn-primary btn-sm btn-block" style="margin-top:8px;" data-pay="${i}">Marcar como paga</button>` : ''}
      </div>`).join('')
    : '<p class="text-muted">Nenhum compromisso neste dia.</p>';

  const close = openModal({
    title: `Compromissos — ${dateStr.split('-').reverse().join('/')}`,
    bodyHtml: rows,
    onMount: (body) => {
      body.querySelectorAll('[data-pay]').forEach((btn) => btn.addEventListener('click', async () => {
        const e = dayEvents[Number(btn.dataset.pay)];
        if (e.origem === 'parcela') {
          await payInstallment(e.refId.dividaId, e.refId.numero, { dataPagamento: dateStr });
        } else if (e.origem === 'despesa_recorrente') {
          await saveTransaction({ desc: e.desc, val: e.val, tipo: 'despesa', date: dateStr, contaId: null, cat: 'Geral', status: 'pago' });
        }
        showToast('Compromisso marcado como pago.', 'success');
        close();
        renderCalendar(root);
      }));
    }
  });
}
