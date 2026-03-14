# Marketing Campaign Analytics Dashboard

A visually stunning, single-page web dashboard designed for marketing analysts and managers to extract actionable insights from campaign data. Built with a modern dark glassmorphism aesthetic, it requires no installation or build steps — simply open it in your browser.

## Features

- **Real-Time KPI Cards:** Instant visibility into Total Ad Spend, Total Revenue, Avg. CTR, Avg. CVR, Avg. CPL, and ROAS with animated count-ups and period-over-period change indicators.
- **Interactive Visualizations (Chart.js):**
  - **Channel Performance (Grouped Bar):** Compares impressions, clicks, and customers acquired across channels.
  - **Spend vs Revenue Trend (Dual-Axis Line):** Tracks weekly ad spend against estimated revenue.
  - **Budget Distribution (Doughnut):** Shows how the marketing budget is allocated.
  - **Weekly Trends (Line):** Displays click-through and conversion trends week over week.
  - **Campaign Comparison Radar:** Overlays multi-KPI performance for the top campaigns.
  - **ROI by Campaign (Horizontal Bar):** Ranks individual campaign profitability.
- **Conversion Funnel Analytics:** Tracks users through every stage (Impressions → Clicks → Leads → MQLs → Customers) and automatically calculates drop-off/conversion rates between stages.
- **Campaign Scorecard (Data Table):** A fully sortable table summarizing all active campaigns, including dynamic status indicators (▲/▼/→).
- **AI-Generated Insights Engine:** Automatically scans the underlying data to surface anomalies and strategic recommendations in a clear "Observation → Root Cause → Action" format.
- **Dynamic Filtering:** Filter the entire dashboard dynamically by Marketing Channel and Date Range.

## Technology Stack

- **Core:** Vanilla HTML5, CSS3, JavaScript (ES6+). No heavy frameworks.
- **Visuals:** [Chart.js 4](https://www.chartjs.org/) (via CDN) for highly customizable, responsive data visualizations.
- **Styling:** Custom CSS featuring a dark theme, CSS Custom Properties (Variables), CSS Grid/Flexbox, `backdrop-filter` for glassmorphism effects, and Google Fonts (`Inter`).
- **Data:** Powered by a locally generated, mathematically consistent mock dataset (`data.js`) modeling 8 distinct campaigns across 5 channels over 3 quarters.

## Getting Started

Because this is a static client-side application, getting started is incredibly simple:

1. **Clone or Download** the repository to your local machine.
2. **Open `index.html`** in any modern web browser (Chrome, Firefox, Edge, Safari).
   - *Alternatively, you can serve it via a local web server (e.g., `npx http-server .` or the VS Code Live Server extension).*

No `npm install` or build processes are required.

## File Architecture

- `index.html`: The structural markup, layout framework, and entry point.
- `index.css`: The comprehensive design system, including dark theme variables, glassmorphism utilities, animations, and responsive breakpoints.
- `data.js`: The mock data generation engine. Contains the campaign definitions, seeded pseudo-random daily metrics generation, customer LTVs, and all the mathematical aggregation/filtering functions.
- `charts.js`: The Chart.js wrapper. Manages the global chart theming and individual render/destroy functions for all 6 chart canvases.
- `dashboard.js`: The main application orchestrator. Hooks up the DOM elements, wires event listeners to the filters, coordinates the rendering sequence, populates the dynamic funnel/table, and generates the AI insight text based on the aggregated data.
