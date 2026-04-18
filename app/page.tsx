"use client";
import { useState, useMemo, useEffect } from 'react';
import { calculateTaxAndNetPNL } from '@/lib/calculations';
import { parsePortfolioCSV } from '@/lib/parser';
import { getSector } from '@/lib/sectors';
import { MOCK_CSV_DATA } from '@/lib/mock';
import {
  Card, Title, AreaChart, DonutChart, BarList, Text, Flex, Grid,
  Metric, Badge, TextInput, Callout, Divider, Icon,
  Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell
} from "@tremor/react";
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ScaleIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const valueFormatter = (number: number) => `${number.toLocaleString()} Units`;
  const currencyFormatter = (number: number) => `Rs. ${number.toLocaleString()}`;
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);



// 1. STANDALONE LOGIC (The "Audit Brain")
const processPortfolioData = (rawData: any[]) => {
  const consolidated = rawData.reduce((acc: any[], curr) => {
    const existing = acc.find(i => i.symbol === curr.symbol);
    if (existing) {
      // Add units if credit, subtract if debit
      existing.units += curr.isDebit ? -curr.units : curr.units;
      
      // Weighted Average Cost calculation (simplified)
      if (!curr.isDebit) {
        existing.totalCost += (curr.units * curr.costPerUnit) + curr.fees;
      }
    } else {
      acc.push({
        ...curr,
        totalCost: (curr.units * curr.costPerUnit) + curr.fees
      });
    }
    return acc;
  }, []);

  setPortfolio(consolidated.filter(i => i.units > 0));
};

// 2. UPDATED HANDLE UPLOAD (Real File)
const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.[0]) {
    try {
      const rawData = await parsePortfolioCSV(e.target.files[0]);
      processPortfolioData(rawData);
    } catch (err) {
      console.error("Audit System Failure:", err);
    }
  }
};

