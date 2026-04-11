

-----

# Share Auditor NP 🇳🇵

**An Institutional-Grade Portfolio Risk & Growth Engine**

[](https://www.google.com/search?q=https://github.com/swastikpaudel)
[](https://tremor.so)
[](https://github.com)

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

### 3\. **The Audit Ledger**

  * **Instant Search:** High-speed filtering of transaction points.
  * **Historical Mapping:** Includes sector logic for merged companies (e.g., ULI, RLI, SPARS) to ensure historical accuracy.

### 4\. **Privacy-First Architecture**

  * **Zero-Footprint:** Financial data is processed entirely in the browser's RAM.
  * **No Database Required:** No sensitive data is ever sent to a server or stored in a persistent database, ensuring total user anonymity.

-----

## 🛠️ Technical Stack

  * **Framework:** [Next.js 14+](https://nextjs.org/) (App Router)
  * **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Type Safety)
  * **UI Components:** [Tremor](https://www.tremor.so/) (Low-level dashboard components)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  * **Icons:** [HeroIcons](https://heroicons.com/)
  * **Logic:** Custom CSV Parsing Engine with NEPSE Sector Mapping.

-----

## 📦 Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/swastikpaudel/share-auditor-np.git
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

4.  **Prepare your Data:**
    Export your **Transaction History** from MeroShare as a CSV file and upload it via the dashboard.

-----

## 📂 Project Structure

```text
├── app/
│   └── page.tsx          # Main Dashboard & UI Logic
├── lib/
│   ├── parser.ts         # CSV parsing and data normalization
│   └── sectors.ts        # NEPSE Scrip-to-Sector mapping engine
├── public/               # Static assets
└── tailwind.config.ts    # Custom branding and Tremor integration
```

-----

## 🛡️ Auditor Protocol Note

> This project is developed as part of a **BCA (Bachelor of Computer Applications)** portfolio. It prioritizes **Logical Verification** and **Systems Auditing** over social narratives. The goal is to provide a "Systems Architect" view of financial health.

**Developed by:** [Swastik Paudel](https://www.google.com/search?q=https://github.com/swastikpaudel)  
**Location:** Pokhara, Nepal 🇳🇵  
**License:** MIT

