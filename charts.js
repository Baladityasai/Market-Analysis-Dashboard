// ============================================================
// charts.js — Chart.js Visualization Layer
// ============================================================

// Global Chart.js theme config
Chart.defaults.color = '#8888aa';
Chart.defaults.borderColor = 'rgba(255,255,255,0.04)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15,15,28,0.92)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(0,210,255,0.2)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 13 };
Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
Chart.defaults.animation = { duration: 800, easing: 'easeOutQuart' };

const CHART_COLORS = {
  teal:   { bg: 'rgba(0,210,255,0.7)',   border: '#00d2ff' },
  purple: { bg: 'rgba(123,47,247,0.7)',   border: '#7b2ff7' },
  pink:   { bg: 'rgba(255,45,135,0.7)',   border: '#ff2d87' },
  green:  { bg: 'rgba(0,230,118,0.7)',    border: '#00e676' },
  orange: { bg: 'rgba(255,145,0,0.7)',    border: '#ff9100' },
  blue:   { bg: 'rgba(102,126,234,0.7)',  border: '#667eea' },
};

const CHANNEL_COLORS = {
  'Paid Search': CHART_COLORS.blue,
  'Social':      CHART_COLORS.pink,
  'Email':       CHART_COLORS.green,
  'Organic':     CHART_COLORS.teal,
  'Display':     CHART_COLORS.orange,
};

// Store chart instances for destruction on re-render
const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

// ---- 1. Channel Performance (Grouped Bar) ----
function renderChannelPerfChart(channelData) {
  const id = 'chart-channel-perf';
  destroyChart(id);
  const labels = Object.keys(channelData);
  chartInstances[id] = new Chart(document.getElementById(id), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Impressions (÷1K)',
          data: labels.map(ch => Math.round(channelData[ch].impressions / 1000)),
          backgroundColor: 'rgba(102,126,234,0.65)',
          borderColor: '#667eea',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Clicks',
          data: labels.map(ch => channelData[ch].clicks),
          backgroundColor: 'rgba(0,210,255,0.65)',
          borderColor: '#00d2ff',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Customers',
          data: labels.map(ch => channelData[ch].customers_acquired),
          backgroundColor: 'rgba(0,230,118,0.65)',
          borderColor: '#00e676',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { callback: v => fmtNumber(v) } },
      },
    },
  });
}

