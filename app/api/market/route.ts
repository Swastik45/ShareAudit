import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // --- SOURCE 1: SHARESANSAR (Primary) ---
    const ssRes = await fetch('https://www.sharesansar.com/today-share-price', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 } 
    });

    if (ssRes.ok) {
      const html = await ssRes.text();
      const $ = cheerio.load(html);
      const scrapedData: any[] = [];

      // Improved Selector: Target the table directly by its ID if possible
      // Sharesansar often uses #headertbl or similar
      $('table tr').each((_, row) => {
        const cols = $(row).find('td');
        if (cols.length > 5) {
          // Manual fallback: Usually, Symbol is 2nd col, LTP is 7th
          const symbol = $(cols[1]).text().trim().toUpperCase();
          const ltp = parseFloat($(cols[6]).text().trim().replace(/,/g, ''));

          if (symbol && symbol.length <= 6 && !isNaN(ltp)) {
            scrapedData.push({ symbol, ltp });
          }
        }
      });

      if (scrapedData.length > 0) {
        return NextResponse.json({ source: "Sharesansar", data: scrapedData });
      }
    }

    // --- SOURCE 2: NEPSE ALPHA (New Free Fallback) ---
    // This replaces the dead Heroku link
    const alphaRes = await fetch('https://nepsealpha.com/trading-menu/today-price', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (alphaRes.ok) {
        const html = await alphaRes.text();
        const $ = cheerio.load(html);
        const alphaData: any[] = [];

        $('.table tr').each((_, row) => {
            const cols = $(row).find('td');
            const symbol = $(cols[1]).text().trim().toUpperCase();
            const ltp = parseFloat($(cols[2]).text().trim().replace(/,/g, ''));
            if (symbol && !isNaN(ltp)) alphaData.push({ symbol, ltp });
        });

        if (alphaData.length > 0) return NextResponse.json({ source: "NepseAlpha", data: alphaData });
    }

    throw new Error("Scrapers Blocked or Market Offline");

  } catch (error: any) {
    // --- STAGE 3: THE VAULT (Last Resort) ---
    return NextResponse.json({ 
      isMock: true, 
      source: "Offline Vault",
      data: [
        { symbol: "HRL", ltp: 713 }, 
        { symbol: "SOHL", ltp: 810 },
        { symbol: "PMLI", ltp: 480 }
      ] 
    });
  }
}