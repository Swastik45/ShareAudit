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
            const scrip = row['Scrip'] || row['Symbol'] || 'Unknown';
            const credit = safeParse(row['Credit Quantity']);
            const debit = safeParse(row['Debit Quantity']);
            const units = credit > 0 ? credit : debit;

            let auditType = 'TRANSACTION';
            if (description.includes('OFFERING') || description.includes('IPO')) auditType = 'IPO';
            else if (description.includes('BONUS')) auditType = 'BONUS';
            else if (description.includes('RIGHT')) auditType = 'RIGHT';
            else if (debit > 0) auditType = 'SELL/TRANSFER';

            return {
              symbol: scrip,
              date: row['Transaction Date'] || 'N/A',
              type: auditType,
              units: units,
            };
          })
          .filter(item => item.symbol !== 'Unknown' && item.units > 0);

        resolve(mapped);
      },
      error: (err) => reject(err),
    });
  });
};