/**
 * sectors.ts
 * Complete Sector Mapping for Share Auditor NP
 * Generated based on your MeroShare Transaction History
 */

export const SCRIP_SECTORS: Record<string, string> = {
  // --- HYDROPOWER ---
  SIPD: "Hydropower",
  SOHL: "Hydropower",
  UPPER: "Hydropower",
  MCHL: "Hydropower",
  TAMOR: "Hydropower",
  PHCL: "Hydropower",
  TVCL: "Hydropower",
  TJVCL: "Hydropower",
  SGHC: "Hydropower",
  MBJC: "Hydropower",
  GLH: "Hydropower",

  // --- LIFE INSURANCE ---
  PMLI: "Life Insurance",
  HLI: "Life Insurance",
  SRLI: "Life Insurance",
  ILI: "Life Insurance",
  SJLIC: "Life Insurance",
  ULI: "Life Insurance", // Merged into HLI
  RLI: "Life Insurance", // Merged into SRLI
  JLI: "Life Insurance", // Merged into SRLI

  // --- MICROFINANCE (LAGHUBITTA) ---
  GILB: "Microfinance",
  SMPDA: "Microfinance",
  UNLB: "Microfinance",
  GGBSL: "Microfinance",
  SPARS: "Microfinance", // Merged into NICLBSL
  NICLBSL: "Microfinance",

  // --- FINANCE ---
  PFL: "Finance",

  // --- INVESTMENT ---
  NIFRA: "Investment",

  // --- OTHERS (REINSURANCE & TRADING) ---
  HRL: "Others",   // Himalayan Reinsurance
  NRIC: "Others",  // Nepal Reinsurance
  TTL: "Others",   // Trade Tower
};

/**
 * Returns the official NEPSE sector for a given symbol.
 * Returns "Other" if the scrip is not yet mapped.
 */
export const getSector = (symbol: string): string => {
  if (!symbol) return "Unknown";
  const normalizedSymbol = symbol.toUpperCase().trim();
  return SCRIP_SECTORS[normalizedSymbol] || "Other";
};

/**
 * Utility to get all available sectors for filter dropdowns
 */
export const getAllSectors = (): string[] => {
  const sectors = Object.values(SCRIP_SECTORS);
  return Array.from(new Set(sectors)).sort();
};