import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // --- STEP 1: SCRAPE SHARESANSAR ---
    const response = await fetch('https://www.sharesansar.com/today-share-price', {
      next: { revalidate: 60 }, // Cache for 1 minute
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error("Source site unreachable");
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Dynamic Column Discovery
    let symbolIdx = -1;
    let ltpIdx = -1;

    $('thead tr th').each((i, el) => {
      const text = $(el).text().toLowerCase().trim();
      if (text.includes('symbol')) symbolIdx = i;
      if (text.includes('ltp') || text.includes('close')) ltpIdx = i;
    });

    const scrapedData: any[] = [];
    if (symbolIdx !== -1 && ltpIdx !== -1) {
      $('tbody tr').each((_, row) => {
        const cols = $(row).find('td');
        const symbol = $(cols[symbolIdx]).text().trim();
        const ltp = $(cols[ltpIdx]).text().trim().replace(/,/g, '');
        
        if (symbol && !isNaN(parseFloat(ltp))) {
          scrapedData.push({ symbol, ltp: parseFloat(ltp) });
        }
      });
    }

    if (scrapedData.length > 0) {
      return NextResponse.json({ source: "Self-Healing Scraper", data: scrapedData });
    }

    // --- STEP 2: FALLBACK TO EXTERNAL API ---
    const apiRes = await fetch('https://nepseapi.surajrimal.dev/api/PriceVolume', { signal: AbortSignal.timeout(5000) });
    const apiData = await apiRes.json();
    return NextResponse.json({ source: "Community API", data: apiData });

  } catch (error: any) {
    console.error("Audit System Failure:", error.message);
    return NextResponse.json({ 
      error: "All live sources failed", 
      isMock: true, 
      data: [{ symbol: "HRL", ltp: 610 }, { symbol: "NIFRA", ltp: 245 }] 
    });
  }
}