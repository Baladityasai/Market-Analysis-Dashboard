// ============================================================
// data.js — Mock Campaign Data & Metric Calculation Engine
// ============================================================

const CHANNELS = ['Paid Search', 'Social', 'Email', 'Organic', 'Display'];
const REGIONS  = ['North America', 'Europe', 'Asia Pacific', 'Latin America'];
const SEGMENTS = ['Enterprise', 'Mid-Market', 'SMB', 'Startup'];

// ---- Campaigns ----
const campaigns = [
  { campaign_id: 'C001', name: 'Spring Search Blitz',       channel: 'Paid Search', start_date: '2025-01-06', end_date: '2025-03-31', budget: 45000, objective: 'Lead Generation' },
  { campaign_id: 'C002', name: 'Social Brand Awareness',    channel: 'Social',      start_date: '2025-01-13', end_date: '2025-06-30', budget: 38000, objective: 'Brand Awareness' },
  { campaign_id: 'C003', name: 'Email Nurture Series',      channel: 'Email',       start_date: '2025-02-01', end_date: '2025-04-30', budget: 12000, objective: 'Lead Nurturing' },
  { campaign_id: 'C004', name: 'Organic SEO Push',          channel: 'Organic',     start_date: '2025-01-01', end_date: '2025-09-30', budget: 22000, objective: 'Traffic Growth' },
  { campaign_id: 'C005', name: 'Display Retargeting',       channel: 'Display',     start_date: '2025-03-01', end_date: '2025-05-31', budget: 30000, objective: 'Retargeting' },
  { campaign_id: 'C006', name: 'Summer Social Promo',       channel: 'Social',      start_date: '2025-04-01', end_date: '2025-07-31', budget: 42000, objective: 'Conversions' },
  { campaign_id: 'C007', name: 'PPC Competitor Conquest',   channel: 'Paid Search', start_date: '2025-04-15', end_date: '2025-09-30', budget: 55000, objective: 'Market Share' },
  { campaign_id: 'C008', name: 'Email Win-Back Campaign',   channel: 'Email',       start_date: '2025-05-01', end_date: '2025-08-31', budget: 15000, objective: 'Re-engagement' },
];

// ---- Seed-based pseudo-random ----
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---- Generate daily metrics ----
function generateMetrics() {
  const metrics = [];
  let metricId = 1;
  const rng = seededRandom(42);

  const channelProfiles = {
    'Paid Search': { impBase: 8000,  ctrRange: [0.035, 0.065], leadRate: [0.08, 0.14], mqlRate: [0.30, 0.50], custRate: [0.15, 0.30], cpcRange: [1.8, 4.2] },
    'Social':      { impBase: 18000, ctrRange: [0.010, 0.030], leadRate: [0.03, 0.07], mqlRate: [0.20, 0.40], custRate: [0.10, 0.20], cpcRange: [0.5, 1.8] },
    'Email':       { impBase: 5000,  ctrRange: [0.040, 0.090], leadRate: [0.10, 0.20], mqlRate: [0.35, 0.55], custRate: [0.20, 0.40], cpcRange: [0.3, 0.8] },
    'Organic':     { impBase: 12000, ctrRange: [0.020, 0.045], leadRate: [0.05, 0.10], mqlRate: [0.25, 0.45], custRate: [0.12, 0.25], cpcRange: [0.0, 0.4] },
    'Display':     { impBase: 25000, ctrRange: [0.005, 0.015], leadRate: [0.02, 0.05], mqlRate: [0.15, 0.35], custRate: [0.08, 0.18], cpcRange: [0.8, 2.5] },
  };

  campaigns.forEach(camp => {
    const profile = channelProfiles[camp.channel];
    const start = new Date(camp.start_date);
    const end   = new Date(camp.end_date);
    const totalDays = Math.ceil((end - start) / 86400000);
    const dailyBudget = camp.budget / totalDays;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.65 : 1.0;
      // slight upward trend over time
      const dayIndex = Math.ceil((d - start) / 86400000);
      const trendFactor = 1 + (dayIndex / totalDays) * 0.15;

      const impressions = Math.round(profile.impBase * (0.7 + rng() * 0.6) * weekendFactor * trendFactor);
      const ctr = profile.ctrRange[0] + rng() * (profile.ctrRange[1] - profile.ctrRange[0]);
      const clicks = Math.round(impressions * ctr);
      const lr = profile.leadRate[0] + rng() * (profile.leadRate[1] - profile.leadRate[0]);
      const leads = Math.max(1, Math.round(clicks * lr));
      const mr = profile.mqlRate[0] + rng() * (profile.mqlRate[1] - profile.mqlRate[0]);
      const mql = Math.max(0, Math.round(leads * mr));
      const cr = profile.custRate[0] + rng() * (profile.custRate[1] - profile.custRate[0]);
      const customers_acquired = Math.max(0, Math.round(mql * cr));
      const cpc = profile.cpcRange[0] + rng() * (profile.cpcRange[1] - profile.cpcRange[0]);
      const ad_spend = Math.round(clicks * cpc * 100) / 100;

      metrics.push({
        metric_id: metricId++,
        campaign_id: camp.campaign_id,
        date: d.toISOString().slice(0, 10),
        impressions,
        clicks,
        leads,
        mql,
        customers_acquired,
        ad_spend: Math.min(ad_spend, dailyBudget * 1.3),
      });
    }
  });
  return metrics;
}

