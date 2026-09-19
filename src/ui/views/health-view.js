import { buildHealthIndicators } from '../../services/health-service.js';
import { buildAchievements } from '../../services/gamification-service.js';
import { escapeHtml } from '../../utils/sanitize.js';

function barColor(score) {
  if (score === null) return 'var(--text-muted)';
  if (score >= 75) return 'var(--accent-green)';
  if (score >= 50) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

export function renderHealth(root) {
  const indicators = buildHealthIndicators();
  const achievements = buildAchievements();
  const achievedCount = achievements.filter((a) => a.done).length;

  root.innerHTML = `
    <div class="card">
      <div class="card-header"><h3 class="card-title">Saúde Financeira</h3></div>
      <p class="text-muted" style="font-size:0.82rem;margin-bottom:16px;">Leitura detalhada da sua situação financeira atual. Cada indicador vem com a explicação de como foi calculado — nenhum número aparece sozinho.</p>

      ${indicators.map((ind) => `
        <div style="margin-bottom:18px;">
          <div class="progress-labels" style="margin-bottom:6px;"><span>${escapeHtml(ind.label)}</span>${ind.score !== null ? `<span>${ind.score}</span>` : ''}</div>
          <div class="progress-track"><div class="progress-fill" style="width:${ind.score ?? 0}%;background:${barColor(ind.score)}"></div></div>
          <p class="text-muted" style="font-size:0.8rem;margin-top:6px;">${escapeHtml(ind.text)}</p>
        </div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header"><h3 class="card-title">Conquistas</h3><span class="badge">${achievedCount}/${achievements.length}</span></div>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:14px;">Marcos de organização financeira, calculados a partir dos seus dados reais.</p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${achievements.map((a) => `
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <i class="fa-solid ${a.done ? 'fa-circle-check' : 'fa-circle'}" style="color:${a.done ? 'var(--accent-green)' : 'var(--text-muted)'};margin-top:2px;"></i>
            <div>
              <p style="font-weight:600;${a.done ? '' : 'color:var(--text-muted);'}">${escapeHtml(a.label)}</p>
              ${!a.done ? `<p class="text-muted" style="font-size:0.75rem;">${escapeHtml(a.hint)}</p>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}
