
-----

# Share Auditor NP 🇳🇵

**An Institutional-Grade Portfolio Risk & Resiliency Engine**

[](https://nextjs.org/)
[](https://www.typescriptlang.org/)
[](https://tailwindcss.com/)
[](https://opensource.org/licenses/MIT)

**Share Auditor NP** is a high-performance web application designed to audit MeroShare transaction histories. It transforms raw CSV data into a sophisticated risk-assessment dashboard, utilizing a **self-healing data pipeline** to ensure Nepalese retail investors have constant access to market insights, even when primary data sources are unstable.

-----

## 🚀 Advanced Features

### 1\. **Dynamic Market Intelligence (New)**

  * **Self-Healing Scraper:** Built a robust data extraction engine using `Cheerio` that dynamically interrogates external HTML structures to locate "LTP" and "Symbol" indices, ensuring resilience against site layout changes.
  * **Multi-Source Waterfall:** Implemented a priority-based data fetcher:
    1.  **Primary:** Live Scraper (ShareSansar).
    2.  **Secondary:** Community API Fallback.
    3.  **Tertiary:** "Safe-Mode" Mock Data (Circuit Breaker).

### 2\. **Structural Risk Audit**

  * **Asset Concentration:** Automatically flags "Concentration Risk" if a single scrip occupies a disproportionate slice of the total volume.
  * **Clutter Score:** Measures portfolio fragmentation by identifying "dust" holdings (scrips with \< 10 units).
  * **Industry Exposure:** Real-time sector mapping (Banking, Hydropower, Insurance, etc.) to detect sector-level dependency.

### 3\. **High-Fidelity Visualization**

  * **Growth Trajectory:** Interactive Area Charts tracking cumulative portfolio volume over time.
  * **Institutional Ledger:** A refined, glassmorphism-inspired data table featuring live profit/loss indicators and color-coded trend bars.

-----

## 🛠️ Technical Architecture

  * **Framework:** [Next.js 15](https://nextjs.org/) (App Router & Route Handlers)
  * **Backend:** Node.js Serverless Functions for secure web scraping and CORS bypassing.
  * **State Management:** React Hooks (`useState`, `useEffect`) with **Hydration Guard** logic for SSR stability.
  * **UI Components:** [Tremor](https://www.tremor.so/) & [Tailwind CSS](https://tailwindcss.com/).
  * **Scraping Engine:** `Cheerio` for semantic HTML parsing.

-----

## 📂 System Map

```text
├── app/
│   ├── api/market/route.ts  # Self-healing scraper & Circuit Breaker logic
│   └── page.tsx             # Dashboard UI, Sync state & Hydration guards
├── lib/
│   ├── parser.ts            # CSV normalization logic
│   └── sectors.ts           # NEPSE Scrip-to-Sector mapping engine
├── tailwind.config.ts       # Custom branding & financial UI configuration
└── public/                  # Static assets & Audit icons
```

-----

## 🛡️ Auditor's Philosophy

> This project is a **BCA (Bachelor of Computer Applications)** portfolio piece. It prioritizes **Systems Auditing** and **Fail-Safe Architecture** over simple data display. The goal is to demonstrate how software can maintain utility through "Safe-Mode" degradation even during external system failures.

**Developed by:** [Swastik Paudel](https://www.google.com/search?q=https://github.com/Swastik45)  
**Location:** Pokhara, Nepal 🇳🇵  
**License:** MIT

