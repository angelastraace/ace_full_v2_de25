"use client"

import type React from "react"

import Header from "@/components/header"
import Footer from "@/components/footer"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Market {
  id: string
  pair: string
  baseAsset: string
  quoteAsset: string
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
}

interface OrderBook {
  bids: Array<[number, number]>
  asks: Array<[number, number]>
}

const MOCK_MARKETS: Market[] = [
  {
    id: "BTC-USDT",
    pair: "BTC/USDT",
    baseAsset: "BTC",
    quoteAsset: "USDT",
    price: 45234.5,
    change24h: 5.32,
    volume24h: 28500000000,
    high24h: 46200,
    low24h: 42800,
  },
  {
    id: "ETH-USDT",
    pair: "ETH/USDT",
    baseAsset: "ETH",
    quoteAsset: "USDT",
    price: 2845.2,
    change24h: 3.21,
    volume24h: 15300000000,
    high24h: 2950,
    low24h: 2750,
  },
  {
    id: "SOL-USDT",
    pair: "SOL/USDT",
    baseAsset: "SOL",
    quoteAsset: "USDT",
    price: 198.45,
    change24h: -2.15,
    volume24h: 2100000000,
    high24h: 210,
    low24h: 190,
  },
  {
    id: "XRP-USDT",
    pair: "XRP/USDT",
    baseAsset: "XRP",
    quoteAsset: "USDT",
    price: 2.45,
    change24h: 8.76,
    volume24h: 890000000,
    high24h: 2.68,
    low24h: 2.1,
  },
]

export default function TradePage() {
  const [selectedMarket, setSelectedMarket] = useState<Market>(MOCK_MARKETS[0])
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [priceType, setPriceType] = useState<"limit" | "market">("limit")
  const [amount, setAmount] = useState("")
  const [price, setPrice] = useState("")
  const [orderHistory, setOrderHistory] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const filteredMarkets = MOCK_MARKETS.filter(
    (m) =>
      m.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.baseAsset.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    const order = {
      id: Date.now().toString(),
      pair: selectedMarket.pair,
      type: orderType,
      amount: Number.parseFloat(amount),
      price: priceType === "limit" ? Number.parseFloat(price) : selectedMarket.price,
      total: Number.parseFloat(amount) * (priceType === "limit" ? Number.parseFloat(price) : selectedMarket.price),
      status: "COMPLETED",
      timestamp: new Date(),
    }

    setOrderHistory([order, ...orderHistory])
    setAmount("")
    setPrice("")
  }

  const total = amount && price ? (Number.parseFloat(amount) * Number.parseFloat(price)).toFixed(2) : "0.00"

  return (
    <div className="min-h-screen bg-ace-dark text-white">
      <Header />

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Trading Terminal</h1>
          <p className="text-gray-400 mb-8">Advanced spot trading interface</p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left: Markets List */}
            <div className="lg:col-span-1">
              <div className="ace-glow-box p-4">
                <h2 className="text-lg font-bold mb-4">Markets</h2>

                <input
                  type="text"
                  placeholder="Search pair..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-2 text-sm text-white placeholder-gray-600 mb-4"
                />

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredMarkets.map((market) => (
                    <button
                      key={market.id}
                      onClick={() => setSelectedMarket(market)}
                      className={`w-full p-3 rounded-lg transition text-left ${
                        selectedMarket.id === market.id
                          ? "ace-glow-box border border-cyan-400"
                          : "bg-[#0a2424]/50 hover:bg-[#0a2424] border border-transparent"
                      }`}
                    >
                      <div className="font-bold text-sm">{market.pair}</div>
                      <div className="text-xs text-gray-400">${market.price.toFixed(2)}</div>
                      <div className={`text-xs font-bold ${market.change24h > 0 ? "text-green-400" : "text-red-400"}`}>
                        {market.change24h > 0 ? "+" : ""}
                        {market.change24h.toFixed(2)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center: Trading Interface */}
            <div className="lg:col-span-2">
              {/* Market Info */}
              <div className="ace-glow-box p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedMarket.pair}</h2>
                    <p className="text-gray-400">Spot Trading</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">${selectedMarket.price.toFixed(2)}</div>
                    <div
                      className={`text-lg font-bold flex items-center gap-1 justify-end ${
                        selectedMarket.change24h > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {selectedMarket.change24h > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      {selectedMarket.change24h > 0 ? "+" : ""}
                      {selectedMarket.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">24h High</div>
                    <div className="font-bold">${selectedMarket.high24h.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">24h Low</div>
                    <div className="font-bold">${selectedMarket.low24h.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">24h Volume</div>
                    <div className="font-bold">${(selectedMarket.volume24h / 1000000000).toFixed(1)}B</div>
                  </div>
                </div>
              </div>

              {/* Order Form */}
              <div className="ace-glow-box p-6">
                <h2 className="text-xl font-bold mb-4">Place Order</h2>

                {/* Order Type Tabs */}
                <div className="flex gap-2 mb-6 border-b border-cyan-500/20">
                  {(["buy", "sell"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`pb-3 px-4 font-semibold transition capitalize ${
                        orderType === type
                          ? `border-b-2 ${type === "buy" ? "border-green-400 text-green-400" : "border-red-400 text-red-400"}`
                          : "text-gray-400"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Price Type */}
                <div className="flex gap-2 mb-6">
                  {(["limit", "market"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPriceType(type)}
                      className={`px-4 py-2 rounded-lg transition capitalize text-sm ${
                        priceType === type
                          ? "bg-cyan-500 text-black"
                          : "bg-[#0a2424] text-cyan-400 border border-cyan-500/30"
                      }`}
                    >
                      {type} Order
                    </button>
                  ))}
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  {priceType === "limit" && (
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Price ({selectedMarket.quoteAsset})</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Enter price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-3 text-white placeholder-gray-600"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Amount ({selectedMarket.baseAsset})</label>
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-[#0a2424] border border-cyan-500/30 rounded-lg p-3 text-white placeholder-gray-600"
                      required
                    />
                  </div>

                  <div className="p-4 bg-[#0a2424]/50 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Total</span>
                      <span className="font-bold">
                        {total} {selectedMarket.quoteAsset}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Fee (0.1%)</span>
                      <span className="font-bold text-yellow-400">{(Number.parseFloat(total) * 0.001).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!amount || (priceType === "limit" && !price)}
                    className={`w-full font-bold py-6 ${
                      orderType === "buy"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {orderType === "buy" ? "Buy" : "Sell"} {selectedMarket.baseAsset}
                  </Button>
                </form>
              </div>
            </div>

            {/* Right: Order Book & History */}
            <div className="lg:col-span-1">
              {/* Order History */}
              <div className="ace-glow-box p-4">
                <h3 className="text-lg font-bold mb-4">Recent Orders</h3>

                {orderHistory.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-sm">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {orderHistory.map((order) => (
                      <div key={order.id} className="p-3 bg-[#0a2424]/50 rounded-lg text-sm">
                        <div className="flex justify-between mb-2">
                          <span className="font-bold capitalize">{order.type}</span>
                          <span className={order.type === "buy" ? "text-green-400" : "text-red-400"}>
                            {order.amount} {order.pair.split("/")[0]}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>@ ${order.price.toFixed(2)}</span>
                          <span className="text-cyan-400">{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}