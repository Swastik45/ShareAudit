// app/api/market/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Switching to a more reliable data aggregator for NEPSE
    const response = await fetch('https://nepsealpha.com/api/smtm/get_price_volume', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0', // Some APIs block "empty" agents
      },
      next: { revalidate: 0 } // Disable cache while debugging
    });

    const text = await response.text(); // Get raw text first
    
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      console.error("Raw API Response was not JSON:", text.substring(0, 100));
      return NextResponse.json({ error: "API returned invalid format" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Connection to NEPSE source failed" }, { status: 500 });
  }
}