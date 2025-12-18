"use client";

import { useEffect, useState } from "react";
import { getFakeTicker, getFakeOrderbook } from "@/lib/preview/fakeMarket";
import { Button } from "@/components/ui/button";

export function TradePreview() {
  const [ticker, setTicker] = useState<any>(null);
  const [book, setBook] = useState<any>(null);

  useEffect(() => {
    function tick() {
      setTicker(getFakeTicker());
      setBook(getFakeOrderbook());
    }

    tick();
    const id = setInterval(tick, 1200);
    return () => clearInterval(id);
  }, []);

  if (!ticker || !book) return null;

  return (
    <div className="border border-gray-800 rounded-xl p-6 bg-black/60">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold">{ticker.symbol}</h3>
          <p className="text-2xl font-bold">${ticker.price}</p>
          <p
            className={`text-sm ${
              ticker.change24h >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {ticker.change24h}% (24h)
          </p>
        </div>

        <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">
          PREVIEW MODE
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="mb-2 text-gray-400">Bids</h4>
          {book.bids.map((b: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>${b.price.toFixed(2)}</span>
              <span className="text-gray-500">{b.size}</span>
            </div>
          ))}
        </div>

        <div>
          <h4 className="mb-2 text-gray-400">Asks</h4>
          {book.asks.map((a: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>${a.price.toFixed(2)}</span>
              <span className="text-gray-500">{a.size}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button disabled variant="secondary">
          Buy
        </Button>
        <Button disabled variant="secondary">
          Sell
        </Button>
      </div>
    </div>
  );
}
