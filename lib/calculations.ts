/**
 * lib/calculations.ts
 * Share Auditor NP - Professional Fiscal Engine
 */

export interface Transaction {
  symbol: string;
  date: string;
  type: string; // 'IPO', 'BONUS', 'RIGHT', 'SECONDARY_BUY'
  units: number;
  costPerUnit?: number;
  currentPrice?: number;
}

/**
 * Calculates the total Nepalese broker commission and SEBON fees.
 * Updated for 2026 tiered structures.
 */
export const calculateBrokerFees = (amount: number): number => {
  if (amount === 0) return 0;
  
  let commissionRate = 0;
  if (amount <= 50000) commissionRate = 0.0036;
  else if (amount <= 500000) commissionRate = 0.0033;
  else if (amount <= 2000000) commissionRate = 0.0031;
  else if (amount <= 10000000) commissionRate = 0.0027;
  else commissionRate = 0.0024;

  const commission = amount * commissionRate;
  const sebonFee = amount * 0.00015; // 0.015%
  const dpCharge = 25; // DP Charge per script per day

  return commission + sebonFee + dpCharge;
};

/**
 * The Master Auditor Logic:
 * Processes raw portfolio data into a high-fidelity fiscal report.
 */
export const calculateTaxAndNetPNL = (portfolio: any[]) => {
  const now = new Date();

  return portfolio.map((item) => {
    // 1. Determine Base Cost per unit based on NEPSE rules
    let baseCost = 100; // Default for IPO
    if (item.type === 'BONUS') baseCost = 0;
    if (item.type === 'RIGHT') baseCost = 100;
    if (item.type === 'SECONDARY_BUY') baseCost = item.costPerUnit || 0;

    // 2. Calculate Initial Investment and Fees
    const purchaseAmount = item.units * baseCost;
    const fees = item.type === 'SECONDARY_BUY' ? calculateBrokerFees(purchaseAmount) : 0;
    const totalInvested = purchaseAmount + fees;

    // 3. Market Valuation
    const currentPrice = item.currentPrice || baseCost;
    const totalMarketValue = item.units * currentPrice;
    const grossProfit = totalMarketValue - totalInvested;

    // 4. Tax Maturity Audit (CGT Logic)
    const purchaseDate = new Date(item.date);
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Nepal Rule: 5% for >365 days, 7.5% for <365 days
    const isLongTerm = diffDays >= 365;
    const taxRate = isLongTerm ? 0.05 : 0.075;
    const estimatedTax = grossProfit > 0 ? grossProfit * taxRate : 0;

    // 5. Final Audit Summary
    return {
      ...item,
      baseCost,
      fees,
      totalInvested,
      totalMarketValue,
      grossProfit,
      estimatedTax,
      netProfit: grossProfit - estimatedTax,
      taxStatus: isLongTerm ? "Long Term (5%)" : "Short Term (7.5%)",
      daysHeld: diffDays,
      daysToMaturity: isLongTerm ? 0 : 365 - diffDays,
      liquidityStatus: item.units > 500 ? "High" : "Moderate", // Basic liquidity audit
    };
  });
};

/**
 * Aggregates portfolio-wide metrics for the Dashboard KPI Grid.
 */
export const aggregateAuditMetrics = (auditedPortfolio: any[]) => {
  if (auditedPortfolio.length === 0) return null;

  return {
    totalWealth: auditedPortfolio.reduce((acc, curr) => acc + curr.totalMarketValue, 0),
    totalNetProfit: auditedPortfolio.reduce((acc, curr) => acc + curr.netProfit, 0),
    totalTaxLiability: auditedPortfolio.reduce((acc, curr) => acc + curr.estimatedTax, 0),
    portfolioMaturity: (auditedPortfolio.filter(i => i.daysToMaturity === 0).length / auditedPortfolio.length) * 100,
  };
};