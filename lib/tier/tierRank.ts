const order = ["Bronze", "Silver", "Gold", "Diamond", "ACE"];

export function tierGte(a: string, b: string) {
  return order.indexOf(a) >= order.indexOf(b);
}