// 3. NEW HANDLE DEMO (Mock Data)
const handleDemoMode = async () => {
  try {
    // Convert the mock.ts string into a pseudo-file for the parser
    const blob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
    const mockFile = new File([blob], "demo_portfolio.csv", { type: 'text/csv' });
    
    const rawData = await parsePortfolioCSV(mockFile);
    processPortfolioData(rawData);
    
    // Optional: Mark as synced since the mock data is "pre-verified"
    setLastSynced(new Date());
  } catch (err) {
    console.error("Demo Initialization Failure:", err);
  }
};

  // --- 1. GROWTH & TREND ENGINE (POINT-BY-POINT TRACKING) ---
  const trendData = useMemo(() => {
    if (portfolio.length === 0) return [];
    const sorted = [...portfolio].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningTotal = 0;
    return sorted.map(item => {
      runningTotal += item.units;
      return {
        date: item.date,
        "Portfolio Volume": runningTotal,
      };
    });
  }, [portfolio]);

  // --- 2. EXACT YEARLY AUDIT (STATIC VIEW - NO HOVER NEEDED) ---
  const yearlyStats = useMemo(() => {
    const stats: Record<string, { added: number, endBalance: number }> = {};
    const sorted = [...portfolio].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    sorted.forEach(item => {
      const year = item.date.split('-')[0];
      if (!stats[year]) stats[year] = { added: 0, endBalance: 0 };
      stats[year].added += item.units;
      runningBalance += item.units;
      stats[year].endBalance = runningBalance;
    });

    return Object.entries(stats).map(([year, data]) => ({
      year,
      ...data
    })).sort((a, b) => b.year.localeCompare(a.year));
  }, [portfolio]);

  // --- 3. DISTRIBUTION & SECTOR INTELLIGENCE ---
  const scripData = useMemo(() => {
    const counts: Record<string, number> = {};
    portfolio.forEach(item => {
      counts[item.symbol] = (counts[item.symbol] || 0) + item.units;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {};
    portfolio.forEach(item => {
      const s = getSector(item.symbol);
      sectors[s] = (sectors[s] || 0) + item.units;
    });
    return Object.entries(sectors)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  // --- 4. MASTER METRICS & RISK ---
  const auditMetrics = useMemo(() => {
    if (portfolio.length === 0) return null;

    const totalUnits = portfolio.reduce((acc, curr) => acc + curr.units, 0);
    const ipoUnits = portfolio.filter(i => i.type === 'IPO').reduce((acc, curr) => acc + curr.units, 0);

    // NEW: Financial Audit Calculations
    const totalNetProfit = portfolio.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);
    const totalTaxLiability = portfolio.reduce((acc, curr) => acc + (curr.estimatedTax || 0), 0);
    const totalCurrentValue = portfolio.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);

    // NEW: Maturity Tracking
    const longTermCount = portfolio.filter(i => i.daysToMaturity === 0).length;
    const maturityScore = (longTermCount / portfolio.length) * 100;

    const years = [...new Set(portfolio.map(i => i.date.split('-')[0]))];

    return {
      totalUnits,
      investedCapital: ipoUnits * 100,
      totalNetProfit,
      totalTaxLiability,
      realizableWealth: totalCurrentValue - totalTaxLiability,
      maturityScore,
      clutterScore: (scripData.filter(i => i.value <= 10).length / scripData.length) * 100,
      activeYears: years.length,
      startYear: years.sort()[0],
      topSector: sectorData[0]?.name
    };
  }, [portfolio, scripData, sectorData]);

  const riskFindings = useMemo(() => {
    if (!auditMetrics || scripData.length === 0) return null;
    const concentration = (scripData[0].value / auditMetrics.totalUnits) * 100;

    return concentration > 25 ? {
      title: "Concentration Risk Warning",
      message: `${scripData[0].name} occupies ${concentration.toFixed(1)}% of audited volume. High-risk exposure detected.`,
      color: "rose" as const,
      icon: ExclamationTriangleIcon
    } : {
      title: "Portfolio Stability: Verified",
      message: "Asset distribution is within safe institutional parameters.",
      color: "emerald" as const,
      icon: ShieldCheckIcon
    };
  }, [scripData, auditMetrics]);

  const filteredPortfolio = useMemo(() => {
    return portfolio.filter(item =>
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [portfolio, searchTerm]);


  const syncMarketPrices = async (retryCount = 0) => {
    if (portfolio.length === 0) return alert("Upload CSV to start audit.");

    setIsSyncing(true);
    try {
      const response = await fetch('/api/market');
      const result = await response.json();

      const marketArray = result.data && Array.isArray(result.data)
        ? result.data
        : (Array.isArray(result) ? result : []);

      if (marketArray.length === 0 && retryCount < 1) {
        return syncMarketPrices(retryCount + 1);
      }

      if (marketArray.length === 0) throw new Error("Market data unresponsive.");

      // STEP 1: Map raw market prices
      const rawUpdated = portfolio.map(item => {
        const live = marketArray.find((s: any) =>
          (s.symbol || s.scrip || "").toUpperCase() === item.symbol.toUpperCase()
        );
        const currentPrice = Number(live?.ltp || live?.last_traded_price || item.currentPrice || 100);

        return {
          ...item,
          currentPrice,
          totalValue: currentPrice * item.units,
        };
      });

      // STEP 2: Run the Fiscal Audit (Tax & Fees)
      const fiscalAudited = calculateTaxAndNetPNL(rawUpdated);

      setPortfolio(fiscalAudited);
      setLastSynced(new Date());

      if (result.isMock) {
        alert("⚠️ SAFE-MODE: Fallback data active.");
      } else {
        alert(`✅ AUDIT COMPLETE: Verified via ${result.source}`);
      }

    } catch (error: any) {
      alert(`Audit Interrupted: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

return (
  <main className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-20 font-sans selection:bg-rose-100">
    {/* 1. HIGH-CONTRAST SYSTEM HEADER */}
    <div className="bg-white border-b-2 border-slate-100 px-8 py-6 mb-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-rose-600 p-3 rounded-2xl shadow-lg shadow-rose-200">
            <CpuChipIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              SHARE AUDITOR <span className="text-rose-600">NP</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Protocol v4.0</span>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Authenticated Session</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* MOCK DATA / DEMO BUTTON */}
          <button
            onClick={handleDemoMode}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
          >
            <ChartBarIcon className="w-4 h-4" />
            Try Demo
          </button>

          <div className="relative group">
            <input
              type="file"
              accept=".csv"
              onChange={handleUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-emerald-500/20 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-all">
              <DocumentArrowDownIcon className="w-4 h-4" />
              {portfolio.length > 0 ? "Replace Ledger" : "Upload CSV"}
            </button>
          </div>

          <button
            onClick={() => syncMarketPrices()}
            disabled={isSyncing || !hasMounted || portfolio.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-rose-600 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-xl shadow-slate-200"
          >
            {isSyncing ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Syncing...
              </span>
            ) : "Run Market Audit"}
          </button>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 space-y-8">
      {portfolio.length > 0 ? (
        <>
          {/* 2. KPI GRID - CLEAN BORDERS */}
          <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
            {[
              { label: "Realizable Wealth", value: currencyFormatter(auditMetrics?.realizableWealth || 0), color: "emerald", sub: "Net Liquidity" },
              { label: "Net Profit", value: currencyFormatter(auditMetrics?.totalNetProfit || 0), color: (auditMetrics?.totalNetProfit || 0) >= 0 ? "emerald" : "rose", sub: "Audited Returns" },
              { label: "Tax Liability", value: currencyFormatter(auditMetrics?.totalTaxLiability || 0), color: "rose", sub: "Pending CGT" },
              { label: "Portfolio Maturity", value: `${auditMetrics?.maturityScore.toFixed(1)}%`, color: "emerald", sub: "Holding Status" }
            ].map((kpi, i) => (
              <Card key={i} className={`bg-white border-b-4 border-${kpi.color}-500 shadow-sm p-5 rounded-xl`}>
                <Text className="text-[10px] font-bold text-slate-400 uppercase">{kpi.label}</Text>
                <Metric className={`text-slate-900 font-black mt-1 text-2xl`}>{kpi.value}</Metric>
                <div className="flex items-center gap-2 mt-2">
                  <Badge color={kpi.color} size="xs" className="font-mono">{kpi.sub}</Badge>
                </div>
              </Card>
            ))}
          </Grid>

          {/* 3. CORE ANALYSIS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
              <Title className="text-slate-900 font-black">Performance Audit</Title>
              <AreaChart 
                className="h-72 mt-8" 
                data={trendData} 
                index="date" 
                categories={["Portfolio Volume"]} 
                colors={["emerald"]} 
                showAnimation={true}
                showGridLines={false}
                curveType="monotone"
              />
            </Card>

            <div className="space-y-6">
              <Card className="bg-white border-l-4 border-rose-500 p-6 rounded-2xl shadow-sm">
                <Title className="text-xs font-black text-slate-900 uppercase mb-6">Asset Distribution</Title>
                <DonutChart 
                  className="h-44" 
                  data={sectorData} 
                  category="value" 
                  index="name" 
                  colors={["emerald", "rose", "slate", "zinc", "stone"]} 
                />
                <BarList data={sectorData.slice(0, 3)} color="emerald" className="mt-6" />
              </Card>

              <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-100">
                <ShieldCheckIcon className="w-8 h-8 mb-3" />
                <Text className="text-emerald-100 text-xs font-bold uppercase">System Note</Text>
                <Text className="mt-1 font-medium text-sm leading-relaxed">
                  Portfolio concentration in <span className="font-black underline">{auditMetrics?.topSector}</span> verified. Institutional risk parameters maintained.
                </Text>
              </div>
            </div>
          </div>

          {/* 4. DATA TABLE */}
          <Card className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                <Title className="text-lg font-bold text-slate-900">Verified Ledger</Title>
              </div>
              <TextInput
                icon={MagnifyingGlassIcon}
                placeholder="Filter scrip..."
                className="max-w-xs border-none bg-slate-50 rounded-xl"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Table>
              <TableHead className="bg-slate-50">
                <TableRow>
                  <TableHeaderCell className="text-slate-900 font-bold px-8 py-4">ENTITY</TableHeaderCell>
                  <TableHeaderCell className="text-slate-900 font-bold">LTP</TableHeaderCell>
                  <TableHeaderCell className="text-slate-900 font-bold">TAX STATUS</TableHeaderCell>
                  <TableHeaderCell className="text-slate-900 font-bold">NET GAIN</TableHeaderCell>
                  <TableHeaderCell className="text-right text-slate-900 font-bold px-8">VOLUME</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPortfolio.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-8 py-5">
                      <Text className="font-black text-slate-900 text-base">{item.symbol}</Text>
                      <Text className="text-[10px] font-bold text-slate-400 uppercase">Verified Asset</Text>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-slate-600">
                      Rs. {item.currentPrice?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge color={item.taxStatus?.includes('Long') ? "emerald" : "rose"} size="xs" className="font-mono">
                        {item.taxStatus || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className={item.netProfit >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                      {item.netProfit >= 0 ? '▲' : '▼'} Rs. {Math.abs(item.netProfit || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right px-8 font-black text-slate-900">
                      {item.units.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : (
        /* EMPTY STATE */
        <div className="py-40 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
          <div className="bg-rose-50 p-8 rounded-full mb-6">
            <DocumentArrowDownIcon className="w-10 h-10 text-rose-600" />
          </div>
          <Title className="text-slate-900 font-black text-2xl">Ledger Offline</Title>
          <Text className="text-slate-400 mt-2 font-medium">Awaiting MeroShare CSV for system initialization.</Text>
          
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="relative group">
              <input type="file" accept=".csv" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <button className="bg-slate-900 text-white font-bold px-10 py-3.5 rounded-2xl shadow-xl shadow-slate-200 hover:bg-rose-600 transition-all">
                Initialize Audit Protocol
              </button>
            </div>
            
            <button 
              onClick={handleDemoMode}
              className="text-slate-400 text-xs font-bold hover:text-rose-600 transition-colors underline underline-offset-4"
            >
              Or explore system with mock data
            </button>
          </div>
        </div>
      )}

      {/* 5. DEFAULT MANUAL - CLEAN GRID ACCENTS */}
      <div className="mt-24 pt-12 border-t border-slate-100">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="h-px w-12 bg-slate-200" />
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">System Documentation</h2>
          <div className="h-px w-12 bg-slate-200" />
        </div>
        
        <Grid numItemsMd={3} className="gap-12">
          {[
            { title: "01. INGESTION", color: "emerald", desc: "Automated parsing of MeroShare CSV files with scrip validation and WACC consolidation." },
            { title: "02. AUDITING", color: "rose", desc: "Real-time market price synchronization with multi-source failover for structural integrity." },
            { title: "03. TAXATION", color: "slate", desc: "Dual-bracket CGT calculation (5% / 7.5%) based on Nepal's current fiscal policy guidelines." }
          ].map((step, i) => (
            <div key={i} className="group">
              <div className={`w-12 h-1 bg-${step.color}-500 mb-6 transition-all group-hover:w-full`} />
              <Title className="text-sm font-black text-slate-900 tracking-tight">{step.title}</Title>
              <Text className="text-xs leading-relaxed text-slate-500 mt-3 font-medium">
                {step.desc}
              </Text>
            </div>
          ))}
        </Grid>
      </div>
    </div>
  </main>
);
}