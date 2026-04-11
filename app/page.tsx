"use client";
import { useState, useMemo } from 'react';
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

  const valueFormatter = (number: number) => `${number.toLocaleString()} Units`;
  const currencyFormatter = (number: number) => `Rs. ${number.toLocaleString()}`;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        const data = await parsePortfolioCSV(e.target.files[0]);
        setPortfolio(data);
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
    const years = [...new Set(portfolio.map(i => i.date.split('-')[0]))];

    return {
      totalUnits,
      investedCapital: ipoUnits * 100,
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


const syncMarketPrices = async () => {
  if (portfolio.length === 0) return alert("Upload your CSV first!");
  
  setIsSyncing(true);
  
  // 1. Declare the variable HERE (outside the try block)
  let marketArray: any[] = []; 

  try {
    const response = await fetch('/api/market');
    const result = await response.json();

    // 2. Assign the data inside the try block
    if (Array.isArray(result)) {
      marketArray = result;
    } else if (result.data && Array.isArray(result.data)) {
      marketArray = result.data;
    } else if (result.prices && Array.isArray(result.prices)) {
      marketArray = result.prices;
    } else {
      const possibleKey = Object.keys(result).find(k => Array.isArray(result[k]));
      if (possibleKey) marketArray = result[possibleKey];
    }

    if (marketArray.length === 0) {
        throw new Error("Data structure mismatch or empty response");
    }

    // 3. Now this block can see marketArray without error
    const updated = portfolio.map(item => {
      const liveStock = marketArray.find((s: any) => 
        (s.symbol || s.scrip || s.s || "").toUpperCase() === item.symbol.toUpperCase()
      );

      const currentPrice = Number(liveStock?.ltp || liveStock?.last_price || 100);
      
      return {
        ...item,
        currentPrice: currentPrice,
        totalValue: currentPrice * item.units,
        profit: (currentPrice - 100) * item.units 
      };
    });

    setPortfolio(updated);
    alert("Audit Successful.");

  } catch (error) {
    console.error("Internal Sync Error:", error);
    alert("Market data source is currently unresponsive (typical for weekends).");
  } finally {
    setIsSyncing(false);
  }
};


  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans selection:bg-indigo-100">
      {/* 1. HEADER SECTION */}
      <div className="bg-slate-900 p-10 text-white shadow-2xl mb-8 border-b-4 border-indigo-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-2">
            <Badge color="indigo" size="xs" className="mb-2 font-mono uppercase tracking-[0.4em]">Audit Protocol v4.0</Badge>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
              Share Auditor <span className="text-indigo-400 font-bold">NP</span>
            </h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <CpuChipIcon className="w-4 h-4 text-indigo-500" /> BCA System Audit | {auditMetrics?.totalUnits.toLocaleString() || 0} Units Tracked
            </p>
          </div>
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex items-center gap-6 shadow-inner">
            <input
              type="file"
              accept=".csv"
              onChange={handleUpload}
              className="text-xs text-slate-300 file:mr-4 file:py-2 file:px-8 file:rounded-full file:border-0 file:bg-indigo-600 file:text-white cursor-pointer font-bold shadow-lg"
            />
            <button
              onClick={syncMarketPrices}
              disabled={isSyncing || portfolio.length === 0}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${isSyncing ? 'bg-slate-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg active:scale-95'
                } text-white`}
            >
              <ArrowTrendingUpIcon className="w-4 h-4" />
              {isSyncing ? "Syncing Market..." : "Sync Live Analysis"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {portfolio.length > 0 ? (
          <>
            {/* 2. KPI GRID */}
            <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
              <Card decoration="top" decorationColor="emerald" className="bg-white shadow-sm ring-1 ring-slate-200">
                <Text className="text-[10px] uppercase font-black text-slate-400 mb-1">IPO Cost (Est.)</Text>
                <Metric className="text-slate-900 font-black">{currencyFormatter(auditMetrics?.investedCapital || 0)}</Metric>
              </Card>
              <Card decoration="top" decorationColor="indigo" className="bg-white shadow-sm ring-1 ring-slate-200">
                <Text className="text-[10px] uppercase font-black text-slate-400 mb-1">Total Volume</Text>
                <Metric className="text-slate-900 font-black">{auditMetrics?.totalUnits.toLocaleString()}</Metric>
              </Card>
              <Card decoration="top" decorationColor="rose" className="bg-white shadow-sm ring-1 ring-slate-200">
                <Text className="text-[10px] uppercase font-black text-slate-400 mb-1">Clutter Score</Text>
                <Metric className="text-slate-900 font-black">{auditMetrics?.clutterScore.toFixed(0)}%</Metric>
              </Card>
              <Card decoration="top" decorationColor="amber" className="bg-white shadow-sm ring-1 ring-slate-200">
                <Text className="text-[10px] uppercase font-black text-slate-400 mb-1">Audit Lifespan</Text>
                <Metric className="text-slate-900 font-black">{auditMetrics?.activeYears} Years</Metric>
              </Card>
            </Grid>

            {/* 3. VISUALIZATION: GROWTH AREA + STATIC TABLE */}
            <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200 p-8">
              <Title className="text-slate-900 font-black uppercase tracking-tight mb-8">Portfolio Growth History</Title>
              <Grid numItemsLg={3} className="gap-10">
                {/* Visual Chart */}
                <div className="lg:col-span-2">
                  <AreaChart
                    className="h-80"
                    data={trendData}
                    index="date"
                    categories={["Portfolio Volume"]}
                    colors={["indigo"]}
                    valueFormatter={(n) => `${n} Units`}
                    showLegend={false}
                    yAxisWidth={60}
                    showAnimation={true}
                    curveType="monotone"
                  />
                </div>
                {/* Static Audit List (Exact Values) */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <Text className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Yearly Growth Audit</Text>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {yearlyStats.map((stat) => (
                      <div key={stat.year} className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <div>
                          <Text className="font-bold text-slate-900">{stat.year}</Text>
                          <Text className="text-[10px] text-emerald-600 font-bold">+{stat.added.toLocaleString()} Units Added</Text>
                        </div>
                        <div className="text-right">
                          <Text className="text-[10px] font-bold text-slate-400 uppercase">Year End</Text>
                          <Text className="text-base font-black text-indigo-600">{stat.endBalance.toLocaleString()}</Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Grid>
            </Card>

            {/* 4. SECTOR & DISTRIBUTION DUAL VIEW */}
            <Grid numItemsLg={3} className="gap-8">
              <Card className="lg:col-span-2 bg-white ring-1 ring-slate-200 p-8">
                <Title className="text-slate-900 font-black uppercase tracking-tight mb-8">Structural Risk Audit</Title>
                <Grid numItemsMd={2} className="gap-16">
                  <div>
                    <Text className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Asset Concentration</Text>
                    <DonutChart className="h-44 w-44 mx-auto" data={scripData.slice(0, 10)} category="value" index="name" colors={["indigo", "cyan", "sky", "violet", "slate"]} />
                    <BarList data={scripData.slice(0, 5)} color="indigo" className="mt-8" />
                  </div>
                  <div className="lg:border-l border-slate-100 lg:pl-10">
                    <Text className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Industry Exposure</Text>
                    <DonutChart className="h-44 w-44 mx-auto" data={sectorData} category="value" index="name" colors={["emerald", "teal", "cyan", "sky", "blue"]} />
                    <BarList
                      data={sectorData.map(s => ({
                        name: s.name,
                        value: s.value,
                        label: `${Math.round((s.value / auditMetrics!.totalUnits) * 100)}%`
                      }))}
                      color="emerald" className="mt-8"
                    />
                  </div>
                </Grid>
              </Card>

              {/* AUDITOR NOTES */}
              <div className="space-y-6">
                <Card decoration="left" decorationColor="indigo" className="bg-white ring-1 ring-slate-200">
                  <Text className="text-[10px] font-black uppercase text-slate-400 mb-1">Primary Dependency</Text>
                  <Metric className="text-slate-900 font-black truncate">{auditMetrics?.topSector}</Metric>
                  <Text className="text-[10px] text-slate-400 mt-1 italic">Highest sector weight detected.</Text>
                </Card>
                <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-3xl p-8 overflow-hidden relative">
                  <ShieldCheckIcon className="absolute top-[-20px] right-[-20px] w-32 h-32 opacity-5" />
                  <Title className="text-indigo-400 font-black uppercase text-xs tracking-[0.2em] mb-4">Auditor Note</Title>
                  <Text className="text-slate-300 text-sm leading-relaxed mb-6">
                    Investment span of <span className="text-white font-bold">{auditMetrics?.activeYears} years</span> verified.
                    Concentration risk in <span className="text-white font-bold">{scripData[0]?.name}</span> should be monitored.
                  </Text>
                  <Divider className="bg-slate-800" />
                  <div className="flex justify-between items-center">
                    <Text className="text-[10px] font-mono text-indigo-400 uppercase tracking-tighter">ID: BCA_NP_AUDIT_X</Text>
                    <Badge color="indigo" size="xs">SECURE</Badge>
                  </div>
                </Card>
              </div>
            </Grid>

            {/* 5. RISK CALLOUT & FULL LEDGER */}
            {riskFindings && (
              <Callout className="shadow-xl border-l-8 py-6 rounded-2xl" title={riskFindings.title} icon={riskFindings.icon} color={riskFindings.color}>
                {riskFindings.message}
              </Callout>
            )}

            <Card className="bg-white p-0 overflow-hidden shadow-2xl ring-1 ring-slate-200 rounded-3xl">
              <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <Title className="text-slate-900 font-black uppercase text-2xl tracking-tight">Audit Ledger</Title>
                  <Text className="text-xs font-bold text-slate-400 italic">Verifying {filteredPortfolio.length} transaction points</Text>
                </div>
                <TextInput icon={MagnifyingGlassIcon} placeholder="Search Scrip Symbol..." className="max-w-sm ring-indigo-500 shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Table>
                <TableHead>
                  <TableRow className="bg-white text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                    <TableHeaderCell className="px-10 py-6">Asset</TableHeaderCell>
                    <TableHeaderCell className="px-10 py-6">Audit Date</TableHeaderCell>
                    <TableHeaderCell className="px-10 py-6">Sector mapping</TableHeaderCell>
                    <TableHeaderCell className="px-10 py-6 text-right">Volume</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPortfolio.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="px-10 py-6">
                        <span className="font-black text-indigo-700 text-lg">{item.symbol}</span>
                      </TableCell>
                      {/* NEW: Live Price Column */}
                      <TableCell className="px-10 py-6">
                        <Text className="text-xs font-bold text-slate-400">LTP</Text>
                        <Text className="font-mono font-bold">Rs. {item.currentPrice || "---"}</Text>
                      </TableCell>
                      {/* NEW: Profit/Loss Column with Color Coding */}
                      <TableCell className="px-10 py-6">
                        <Badge color={item.profit >= 0 ? "emerald" : "rose"} size="xs">
                          {item.profit ? `Rs. ${item.profit.toLocaleString()}` : "Pending Sync"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-10 py-6 text-right font-mono font-bold text-lg">
                        {item.units}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        ) : (
          <div className="py-48 flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-[4rem] bg-white shadow-inner">
            <div className="bg-indigo-50 p-12 rounded-full mb-8 animate-bounce">
              <DocumentArrowDownIcon className="w-16 h-16 text-indigo-500" />
            </div>
            <Title className="text-slate-900 font-black text-4xl tracking-tighter uppercase italic text-center px-6">System Standby: Upload MeroShare CSV</Title>
            <Text className="text-slate-400 mt-4 font-bold text-xl uppercase tracking-widest">Ready for Deep Audit Analysis</Text>
          </div>
        )}
      </div>
    </main>
  );
}