/**
 * lib/sectors.ts
 * Complete Sector Mapping for Share Auditor NP
 * Updated: April 2026 (Includes Mergers & 2026 IPOs)
 */

export const SCRIP_SECTORS: Record<string, string> = {
  // --- HYDROPOWER (High Volatility) ---
  SIPD: "Hydropower", SOHL: "Hydropower", UPPER: "Hydropower", MCHL: "Hydropower",
  TAMOR: "Hydropower", PHCL: "Hydropower", TVCL: "Hydropower", TJVCL: "Hydropower",
  SGHC: "Hydropower", MBJC: "Hydropower", GLH: "Hydropower", NYADI: "Hydropower",
  SGHL: "Hydropower", KHL: "Hydropower", SSHL: "Hydropower", KKHC: "Hydropower",
  APPLO: "Hydropower", // 2026 New Entry

  // --- LIFE INSURANCE (Consolidated) ---
  PMLI: "Life Insurance", HLI: "Life Insurance", SRLI: "Life Insurance",
  ILI: "Life Insurance", SJLIC: "Life Insurance", ULI: "Life Insurance", 
  RLI: "Life Insurance", JLI: "Life Insurance", CLI: "Life Insurance",

  // --- NON-LIFE INSURANCE ---
  NIL: "Non-Life Insurance", GICL: "Non-Life Insurance", HEIP: "Non-Life Insurance",
  IGI: "Non-Life Insurance", SGIC: "Non-Life Insurance", PRVU: "Non-Life Insurance",

  // --- MICROFINANCE (Laghu Bittas) ---
  GILB: "Microfinance", SMPDA: "Microfinance", UNLB: "Microfinance",
  GGBSL: "Microfinance", SPARS: "Microfinance", NICLBSL: "Microfinance",
  GBLBS: "Microfinance", NESDO: "Microfinance", JBLB: "Microfinance",

  // --- COMMERCIAL BANKS ---
  NABIL: "Banking", NIMB: "Banking", GBIME: "Banking", NICA: "Banking",
  ADBL: "Banking", SANIMA: "Banking", EBL: "Banking", SCB: "Banking",

  // --- FINANCE & INVESTMENT ---
  PFL: "Finance", GMFIL: "Finance", NIFRA: "Investment", HIDCL: "Investment",
  CIT: "Investment",

  // --- MANUFACTURING & TRADING (2026 Growth Sector) ---
  SOPL: "Manufacturing", // Sopan Pharmaceuticals
  HDL: "Manufacturing", SHIVM: "Manufacturing", TTL: "Trading",

  // --- OTHERS ---
  HRL: "Others", NRIC: "Others",
};

/**
 * Returns the official NEPSE sector for a given symbol.
 * Includes a fallback for symbols not yet in our primary registry.
 */
export const getSector = (symbol: string): string => {
  if (!symbol) return "Unknown";
  const normalizedSymbol = symbol.toUpperCase().trim();
  
  // Logical Mapping: If it's a known symbol, return its sector
  if (SCRIP_SECTORS[normalizedSymbol]) {
    return SCRIP_SECTORS[normalizedSymbol];
  }

  // Auditor Intelligence: Heuristic Guessing for unmapped scrips
  if (normalizedSymbol.endsWith('LBSL') || normalizedSymbol.endsWith('LB')) return "Microfinance";
  if (normalizedSymbol.endsWith('HPC') || normalizedSymbol.endsWith('CL')) return "Hydropower";
  if (normalizedSymbol.endsWith('L') && normalizedSymbol.length === 3) return "Banking";

  return "Other/Diversified";
};

/**
 * Returns unique sorted sectors for UI selection/filtering
 */
export const getAllSectors = (): string[] => {
  return Array.from(new Set(Object.values(SCRIP_SECTORS))).sort();
};