import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const instances = new Map();

function themeColors() {
  const styles = getComputedStyle(document.documentElement);
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    text: styles.getPropertyValue('--text').trim() || (isDark ? '#f9fafb' : '#0f172a'),
    grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    primary: styles.getPropertyValue('--primary').trim() || '#7c3aed',
    green: styles.getPropertyValue('--accent-green').trim() || '#10b981',
    red: styles.getPropertyValue('--accent-red').trim() || '#ef4444',
    amber: styles.getPropertyValue('--accent-amber').trim() || '#f59e0b',
    blue: styles.getPropertyValue('--accent-blue').trim() || '#2563eb',
    purple: styles.getPropertyValue('--accent-purple').trim() || '#8b5cf6'
  };
}

export function renderChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  instances.get(canvasId)?.destroy();
  const chart = new Chart(canvas, config);
  instances.set(canvasId, chart);
  return chart;
}

export function barIncomeExpense(canvasId, income, expenses) {
  const c = themeColors();
  return renderChart(canvasId, {
    type: 'bar',
    data: { labels: ['Receitas', 'Despesas'], datasets: [{ data: [income, expenses], backgroundColor: [c.green, c.red], borderRadius: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { color: c.text }, grid: { display: false } }, y: { ticks: { color: c.text }, grid: { color: c.grid } } }
    }
  });
}

export function doughnutCategories(canvasId, labels, data) {
  const c = themeColors();
  const palette = [c.purple, c.green, c.amber, c.blue, c.red, '#64748b', '#ec4899'];
  return renderChart(canvasId, {
    type: 'doughnut',
    data: { labels: labels.length ? labels : ['Sem dados'], datasets: [{ data: data.length ? data : [1], backgroundColor: palette, borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: c.text, font: { size: 11 } } } } }
  });
}

export function lineForecast(canvasId, labels, values, label = 'Saldo previsto', color = null) {
  const c = themeColors();
  const lineColor = color || c.blue;
  return renderChart(canvasId, {
    type: 'line',
    data: { labels, datasets: [{ label, data: values, borderColor: lineColor, backgroundColor: `${lineColor}26`, fill: true, tension: 0.3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { color: c.text }, grid: { display: false } }, y: { ticks: { color: c.text }, grid: { color: c.grid } } }
    }
  });
}

export function lineEvolution(canvasId, labels, incomeSeries, expenseSeries) {
  const c = themeColors();
  return renderChart(canvasId, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Receitas', data: incomeSeries, borderColor: c.green, backgroundColor: 'transparent', tension: 0.3 },
        { label: 'Despesas', data: expenseSeries, borderColor: c.red, backgroundColor: 'transparent', tension: 0.3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: c.text } } },
      scales: { x: { ticks: { color: c.text }, grid: { display: false } }, y: { ticks: { color: c.text }, grid: { color: c.grid } } }
    }
  });
}
