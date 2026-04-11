// app/api/market/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // We fetch from a more stable public data source
    const response = await fetch('https://nepsealpha.com/api/smtm/get_price_volume', {
      next: { revalidate: 60 }, // Cache data for 60 seconds
    });
    
    if (!response.ok) throw new Error("NEPSE Data Source Unreachable");
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}