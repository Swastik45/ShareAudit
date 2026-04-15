# Share Auditor NP 🇳🇵 [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org) [![Tailwind](https://img.shields.io/badge/Tailwind-4-3b82f6?logo=tailwindcss)](https://tailwindcss.com)

![Dashboard Screenshot](https://via.placeholder.com/1200x600/1e293b/ffffff?text=Share+Auditor+Dashboard+%F0%9F%9A%A8) *(Upload real screenshot here)*

**Institutional-Grade NEPSE Portfolio Auditor & Risk Engine**

Transform your MeroShare CSV transaction history into actionable insights: live prices via self-healing scraper, Nepal CGT tax forecasts, sector exposure, concentration risk alerts, and growth trajectory—all in a stunning Tremor-powered dashboard.

> **For Nepalese retail investors** • **Production-Ready** • **Fail-Safe Architecture**  
> **BCA Portfolio Project** by [Swastik Paudel](https://github.com/Swastik45)

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![pnpm](https://img.shields.io/badge/Manager-pnpm-brightgreen.svg)](https://pnpm.io/)

## ✨ Features

| Feature | Description |
|---------|-------------|
| **📊 Self-Healing Market Sync** | Cheerio scraper (Sharesansar) → API fallback → Safe-mode mock. Resilient to site changes/outages. |
| **💰 Fiscal Engine** | Broker fees (tiered 0.24-0.36%), CGT tax (5% >365d, 7.5% short-term), net PnL after tax/fees. |
| **🎯 Risk Audits** | Concentration (>25% flag), clutter score (dust holdings), sector exposure (Hydropower/Banking/etc.). |
| **📈 Interactive Visuals** | Area growth chart, donut sectors, bar scrips, KPI grid (Tremor v3). |
| **🔍 CSV Parser** | Handles IPO/Bonus/Right/Secondary—weighted avg cost, consolidated holdings. |
| **⚡ SSR-Optimized** | Next.js 16 App Router, hydration guards, Tailwind 4 glassmorphism UI. |

<details>
<summary>🛠️ Live Demo Tech Stack</summary>

```bash
Next.js 16 (App Router) | React 19 | TypeScript 5
Tailwind CSS 4 | Tremor 3 | Cheerio 1.0 | PapaParse 5
```
</details>

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- [pnpm](https://pnpm.io/installation)

```bash
# Clone & Install
git clone https://github.com/Swastik45/share-auditor.git  # Or your repo
cd share-auditor
pnpm install

# Run Dev Server
pnpm dev

# Open http://localhost:3000
# Upload MeroShare CSV → Sync Market → Audit Complete!
```

**Production Build:**
```bash
pnpm build
pnpm start
```

## 🏗️ Architecture

```mermaid
graph TD
    A[MeroShare CSV] --> B[lib/parser.ts<br/>PapaParse + Fee Calc]
    B --> C[lib/sectors.ts<br/>300+ NEPSE Scrips]
    C --> D[app/page.tsx<br/>Tremor Dashboard]
    E[/api/market<br/>Cheerio Scraper] --> D
    F[Community API] --> E
    G[Safe-Mode Mock] --> E
    style E fill:#10b981
```

**Key Modules:**
- `lib/calculations.ts`: Tax logic, aggregations.
- `app/api/market/route.ts`: Dynamic LTP extraction.
- `lib/types.ts`: Full type safety.

## 📱 Screenshots

| Dashboard Overview | Risk Ledger | Sector Exposure |
|--------------------|-------------|-----------------|
| ![Overview](https://via.placeholder.com/400x250/1e40af/ffffff?text=Dashboard) | ![Ledger](https://via.placeholder.com/400x250/059669/ffffff?text=Verified+Ledger) | ![Sectors](https://via.placeholder.com/400x250/06b6d4/ffffff?text=Sector+Donut) |

*(Replace placeholders with actual screenshots)*

## 🔬 Self-Healing Pipeline

1. **Primary:** Parse Sharesansar HTML headers dynamically (`thead th` → LTP/Symbol indices).
2. **Fallback:** `nepse-data-api.herokuapp.com` (4s timeout).
3. **Safe-Mode:** Hardcoded LTPs for weekends/outages.
4. **Circuit Breaker:** Auto-retry + console audit logs.

## 🧪 Local Development

```bash
# Lint & Type Check
pnpm lint

# Add CSV sample to public/
# Test scraper: curl http://localhost:3000/api/market
```

**Env Vars:** None (stateless).

## 🚀 Roadmap

- [ ] PDF Export (audited reports)
- [ ] Real-time alerts (concentration thresholds)
- [ ] WalletConnect NEPSE API integration
- [ ] Mobile PWA
- [ ] VSCode Extension (CSV preview)

## 🤝 Contributing

1. Fork → Branch (`feat/xyz`)
2. `pnpm install && pnpm dev`
3. PR to `main` with tests.

Issues? [Open one](https://github.com/Swastik45/share-auditor/issues/new).

## 📄 License

MIT © [Swastik Paudel](https://github.com/Swastik45)  
**Pokhara, Nepal 🇳🇵** • **April 2026**

