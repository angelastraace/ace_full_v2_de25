import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const MOCK_PRICES: Record<string, number> = {
  "BTC-USDT": 45234.5,
  "ETH-USDT": 2845.2,
  "SOL-USDT": 198.45,
  "XRP-USDT": 2.45,
}

export async function GET(req: NextRequest) {
  try {
    const pair = req.nextUrl.searchParams.get("pair") || "BTC-USDT"
    const price = MOCK_PRICES[pair] || 0

    return NextResponse.json({
      success: true,
      pair,
      price,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Price fetch error:", error)
    return NextResponse.json({ success: false, message: "Error fetching price" }, { status: 500 })
  }
}