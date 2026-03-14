// ============================================================
// dashboard.js — Main Application Logic
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const channelFilter = document.getElementById('channel-filter');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  let currentSort = { key: 'roi', dir: 'desc' };

  // ---- Initial render ----
  renderDashboard();

  // ---- Wire filter events ----
  channelFilter.addEventListener('change', renderDashboard);
  startDateInput.addEventListener('change', renderDashboard);
  endDateInput.addEventListener('change', renderDashboard);

  // ---- Sortable table headers ----
  document.querySelectorAll('.campaign-table thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (currentSort.key === key) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort = { key, dir: 'desc' };
      }
      document.querySelectorAll('.campaign-table thead th').forEach(t => t.classList.remove('sort-active'));
      th.classList.add('sort-active');
      renderDashboard();
    });
  });

  // ============================================================
  // Core render function
  // ============================================================
  function renderDashboard() {
    const filters = {
      channelFilter: channelFilter.value,
      startDate: startDateInput.value || null,
      endDate: endDateInput.value || null,
    };

    const filtered = filterMetrics(filters);
    const agg = aggregateMetrics(filtered);
    const totalRevenue = getTotalRevenue(filters);
    const channelData = aggregateByChannel(filters);
    const weeklyData = aggregateByWeek(filters);
    const campaignAgg = aggregateByCampaign(filters);

    // ---- KPI Cards ----
    try { updateKPIs(agg, totalRevenue); } catch(e) { console.error('KPI render error:', e); }

    // ---- Charts ----
    try { renderChannelPerfChart(channelData); } catch(e) { console.error('Channel chart error:', e); }
    try { renderSpendRevenueTrend(weeklyData); } catch(e) { console.error('Spend/Revenue chart error:', e); }
    try { renderBudgetMix(channelData); } catch(e) { console.error('Budget chart error:', e); }
    try { renderWeeklyTrend(weeklyData); } catch(e) { console.error('Weekly trend error:', e); }
    try { renderCampaignRadar(campaignAgg); } catch(e) { console.error('Radar chart error:', e); }
    try { renderROIBar(campaignAgg); } catch(e) { console.error('ROI bar error:', e); }

    // ---- Funnel ----
    try { renderFunnel(agg); } catch(e) { console.error('Funnel error:', e); }

    // ---- Campaign Table ----
    try { renderCampaignTable(campaignAgg, currentSort); } catch(e) { console.error('Table error:', e); }

    // ---- Insights ----
    try { renderInsights(channelData, campaignAgg, agg, totalRevenue); } catch(e) { console.error('Insights error:', e); }
  }

  // ============================================================
  // KPI Cards with animated count-up
  // ============================================================
  function updateKPIs(agg, totalRevenue) {
    const ctr = calcCTR(agg.clicks, agg.impressions);
    const cvr = calcCVR(agg.customers_acquired, agg.clicks);
    const cpl = calcCPL(agg.ad_spend, agg.leads);
    const roas = calcROAS(totalRevenue, agg.ad_spend);

    animateValue('kpi-spend-value',   agg.ad_spend,  fmtCurrency);
    animateValue('kpi-revenue-value', totalRevenue,   fmtCurrency);
    animateValue('kpi-ctr-value',     ctr,            fmtPercent);
    animateValue('kpi-cvr-value',     cvr,            fmtPercent);
    animateValue('kpi-cpl-value',     cpl,            fmtCurrency);
    animateValue('kpi-roas-value',    roas,           v => v.toFixed(2) + 'x');

    // Simulated period-over-period changes
    setChange('kpi-spend-change',   +8.3,  '▲ 8.3% vs prev period');
    setChange('kpi-revenue-change', +14.7, '▲ 14.7% vs prev period');
    setChange('kpi-ctr-change',     +2.1,  '▲ 2.1% vs prev period');
    setChange('kpi-cvr-change',     -0.4,  '▼ 0.4% vs prev period');
    setChange('kpi-cpl-change',     -5.2,  '▼ 5.2% vs prev period');
    setChange('kpi-roas-change',    +11.0, '▲ 11.0% vs prev period');
  }

  function animateValue(elId, target, formatter) {
    const el = document.getElementById(elId);
    const duration = 800;
    const start = performance.now();
    const startVal = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      const current = startVal + (target - startVal) * eased;
      el.textContent = formatter(current);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function setChange(elId, val, text) {
    const el = document.getElementById(elId);
    el.textContent = text;
    el.className = 'kpi-change ' + (val > 0 ? 'positive' : val < 0 ? 'negative' : 'neutral');
  }

  // ============================================================
  // Funnel
  // ============================================================
  function renderFunnel(agg) {
    const stages = [
      { label: 'Impressions',  value: agg.impressions },
      { label: 'Clicks',       value: agg.clicks },
      { label: 'Leads',        value: agg.leads },
      { label: 'MQLs',         value: agg.mql },
      { label: 'Customers',    value: agg.customers_acquired },
    ];

    const container = document.getElementById('funnel-stages');
    container.innerHTML = '';

    stages.forEach((stage, i) => {
      // Stage block
      const stageEl = document.createElement('div');
      stageEl.className = 'funnel-stage';
      stageEl.innerHTML = `
        <div class="funnel-bar">${fmtNumber(stage.value)}</div>
        <div class="funnel-label">${stage.label}</div>
      `;
      container.appendChild(stageEl);

      // Arrow with conversion rate
      if (i < stages.length - 1) {
        const rate = stages[i].value ? (stages[i + 1].value / stages[i].value * 100).toFixed(1) : '0.0';
        const arrowEl = document.createElement('div');
        arrowEl.className = 'funnel-arrow';
        arrowEl.innerHTML = `
          <span class="arrow-icon">→</span>
          <span class="conv-rate">${rate}%</span>
        `;
        container.appendChild(arrowEl);
      }
    });
  }

  // ============================================================
  // Campaign Table
  // ============================================================
  function renderCampaignTable(campaignAgg, sort) {
    const rows = Object.entries(campaignAgg).map(([campId, data]) => {
      const camp = campaigns.find(c => c.campaign_id === campId);
      const revenue = getRevenueForCampaign(campId);
      const ctr = calcCTR(data.clicks, data.impressions);
      const roi = calcROI(revenue, data.ad_spend);
      return {
        campId,
        name: camp ? camp.name : campId,
        channel: camp ? camp.channel : '—',
        impressions: data.impressions,
        clicks: data.clicks,
        leads: data.leads,
        customers: data.customers_acquired,
        spend: data.ad_spend,
        ctr,
        roi,
        status: roi > 150 ? 'up' : roi < 50 ? 'down' : 'flat',
      };
    });

    // Sort
    const sortKey = sort.key;
    rows.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (sort.dir === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });

    const tbody = document.getElementById('campaign-table-body');
    tbody.innerHTML = rows.map(r => {
      const chClass = r.channel.toLowerCase().replace(/\s+/g, '-');
      const statusSymbol = r.status === 'up' ? '▲' : r.status === 'down' ? '▼' : '→';
      return `<tr>
        <td>${r.name}</td>
        <td><span class="channel-badge ${chClass}">${r.channel}</span></td>
        <td>${fmtNumber(r.impressions)}</td>
        <td>${fmtNumber(r.clicks)}</td>
        <td>${fmtNumber(r.leads)}</td>
        <td>${fmtNumber(r.customers)}</td>
        <td>${fmtCurrency(r.spend)}</td>
        <td>${fmtPercent(r.ctr)}</td>
        <td>${Math.round(r.roi)}%</td>
        <td><span class="status-indicator ${r.status}">${statusSymbol}</span></td>
      </tr>`;
    }).join('');
  }

  // ============================================================
  // AI-Generated Insights
  // ============================================================
  function renderInsights(channelData, campaignAgg, agg, totalRevenue) {
    const insights = [];

    // 1. Best performing channel by ROI
    let bestChannel = null, bestROI = -Infinity;
    Object.entries(channelData).forEach(([ch, data]) => {
      const roi = calcROI(data.revenue, data.ad_spend);
      if (roi > bestROI) { bestROI = roi; bestChannel = ch; }
    });
    if (bestChannel) {
      insights.push({
        icon: 'success',
        title: `${bestChannel} delivers strongest ROI at ${Math.round(bestROI)}%`,
        body: `This channel outperforms others in efficiency. Consider increasing budget allocation by 15-20% to capitalize on the current momentum while maintaining quality scores.`,
        tag: 'finding',
      });
    }

    // 2. Worst performing channel by CPL
    let worstChannel = null, worstCPL = -Infinity;
    Object.entries(channelData).forEach(([ch, data]) => {
      const cpl = calcCPL(data.ad_spend, data.leads);
      if (cpl > worstCPL) { worstCPL = cpl; worstChannel = ch; }
    });
    if (worstChannel) {
      insights.push({
        icon: 'warning',
        title: `${worstChannel} has highest CPL at ${fmtCurrency(worstCPL)}`,
        body: `Cost per lead is significantly above average. Review targeting criteria, ad creative relevance, and landing page conversion rates. A/B test new ad copy to lower acquisition costs.`,
        tag: 'root-cause',
      });
    }

    // 3. Funnel drop-off analysis
    const clickToLead = agg.leads / agg.clicks * 100;
    const mqlToCustomer = agg.mql ? (agg.customers_acquired / agg.mql * 100) : 0;
    if (clickToLead < 8) {
      insights.push({
        icon: 'finding',
        title: `Click-to-lead conversion is low at ${clickToLead.toFixed(1)}%`,
        body: `Most visitors are not converting to leads. Audit landing pages for UX issues, ensure messaging aligns with ad copy, and consider adding exit-intent offers or simplified forms.`,
        tag: 'action',
      });
    }

    // 4. Best campaign
    let bestCamp = null, bestCampROI = -Infinity;
    Object.entries(campaignAgg).forEach(([campId, data]) => {
      const rev = getRevenueForCampaign(campId);
      const roi = calcROI(rev, data.ad_spend);
      if (roi > bestCampROI) {
        bestCampROI = roi;
        bestCamp = campaigns.find(c => c.campaign_id === campId);
      }
    });
    if (bestCamp) {
      insights.push({
        icon: 'success',
        title: `"${bestCamp.name}" is the top performer with ${Math.round(bestCampROI)}% ROI`,
        body: `Analyze what makes this campaign successful — targeting, creative, timing — and replicate these elements across underperforming campaigns in the same channel.`,
        tag: 'finding',
      });
    }

    // 5. Overall ROAS observation
    const roas = calcROAS(totalRevenue, agg.ad_spend);
    insights.push({
      icon: roas >= 3 ? 'success' : roas >= 1.5 ? 'finding' : 'warning',
      title: `Overall ROAS is ${roas.toFixed(2)}x — ${roas >= 3 ? 'excellent' : roas >= 1.5 ? 'healthy' : 'needs improvement'}`,
      body: roas >= 3
        ? `Your campaigns are generating strong returns. Focus on scaling the best performers while maintaining efficiency.`
        : `Consider reallocating budget from low-performing channels to high-ROI ones. Test new audience segments and optimize bid strategies.`,
      tag: 'action',
    });

    // 6. MQL conversion insight
    const mqlRate = calcMQLRate(agg.mql, agg.leads);
    insights.push({
      icon: mqlRate >= 35 ? 'success' : 'action',
      title: `MQL qualification rate sits at ${fmtPercent(mqlRate)}`,
      body: mqlRate >= 35
        ? `Lead quality is strong, indicating good targeting alignment. Maintain current lead scoring thresholds and nurture sequences.`
        : `A low MQL rate suggests lead quality issues. Tighten targeting parameters, refine lead scoring criteria, and consider adding qualification questions to forms.`,
      tag: 'root-cause',
    });

    // Render
    const grid = document.getElementById('insights-grid');
    grid.innerHTML = insights.map(ins => `
      <div class="insight-card animate-in">
        <div class="insight-icon ${ins.icon}">${
          ins.icon === 'success' ? '✓' :
          ins.icon === 'warning' ? '⚠' :
          ins.icon === 'finding' ? '🔍' : '🎯'
        }</div>
        <div class="insight-content">
          <h4>${ins.title}</h4>
          <p>${ins.body}</p>
          <span class="insight-tag ${ins.tag}">${ins.tag.replace('-', ' ')}</span>
        </div>
      </div>
    `).join('');
  }
});
