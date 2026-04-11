

-----

# Share Auditor NP 🇳🇵

**An Institutional-Grade Portfolio Risk & Growth Engine**

[](https://nextjs.org/)
[](https://www.typescriptlang.org/)
[](https://tremor.so)
[](https://opensource.org/licenses/MIT)

**Share Auditor NP** is a high-performance, client-side web application designed to audit MeroShare transaction histories. It transforms raw CSV data into a comprehensive risk-assessment dashboard, providing Nepalese retail investors with institutional-level insights into their diversification, growth trends, and sector exposure.

-----

## 🚀 Core Features

### 1\. **Growth Engine & Trend Analysis**

  * **Area Growth Visualization:** Tracks cumulative portfolio volume over time.
  * **Yearly Growth Audit:** A "No-Hover" data panel providing exact closing balances and annual additions for every year of investment.

### 2\. **Structural Risk Intelligence**

  * **Asset Concentration:** Automatically flags "Concentration Risk" if a single scrip occupies more than 25% of the total volume.
  * **Clutter Score:** Measures portfolio fragmentation by identifying "dust" holdings (scrips with \< 10 units).
  * **Industry Exposure:** Real-time sector mapping (Banking, Hydropower, Insurance, etc.) to detect sector-level dependency.

### 3\. **Market-Sync Automation (New)**

  * **Live Price Auditing:** Integrates with public NEPSE data sources via a custom server-side proxy to fetch real-time LTP (Last Traded Price).
  * **Unrealized P/L Tracking:** Automatically calculates profit/loss by merging historical cost basis with live market valuations.
  * **Audit Timestamps:** Features a "Last Synced" verification system to ensure data freshness.

### 4\. **Privacy-First Architecture**

  * **Zero-Footprint:** Personal financial data is processed entirely in the browser's RAM.
  * **Server-Side Proxying:** API requests are routed through a secure internal `/api/market` endpoint to bypass CORS and mask external data fetching.

-----

## 🛠️ Technical Stack

  * **Framework:** [Next.js 15](https://nextjs.org/) (App Router & Route Handlers)
  * **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Type Safety)
  * **UI Components:** [Tremor](https://www.tremor.so/) (Low-level financial dashboard components)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  * **Data Handling:** Client-side CSV Stream Parsing + Server-side API Proxying.

-----

## 📂 Project Structure

```text
├── app/
│   ├── api/market/route.ts  # Server-side Proxy to bypass CORS for NEPSE data
│   └── page.tsx             # Main Dashboard, Live Sync Logic & UI
├── lib/
│   ├── parser.ts            # CSV parsing and data normalization
│   └── sectors.ts           # NEPSE Scrip-to-Sector mapping engine
├── public/                  # Static assets
└── tailwind.config.ts       # Custom branding and Tremor integration
```

-----

## 📦 Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Swastik45/share-auditor-np.git
    cd share-auditor-np
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

4.  **Perform an Audit:**
    Upload your **Transaction History** CSV from MeroShare and click **"Sync Live Analysis"** (Available during market hours: Mon-Fri, 11 AM - 3 PM).

-----

## 🛡️ Auditor Protocol Note

> This project is developed as part of a **BCA (Bachelor of Computer Applications)** portfolio. It prioritizes **Logical Verification** and **Systems Auditing** over social narratives. The goal is to provide a "Systems Architect" view of financial health.

**Developed by:** [Swastik Paudel](https://www.google.com/search?q=https://github.com/Swastik45)  
**Location:** Pokhara, Nepal 🇳🇵  
**License:** MIT

-----
