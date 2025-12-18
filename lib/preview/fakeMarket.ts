let price = 42000;

export function getFakeTicker() {
  // small random walk
  price += (Math.random() - 0.5) * 120;

  return {
    symbol: "BTC / USDC",
    price: Number(price.toFixed(2)),
    change24h: Number(((Math.random() - 0.5) * 2).toFixed(2)),
  };
}

export function getFakeOrderbook() {
  return {
    bids: Array.from({ length: 8 }).map((_, i) => ({
      price: price - i * 15,
      size: (Math.random() * 0.5).toFixed(3),
    })),
    asks: Array.from({ length: 8 }).map((_, i) => ({
      price: price + i * 15,
      size: (Math.random() * 0.5).toFixed(3),
    })),
  };
}
