import Papa from 'papaparse';

export const parsePortfolioCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const safeParse = (val: any): number => {
          if (!val || val === '-' || val === ' ') return 0;
          const parsed = parseFloat(String(val).replace(/,/g, ''));
          return isNaN(parsed) ? 0 : parsed;
        };

        const mapped = results.data
          .map((row: any) => {
            const description = (row['History Description'] || '').toUpperCase();
            const scrip = (row['Scrip'] || row['Symbol'] || 'Unknown').trim().toUpperCase();
            const credit = safeParse(row['Credit Quantity']);
            const debit = safeParse(row['Debit Quantity']);
            
            // Logic: In a history log, if debit > 0, it's a reduction in wealth
            const units = credit > 0 ? credit : -debit; 

            // Commission logic for Secondary Market entries
            const calculateFees = (u: number, price: number) => {
              const amount = Math.abs(u * price);
              if (amount === 0) return 0;
              let rate = 0;
              if (amount <= 50000) rate = 0.0036;
              else if (amount <= 500000) rate = 0.0033;
              else if (amount <= 2000000) rate = 0.0031;
              else if (amount <= 10000000) rate = 0.0027;
              else rate = 0.0024;

              return (amount * rate) + (amount * 0.00015) + 25;
            };

            let auditType = 'SECONDARY_BUY';
            if (description.includes('OFFERING') || description.includes('IPO')) auditType = 'IPO';
            else if (description.includes('BONUS')) auditType = 'BONUS';
            else if (description.includes('RIGHT')) auditType = 'RIGHT';
            else if (debit > 0) auditType = 'SELL';

            // Standardize Date for the 365-day Tax Logic
            const rawDate = row['Transaction Date'] || '';
            const formattedDate = rawDate.includes('/') 
              ? rawDate.split('/').reverse().join('-') // Converts DD/MM/YYYY to YYYY-MM-DD
              : rawDate;

            return {
              symbol: scrip,
              date: formattedDate,
              type: auditType,
              units: Math.abs(units),
              isDebit: units < 0,
              costPerUnit: auditType === 'IPO' ? 100 : (auditType === 'RIGHT' ? 100 : 0),
              fees: (auditType === 'SECONDARY_BUY' || auditType === 'SELL') ? calculateFees(Math.abs(units), 100) : 0,
            };
          })
          .filter(item => item.symbol !== 'Unknown' && item.units !== 0);

        resolve(mapped);
      },
      error: (err) => reject(err),
    });
  });
};