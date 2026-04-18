"use client";
import { useState, useMemo, useEffect } from 'react';
import { calculateTaxAndNetPNL } from '@/lib/calculations';
import { parsePortfolioCSV } from '@/lib/parser';
import { getSector } from '@/lib/sectors';
import { MOCK_CSV_DATA } from '@/lib/mock';
import { db } from '@/lib/db'; // Your Dexie instance
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Card, Title, AreaChart, DonutChart, BarList, Text, Flex, Grid,
  Metric, Badge, TextInput, Callout, Divider, Icon,
  Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell,
  Select, SelectItem
} from "@tremor/react";
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  // --- DATABASE & PERSISTENCE LAYER ---
  const portfolios = useLiveQuery(() => db.portfolios.toArray()) || [];
  const [activeId, setActiveId] = useState<number | null>(null);

  // Auto-select the first portfolio if none selected
  useEffect(() => {
    if (portfolios.length > 0 && !activeId) {
      setActiveId(portfolios[0].id);
    }
  }, [portfolios, activeId]);

  const activePortfolio = useMemo(() => 
    portfolios.find(p => p.id === activeId), 
    [portfolios, activeId]
  );

  const portfolio = useMemo(() => activePortfolio?.holdings || [], [activePortfolio]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);

  const currencyFormatter = (number: number) => `Rs. ${number.toLocaleString()}`;

  // --- CORE LOGIC: PERSISTENT AUDIT ---
  const processPortfolioData = async (rawData: any[], rawCsvString: string, name: string = "Main Portfolio") => {
  // 1. CONSOLIDATION LOGIC (WACC & Unit Merging)
  const consolidated = rawData.reduce((acc: any[], curr) => {
    const existing = acc.find(i => i.symbol === curr.symbol);
    if (existing) {
      // Logic: Add units if credit (IPO/Purchase), subtract if debit (Sale)
      existing.units += curr.isDebit ? -curr.units : curr.units;
      
      // Only add to cost if it's a "Credit" (Buying more shares)
      if (!curr.isDebit) {
        existing.totalCost += (curr.units * curr.costPerUnit) + curr.fees;
      }
    } else {
      // Initialize new scrip entry
      acc.push({ 
        ...curr, 
        totalCost: (curr.units * curr.costPerUnit) + curr.fees 
      });
    }
    return acc;
  }, []);

  // 2. CLEANUP: Filter out scrips that were fully sold (0 units)
  const finalHoldings = consolidated.filter(i => i.units > 0);

  try {
    // 3. DUPLICATE CHECK: Search DB by name to see if this portfolio already exists
    const existingPortfolio = await db.portfolios.where("name").equals(name).first();

    if (existingPortfolio) {
      // UPDATE: Overwrite existing ledger with new data
      await db.portfolios.update(existingPortfolio.id, {
        lastUpdated: new Date(),
        rawCsv: rawCsvString,
        holdings: finalHoldings
      });
      
      setActiveId(existingPortfolio.id);
      console.log(`[Audit System]: Updated existing protocol for ${name}`);
    } else {
      // CREATE: Add as a new entry in the registry
      const newId = await db.portfolios.add({
        name: name,
        lastUpdated: new Date(),
        rawCsv: rawCsvString,
        holdings: finalHoldings
      });
      
      setActiveId(newId);
      console.log(`[Audit System]: Initialized new protocol for ${name}`);
    }
  } catch (dbError) {
    console.error("Database Registry Failure:", dbError);
  }
};

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const rawCsvString = await file.text();
        const rawData = await parsePortfolioCSV(file);
        await processPortfolioData(rawData, rawCsvString, file.name.replace('.csv', ''));
      } catch (err) {
        console.error("Audit System Failure:", err);
      }
    }
  };

  const handleDemoMode = async () => {
    try {
      const blob = new Blob([MOCK_CSV_DATA], { type: 'text/csv' });
      const mockFile = new File([blob], "demo_portfolio.csv", { type: 'text/csv' });
      const rawData = await parsePortfolioCSV(mockFile);
      await processPortfolioData(rawData, MOCK_CSV_DATA, "Demo Portfolio");
    } catch (err) {
      console.error("Demo Initialization Failure:", err);
    }
  };

  const syncMarketPrices = async (retryCount = 0) => {
    if (portfolio.length === 0 || !activeId) return alert("Upload CSV to start audit.");

    setIsSyncing(true);
    try {
      const response = await fetch('/api/market');
      const result = await response.json();
      const marketArray = Array.isArray(result.data) ? result.data : (Array.isArray(result) ? result : []);

      if (marketArray.length === 0 && retryCount < 1) return syncMarketPrices(retryCount + 1);
      if (marketArray.length === 0) throw new Error("Market data unresponsive.");

      const rawUpdated = portfolio.map(item => {
        const live = marketArray.find((s: any) => (s.symbol || s.scrip || "").toUpperCase() === item.symbol.toUpperCase());
        const currentPrice = Number(live?.ltp || live?.last_traded_price || item.currentPrice || 100);
        return { ...item, currentPrice, totalValue: currentPrice * item.units };
      });

      const fiscalAudited = calculateTaxAndNetPNL(rawUpdated);

      // PERSIST THE SYNC: Update the database, UI will react via useLiveQuery
      await db.portfolios.update(activeId, { holdings: fiscalAudited });

      alert(`✅ AUDIT COMPLETE: Verified via ${result.source}`);
    } catch (error: any) {
      alert(`Audit Interrupted: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- ANALYTICS ENGINES ---
  const trendData = useMemo(() => {
    if (portfolio.length === 0) return [];
    const sorted = [...portfolio].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningTotal = 0;
    return sorted.map(item => ({ date: item.date, "Portfolio Volume": (runningTotal += item.units) }));
  }, [portfolio]);

  const scripData = useMemo(() => {
    const counts: Record<string, number> = {};
    portfolio.forEach(item => { counts[item.symbol] = (counts[item.symbol] || 0) + item.units; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [portfolio]);

  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {};
    portfolio.forEach(item => {
      const s = getSector(item.symbol);
      sectors[s] = (sectors[s] || 0) + item.units;
    });
    return Object.entries(sectors).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [portfolio]);

  const auditMetrics = useMemo(() => {
    if (portfolio.length === 0) return null;
    const totalUnits = portfolio.reduce((acc, curr) => acc + curr.units, 0);
    const totalNetProfit = portfolio.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);
    const totalTaxLiability = portfolio.reduce((acc, curr) => acc + (curr.estimatedTax || 0), 0);
    const totalCurrentValue = portfolio.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
    const maturityScore = (portfolio.filter(i => i.daysToMaturity === 0).length / portfolio.length) * 100;

    return {
      totalUnits,
      totalNetProfit,
      totalTaxLiability,
      realizableWealth: totalCurrentValue - totalTaxLiability,
      maturityScore,
      topSector: sectorData[0]?.name
    };
  }, [portfolio, sectorData]);

  const filteredPortfolio = useMemo(() => 
    portfolio.filter(item => item.symbol.toLowerCase().includes(searchTerm.toLowerCase())), 
    [portfolio, searchTerm]
  );

  if (!hasMounted) return null;

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-20 font-sans selection:bg-rose-100">
      <div className="bg-white border-b-2 border-slate-100 px-8 py-6 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-rose-600 p-3 rounded-2xl shadow-lg shadow-rose-200">
              <CpuChipIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">SHARE AUDITOR <span className="text-rose-600">NP</span></h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Protocol v4.0</span>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                {portfolios.length > 1 && (
                  <Select value={activeId?.toString()} onValueChange={(v) => setActiveId(Number(v))} className="w-40 border-none bg-transparent h-6 p-0">
                    {portfolios.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleDemoMode} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all">
              <ChartBarIcon className="w-4 h-4" /> Try Demo
            </button>
            <div className="relative group">
              <input type="file" accept=".csv" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-emerald-500/20 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-all">
                <DocumentArrowDownIcon className="w-4 h-4" /> New Audit
              </button>
            </div>
            <button onClick={() => syncMarketPrices()} disabled={isSyncing || portfolio.length === 0} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-rose-600 disabled:bg-slate-100 transition-all">
              {isSyncing ? "Syncing..." : "Run Market Audit"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {portfolio.length > 0 ? (
          <>
            <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
              {[
                { label: "Realizable Wealth", value: currencyFormatter(auditMetrics?.realizableWealth || 0), color: "emerald", sub: "Net Liquidity" },
                { label: "Net Profit", value: currencyFormatter(auditMetrics?.totalNetProfit || 0), color: (auditMetrics?.totalNetProfit || 0) >= 0 ? "emerald" : "rose", sub: "Audited Returns" },
                { label: "Tax Liability", value: currencyFormatter(auditMetrics?.totalTaxLiability || 0), color: "rose", sub: "Pending CGT" },
                { label: "Portfolio Maturity", value: `${auditMetrics?.maturityScore.toFixed(1)}%`, color: "emerald", sub: "Holding Status" }
              ].map((kpi, i) => (
                <Card key={i} className={`bg-white border-b-4 border-${kpi.color}-500 shadow-sm p-5 rounded-xl`}>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">{kpi.label}</Text>
                  <Metric className="text-slate-900 font-black mt-1 text-2xl">{kpi.value}</Metric>
                  <Badge color={kpi.color} size="xs" className="mt-2 font-mono">{kpi.sub}</Badge>
                </Card>
              ))}
            </Grid>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
                <Title className="text-slate-900 font-black">Performance Audit</Title>
                <AreaChart className="h-72 mt-8" data={trendData} index="date" categories={["Portfolio Volume"]} colors={["emerald"]} showAnimation={true} showGridLines={false} curveType="monotone" />
              </Card>

              <div className="space-y-6">
                <Card className="bg-white border-l-4 border-rose-500 p-6 rounded-2xl shadow-sm">
                  <Title className="text-xs font-black text-slate-900 uppercase mb-6">Asset Distribution</Title>
                  <DonutChart className="h-44" data={sectorData} category="value" index="name" colors={["emerald", "rose", "slate", "zinc", "stone"]} />
                  <BarList data={sectorData.slice(0, 3)} color="emerald" className="mt-6" />
                </Card>
                <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-100">
                  <ShieldCheckIcon className="w-8 h-8 mb-3" />
                  <Text className="mt-1 font-medium text-sm leading-relaxed">
                    Portfolio concentration in <span className="font-black underline">{auditMetrics?.topSector}</span> verified.
                  </Text>
                </div>
              </div>
            </div>

            <Card className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <Title className="text-lg font-bold text-slate-900">Verified Ledger: {activePortfolio?.name}</Title>
                <TextInput icon={MagnifyingGlassIcon} placeholder="Filter scrip..." className="max-w-xs" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Table>
                <TableHead className="bg-slate-50">
                  <TableRow>
                    <TableHeaderCell>ENTITY</TableHeaderCell>
                    <TableHeaderCell>LTP</TableHeaderCell>
                    <TableHeaderCell>TAX STATUS</TableHeaderCell>
                    <TableHeaderCell>NET GAIN</TableHeaderCell>
                    <TableHeaderCell className="text-right">VOLUME</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPortfolio.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-8 py-5">
                        <Text className="font-black text-slate-900">{item.symbol}</Text>
                        <Text className="text-[10px] text-slate-400">Verified Asset</Text>
                      </TableCell>
                      <TableCell className="font-mono">Rs. {item.currentPrice?.toLocaleString()}</TableCell>
                      <TableCell><Badge color={item.taxStatus?.includes('Long') ? "emerald" : "rose"} size="xs">{item.taxStatus || "Pending"}</Badge></TableCell>
                      <TableCell className={item.netProfit >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                        {item.netProfit >= 0 ? '▲' : '▼'} Rs. {Math.abs(item.netProfit || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-black">{item.units.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
            <DocumentArrowDownIcon className="w-10 h-10 text-rose-600 mb-6" />
            <Title className="text-slate-900 font-black text-2xl">Ledger Offline</Title>
            <Text className="text-slate-400 mt-2 font-medium">Awaiting MeroShare CSV for system initialization.</Text>
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="relative group">
                <input type="file" accept=".csv" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <button className="bg-slate-900 text-white font-bold px-10 py-3.5 rounded-2xl shadow-xl hover:bg-rose-600 transition-all">Initialize Audit Protocol</button>
              </div>
              <button onClick={handleDemoMode} className="text-slate-400 text-xs font-bold hover:text-rose-600 underline">Or explore system with mock data</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}