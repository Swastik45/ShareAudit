// src/lib/mock.ts

/**
 * Mock MeroShare Transaction History
 * Structure: "S.N","Scrip","Transaction Date","Credit Quantity","Debit Quantity","Balance After Transaction","History Description"
 * This data is used for the Guest/Demo mode to showcase the auditor's capabilities.
 */
export const MOCK_CSV_DATA: string = `"S.N","Scrip","Transaction Date","Credit Quantity","Debit Quantity","Balance After Transaction","History Description"
"1","NTC","2024-03-15","100","0","100","Secondary Buy"
"2","KBL","2024-04-02","500","0","500","Secondary Buy"
"3","NIMB","2025-01-10","50","0","550","Bonus Share"
"4","HDL","2025-02-20","10","0","10","Secondary Buy"
"5","AHPC","2026-01-05","10","0","10","IPO Allotment"
"6","UPPER","2026-01-12","10","0","10","IPO Allotment"
"7","NRIC","2026-03-10","150","0","150","Secondary Buy"
"8","GBIME","2026-04-15","200","0","200","Secondary Buy"
"9","NTC","2026-04-18","0","20","80","Secondary Sell"`;