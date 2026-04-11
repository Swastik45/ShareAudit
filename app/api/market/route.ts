// app/api/market/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Using a more direct JSON endpoint
    const response = await fetch('https://nepsealpha.com/api/smtm/get_price_volume');
    
    if (!response.ok) throw new Error("Source offline");
    
    const result = await response.json();
    
    // Log this in your terminal to see exactly what NEPSE is sending back
    // console.log("API RAW DATA:", result); 

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "API unreachable" }, { status: 500 });
  }
}