export interface PortfolioItem {
  symbol: string;
  industry: string;
  units: number;
  wacc: number;
  totalCost: number;
  currentPrice?: number;
  sectorValue?: number;
}

export interface IndustryData {
  name: string;
  value: number;
}