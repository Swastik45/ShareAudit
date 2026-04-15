import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // --- STAGE 1: SCRAPE SHARESANSAR (Primary Source) ---
    const response = await fetch('https://www.sharesansar.com/today-share-price', {
      next: { revalidate: 300 }, // 5-minute cache for efficiency
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      let symbolIdx = -1;
      let ltpIdx = -1;

      // Dynamic Header Mapping
      $('thead tr th').each((i, el) => {
        const text = $(el).text().toLowerCase().trim();
        if (text === 'symbol') symbolIdx = i;
        if (text.includes('ltp') || text.includes('close')) ltpIdx = i;
      });

      const scrapedData: any[] = [];
      if (symbolIdx !== -1 && ltpIdx !== -1) {
        $('tbody tr').each((_, row) => {
          const cols = $(row).find('td');
          const symbol = $(cols[symbolIdx]).text().trim().toUpperCase();
          const ltpStr = $(cols[ltpIdx]).text().trim().replace(/,/g, '');
          const ltp = parseFloat(ltpStr);
          
          if (symbol && !isNaN(ltp)) {
            scrapedData.push({ symbol, ltp });
          }
        });
      }

      if (scrapedData.length > 0) {
        return NextResponse.json({ 
          source: "Live Scraper (Sharesansar)", 
          data: scrapedData,
          timestamp: new Date().toISOString()
        });
      }
    }

    // --- STAGE 2: FALLBACK TO EXTERNAL API (Community API) ---
    // Using a 4-second timeout to prevent the UI from hanging
    const apiRes = await fetch('https://nepse-data-api.herokuapp.com/api/v1/market/today', { 
        signal: AbortSignal.timeout(4000) 
    });
    
    if (apiRes.ok) {
        const apiData = await apiRes.json();
        // Standardize structure to {symbol, ltp}
        const formattedApiData = apiData.map((item: any) => ({
            symbol: (item.symbol || item.scrip || "").toUpperCase(),
            ltp: parseFloat(item.ltp || item.lastPrice || 0)
        }));

        return NextResponse.json({ 
            source: "Community API Fallback", 
            data: formattedApiData 
        });
    }

    throw new Error("All live audit sources exhausted.");

  } catch (error: any) {
    console.error("Critical Audit Failure:", error.message);
    
    // --- STAGE 3: HARD-CODED "AUDIT SAFE-MODE" (Mock Data) ---
    // Essential for development and when NEPSE is closed
    return NextResponse.json({ 
      error: "Live Sync Offline",
      isMock: true, 
      source: "Internal Vault",
      data: [
        { symbol: "HRL", ltp: 620 }, 
        { symbol: "NIFRA", ltp: 245 },
        { symbol: "NABIL", ltp: 490 },
        { symbol: "UPPER", ltp: 315 },
        { symbol: "SGHC", ltp: 420 },
        { symbol: "HIDCL", ltp: 215 }
      ] 
    });
  }
}