const campaignMetrics = generateMetrics();

// ---- Generate customers ----
function generateCustomers() {
  const custs = [];
  let custId = 1;
  const rng = seededRandom(99);
  campaignMetrics.forEach(m => {
    for (let i = 0; i < m.customers_acquired; i++) {
      custs.push({
        customer_id: `CU${String(custId++).padStart(5, '0')}`,
        campaign_id: m.campaign_id,
        acquisition_date: m.date,
        segment: SEGMENTS[Math.floor(rng() * SEGMENTS.length)],
        region:  REGIONS[Math.floor(rng() * REGIONS.length)],
        ltv: Math.round((800 + rng() * 4200) * 100) / 100,
      });
    }
  });
  return custs;
}

const customers = generateCustomers();

// ============================================================
// Metric Calculations
// ============================================================

const calcCTR      = (clicks, impressions) => impressions ? (clicks / impressions * 100) : 0;
const calcCVR      = (customers, clicks)   => clicks ? (customers / clicks * 100) : 0;
const calcCPL      = (spend, leads)        => leads ? spend / leads : 0;
const calcROAS     = (revenue, spend)      => spend ? revenue / spend : 0;
const calcROI      = (revenue, spend)      => spend ? ((revenue - spend) / spend * 100) : 0;
const calcMQLRate  = (mql, leads)          => leads ? (mql / leads * 100) : 0;

// ============================================================
// Aggregation helpers
// ============================================================

function filterMetrics({ channelFilter = 'All', startDate = null, endDate = null } = {}) {
  const campIds = channelFilter === 'All'
    ? campaigns.map(c => c.campaign_id)
    : campaigns.filter(c => c.channel === channelFilter).map(c => c.campaign_id);

  return campaignMetrics.filter(m => {
    if (!campIds.includes(m.campaign_id)) return false;
    if (startDate && m.date < startDate) return false;
    if (endDate && m.date > endDate) return false;
    return true;
  });
}

function aggregateMetrics(metricsList) {
  const agg = { impressions: 0, clicks: 0, leads: 0, mql: 0, customers_acquired: 0, ad_spend: 0 };
  metricsList.forEach(m => {
    agg.impressions += m.impressions;
    agg.clicks += m.clicks;
    agg.leads += m.leads;
    agg.mql += m.mql;
    agg.customers_acquired += m.customers_acquired;
    agg.ad_spend += m.ad_spend;
  });
  return agg;
}

function getRevenueForCampaign(campaignId) {
  return customers
    .filter(c => c.campaign_id === campaignId)
    .reduce((sum, c) => sum + c.ltv, 0);
}

function getTotalRevenue(filters) {
  const filtered = filterMetrics(filters);
  const campIds = [...new Set(filtered.map(m => m.campaign_id))];
  return campIds.reduce((sum, id) => sum + getRevenueForCampaign(id), 0);
}

function aggregateByChannel(filters = {}) {
  const result = {};
  CHANNELS.forEach(ch => {
    const chFilters = { ...filters, channelFilter: ch };
    const met = filterMetrics(chFilters);
    if (met.length === 0) return;
    const agg = aggregateMetrics(met);
    const campIds = [...new Set(met.map(m => m.campaign_id))];
    const revenue = campIds.reduce((s, id) => s + getRevenueForCampaign(id), 0);
    result[ch] = { ...agg, revenue };
  });
  return result;
}

function aggregateByWeek(filters = {}) {
  const met = filterMetrics(filters);
  const weeks = {};
  met.forEach(m => {
    const d = new Date(m.date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { impressions: 0, clicks: 0, leads: 0, mql: 0, customers_acquired: 0, ad_spend: 0 };
    weeks[key].impressions += m.impressions;
    weeks[key].clicks += m.clicks;
    weeks[key].leads += m.leads;
    weeks[key].mql += m.mql;
    weeks[key].customers_acquired += m.customers_acquired;
    weeks[key].ad_spend += m.ad_spend;
  });
  return Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0])).map(([week, data]) => ({ week, ...data }));
}

function aggregateByCampaign(filters = {}) {
  const met = filterMetrics(filters);
  const result = {};
  met.forEach(m => {
    if (!result[m.campaign_id]) result[m.campaign_id] = { impressions: 0, clicks: 0, leads: 0, mql: 0, customers_acquired: 0, ad_spend: 0 };
    result[m.campaign_id].impressions += m.impressions;
    result[m.campaign_id].clicks += m.clicks;
    result[m.campaign_id].leads += m.leads;
    result[m.campaign_id].mql += m.mql;
    result[m.campaign_id].customers_acquired += m.customers_acquired;
    result[m.campaign_id].ad_spend += m.ad_spend;
  });
  return result;
}

// ============================================================
// Formatting helpers
// ============================================================

function fmtNumber(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function fmtCurrency(n) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

function fmtPercent(n) {
  return n.toFixed(1) + '%';
}