// ---- 2. Spend vs Revenue Trend (Dual Line) ----
function renderSpendRevenueTrend(weeklyData) {
  const id = 'chart-spend-revenue';
  destroyChart(id);
  // Estimate weekly revenue proportionally
  const totalSpend = weeklyData.reduce((s, w) => s + w.ad_spend, 0);

  chartInstances[id] = new Chart(document.getElementById(id), {
    type: 'line',
    data: {
      labels: weeklyData.map(w => {
        const d = new Date(w.week);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Ad Spend',
          data: weeklyData.map(w => Math.round(w.ad_spend)),
          borderColor: '#ff2d87',
          backgroundColor: 'rgba(255,45,135,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2.5,
        },
        {
          label: 'Est. Revenue',
          data: weeklyData.map(w => Math.round(w.customers_acquired * 2800)),
          borderColor: '#00e676',
          backgroundColor: 'rgba(0,230,118,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
        y: { beginAtZero: true, ticks: { callback: v => fmtCurrency(v) } },
      },
    },
  });
}

// ---- 3. Budget Distribution (Doughnut) ----
function renderBudgetMix(channelData) {
  const id = 'chart-budget-mix';
  destroyChart(id);
  const labels = Object.keys(channelData);

  chartInstances[id] = new Chart(document.getElementById(id), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: labels.map(ch => Math.round(channelData[ch].ad_spend)),
        backgroundColor: labels.map(ch => CHANNEL_COLORS[ch]?.bg || '#555'),
        borderColor: labels.map(ch => CHANNEL_COLORS[ch]?.border || '#888'),
        borderWidth: 2,
        hoverOffset: 14,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { padding: 14 } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${fmtCurrency(ctx.raw)} (${((ctx.raw / ctx.dataset.data.reduce((a, b) => a + b)) * 100).toFixed(1)}%)`,
          },
        },
      },
    },
  });
}

// ---- 4. Weekly Trends (Line) ----
function renderWeeklyTrend(weeklyData) {
  const id = 'chart-weekly-trend';
  destroyChart(id);

  chartInstances[id] = new Chart(document.getElementById(id), {
    type: 'line',
    data: {
      labels: weeklyData.map(w => {
        const d = new Date(w.week);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Clicks',
          data: weeklyData.map(w => w.clicks),
          borderColor: '#00d2ff',
          backgroundColor: 'rgba(0,210,255,0.06)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Leads',
          data: weeklyData.map(w => w.leads),
          borderColor: '#7b2ff7',
          backgroundColor: 'rgba(123,47,247,0.06)',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top' } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
        y:  { type: 'linear', position: 'left',  beginAtZero: true, title: { display: true, text: 'Clicks', color: '#00d2ff' }, ticks: { color: '#00d2ff' } },
        y1: { type: 'linear', position: 'right', beginAtZero: true, title: { display: true, text: 'Leads',  color: '#7b2ff7' }, ticks: { color: '#7b2ff7' }, grid: { drawOnChartArea: false } },
      },
    },
  });
}

// ---- 5. Campaign Radar ----
function renderCampaignRadar(campaignAgg) {
  const id = 'chart-radar';
  destroyChart(id);

  // Pick top 4 campaigns by total clicks
  const sorted = Object.entries(campaignAgg)
    .sort((a, b) => b[1].clicks - a[1].clicks)
    .slice(0, 4);

  const colors = [CHART_COLORS.teal, CHART_COLORS.purple, CHART_COLORS.pink, CHART_COLORS.orange];

  // Normalize each dimension 0-100
  const dims = ['clicks', 'leads', 'mql', 'customers_acquired'];
  const dimLabels = ['Clicks', 'Leads', 'MQLs', 'Customers'];
  const maxVals = dims.map(d => Math.max(...sorted.map(([, v]) => v[d])));

  // Add CTR and CVR
  dimLabels.push('CTR', 'CVR');

  chartInstances[id] = new Chart(document.getElementById(id), {
    type: 'radar',
    data: {
      labels: dimLabels,
      datasets: sorted.map(([campId, data], i) => {
        const camp = campaigns.find(c => c.campaign_id === campId);
        const ctr = calcCTR(data.clicks, data.impressions);
        const cvr = calcCVR(data.customers_acquired, data.clicks);
        const maxCTR = Math.max(...sorted.map(([, v]) => calcCTR(v.clicks, v.impressions)));
        const maxCVR = Math.max(...sorted.map(([, v]) => calcCVR(v.customers_acquired, v.clicks)));
        return {
          label: camp ? camp.name.split(' ').slice(0, 3).join(' ') : campId,
          data: [
            ...dims.map((d, j) => maxVals[j] ? (data[d] / maxVals[j] * 100) : 0),
            maxCTR ? (ctr / maxCTR * 100) : 0,
            maxCVR ? (cvr / maxCVR * 100) : 0,
          ],
          borderColor: colors[i].border,
          backgroundColor: colors[i].bg.replace('0.7', '0.12'),
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: colors[i].border,
        };
      }),
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: { color: '#8888aa', font: { size: 11 } },
        },
      },
      plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } },
    },
  });
}

// ---- 6. ROI by Campaign (Horizontal Bar) ----
function renderROIBar(campaignAgg) {
  const id = 'chart-roi-bar';
  destroyChart(id);

  const entries = Object.entries(campaignAgg).map(([campId, data]) => {
    const camp = campaigns.find(c => c.campaign_id === campId);
    const revenue = getRevenueForCampaign(campId);
    const roi = calcROI(revenue, data.ad_spend);
    return { name: camp ? camp.name : campId, roi, campId };
  }).sort((a, b) => b.roi - a.roi);

  chartInstances[id] = new Chart(document.getElementById(id), {
    type: 'bar',
    data: {
      labels: entries.map(e => e.name.length > 20 ? e.name.slice(0, 20) + '…' : e.name),
      datasets: [{
        label: 'ROI %',
        data: entries.map(e => Math.round(e.roi)),
        backgroundColor: entries.map(e => e.roi >= 200 ? 'rgba(0,230,118,0.65)' : e.roi >= 100 ? 'rgba(0,210,255,0.65)' : e.roi >= 0 ? 'rgba(255,145,0,0.65)' : 'rgba(255,23,68,0.65)'),
        borderColor: entries.map(e => e.roi >= 200 ? '#00e676' : e.roi >= 100 ? '#00d2ff' : e.roi >= 0 ? '#ff9100' : '#ff1744'),
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `ROI: ${ctx.raw}%` } },
      },
      scales: {
        x: { beginAtZero: true, ticks: { callback: v => v + '%' } },
        y: { grid: { display: false } },
      },
    },
  });
}
