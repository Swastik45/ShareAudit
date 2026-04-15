"use client";
import { useState, useMemo, useEffect } from 'react';
import { calculateTaxAndNetPNL } from '@/lib/calculations';
import { parsePortfolioCSV } from '@/lib/parser';
import { getSector } from '@/lib/sectors';
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

 const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.[0]) {
    try {
      const rawData = await parsePortfolioCSV(e.target.files[0]);
      
      // GROUP BY SYMBOL: Merge multiple history entries into one holding
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
    } catch (err) {
      console.error("Audit System Failure:", err);
    }
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
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans selection:bg-indigo-100">
      {/* 1. ULTRA-MODERN HEADER */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <CpuChipIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                SHARE AUDITOR <span className="text-indigo-600 italic">NP</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BCA Protocol v4.0</span>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-indigo-500 uppercase">{auditMetrics?.totalUnits.toLocaleString() || 0} Units Verified</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Subtle CSV Upload */}
            <div className="relative group">
              <input
                type="file"
                accept=".csv"
                onChange={handleUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all">
                <DocumentArrowDownIcon className="w-4 h-4" />
                {portfolio.length > 0 ? "Update Source" : "Import CSV"}
              </button>
            </div>

            <button
              onClick={() => syncMarketPrices()}
              disabled={isSyncing || !hasMounted || portfolio.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-slate-200"
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

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {portfolio.length > 0 ? (
          <>
            {/* 2. KPI GRID - CLEANER CARDS */}
            <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
              {[
                {
                  label: "Realizable Wealth",
                  value: currencyFormatter(auditMetrics?.realizableWealth || 0),
                  color: "emerald",
                  sub: "After Tax & Commissions"
                },
                {
                  label: "Net Profit (Audited)",
                  value: currencyFormatter(auditMetrics?.totalNetProfit || 0),
                  color: auditMetrics?.totalNetProfit >= 0 ? "indigo" : "rose",
                  sub: "Verified Gain"
                },
                {
                  label: "Tax Liability",
                  value: currencyFormatter(auditMetrics?.totalTaxLiability || 0),
                  color: "amber",
                  sub: "Pending CGT"
                },
                {
                  label: "Portfolio Maturity",
                  value: `${auditMetrics?.maturityScore.toFixed(1)}%`,
                  color: "sky",
                  sub: "Long-term Holdings"
                }
              ].map((kpi, i) => (
                <Card key={i} className="bg-white border-none shadow-sm ring-1 ring-slate-200/60 p-5">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{kpi.label}</Text>
                  <Metric className={`text-${kpi.color}-600 font-black mt-1 text-2xl`}>{kpi.value}</Metric>
                  <Text className="text-[9px] font-medium text-slate-400 mt-1">{kpi.sub}</Text>
                </Card>
              ))}
            </Grid>

            {/* 3. MAIN ANALYSIS AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Growth Chart */}
              <Card className="lg:col-span-2 bg-white border-none shadow-sm ring-1 ring-slate-100 p-8 rounded-3xl">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <Title className="text-slate-900 font-bold">Growth Trajectory</Title>
                    <Text className="text-xs text-slate-400 italic">Historical unit accumulation audit</Text>
                  </div>
                  {lastSynced && (
                    <Badge color="emerald" size="xs" className="bg-emerald-50 text-emerald-700 border-none font-mono">
                      LIVE SYNC ACTIVE
                    </Badge>
                  )}
                </div>
                <AreaChart
                  className="h-72"
                  data={trendData}
                  index="date"
                  categories={["Portfolio Volume"]}
                  colors={["indigo"]}
                  showLegend={false}
                  showAnimation={true}
                  curveType="monotone"
                />
              </Card>

              {/* Side Risk Profile */}
              <div className="space-y-6">
                <Card className="bg-white border-none shadow-sm ring-1 ring-slate-100 p-6 rounded-3xl">
                  <Title className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Sector Exposure</Title>
                  <DonutChart
                    className="h-40"
                    data={sectorData}
                    category="value"
                    index="name"
                    colors={["indigo", "sky", "slate", "blue", "violet"]}
                  />
                  <BarList data={sectorData.slice(0, 3)} color="indigo" className="mt-6" />
                </Card>

                <Card className="bg-indigo-600 text-white border-none p-6 rounded-3xl shadow-xl shadow-indigo-100 relative overflow-hidden">
                  <div className="relative z-10">
                    <Text className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Audit Summary</Text>
                    <Text className="mt-2 text-sm leading-relaxed font-medium">
                      Your portfolio shows a heavy focus in <span className="font-bold underline">{auditMetrics?.topSector}</span>.
                      Consider diversifying to lower your structural risk.
                    </Text>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-indigo-500 opacity-20">
                    <ShieldCheckIcon className="w-24 h-24" />
                  </div>
                </Card>
              </div>
            </div>

            {/* 4. REFINED AUDIT LEDGER - NO MORE GREEN/BLACK BLOCKS */}
            <Card className="bg-white border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 rounded-3xl overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                  <Title className="text-xl font-bold text-slate-900">Verified Ledger</Title>
                </div>
                <TextInput
                  icon={MagnifyingGlassIcon}
                  placeholder="Filter by Scrip..."
                  className="max-w-xs border-none bg-slate-50 rounded-xl"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Table>
                <TableHead>
                  <TableRow className="bg-slate-50/50">
                    <TableHeaderCell className="text-[10px] font-black uppercase text-slate-400 px-8 py-4">Scrip Entity</TableHeaderCell>
                    <TableHeaderCell className="text-[10px] font-black uppercase text-slate-400 px-8 py-4">Market Price</TableHeaderCell>
                    <TableHeaderCell className="text-[10px] font-black uppercase text-slate-400 px-8 py-4">Tax Status</TableHeaderCell>
                    <TableHeaderCell className="text-[10px] font-black uppercase text-slate-400 px-8 py-4">Net P/L Audit</TableHeaderCell>
                    <TableHeaderCell className="text-[10px] font-black uppercase text-slate-400 px-8 py-4 text-right">Holding</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPortfolio.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                      {/* Scrip Entity */}
                      <TableCell className="px-8 py-5">
                        <Text className="font-black text-slate-900 text-base">{item.symbol}</Text>
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified Asset</Text>
                      </TableCell>

                      {/* Market Price */}
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Text className="font-mono font-bold text-slate-600">Rs.</Text>
                          <Text className="font-mono font-black text-slate-900">{item.currentPrice?.toLocaleString() || "---"}</Text>
                        </div>
                      </TableCell>

                      {/* Tax Status Badge */}
                      <TableCell className="px-8 py-5">
                        <Badge
                          color={item.taxStatus?.includes('Long') ? "emerald" : "amber"}
                          size="xs"
                          className="font-mono"
                        >
                          {item.taxStatus || "Pending Sync"}
                        </Badge>
                        {item.daysToMaturity > 0 && (
                          <Text className="text-[9px] mt-1 text-amber-600 font-bold">
                            {item.daysToMaturity} days to 5% tax
                          </Text>
                        )}
                      </TableCell>

                      {/* Net P/L Audit */}
                      <TableCell className="px-8 py-5">
                        {item.netProfit !== undefined ? (
                          <div className="flex flex-col">
                            <span className={`text-xs font-black ${item.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {item.netProfit >= 0 ? '▲' : '▼'} Rs. {Math.abs(item.netProfit).toLocaleString()}
                            </span>
                            <Text className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Final Net (After Tax)</Text>
                          </div>
                        ) : (
                          <Text className="text-[10px] font-bold text-slate-300 italic">Audit Required</Text>
                        )}
                      </TableCell>

                      {/* Holding Units */}
                      <TableCell className="px-8 py-5 text-right">
                        <Text className="font-black text-slate-900">{item.units.toLocaleString()}</Text>
                        <Text className="text-[10px] font-bold text-slate-400">UNITS</Text>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        ) : (
          /* Empty State */
          <div className="py-40 flex flex-col items-center justify-center bg-white border border-slate-100 shadow-sm rounded-[3rem]">
            <div className="bg-indigo-50 p-10 rounded-[2rem] mb-6">
              <DocumentArrowDownIcon className="w-12 h-12 text-indigo-600" />
            </div>
            <Title className="text-slate-900 font-bold text-2xl">Ledger Offline</Title>
            <Text className="text-slate-400 mt-2 font-medium">Please provide a MeroShare CSV for system initialization.</Text>
            <div className="mt-8 relative group">
              <input type="file" accept=".csv" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <button className="bg-indigo-600 text-white font-bold px-10 py-3.5 rounded-2xl shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all">
                Initialize Audit Protocol
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}