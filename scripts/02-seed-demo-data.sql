-- Seed demo users
INSERT INTO users (email, username, wallet_address, verified, vip_tier)
VALUES
  ('demo@example.com', 'demouser', '0x1234567890123456789012345678901234567890', true, 'GOLD'),
  ('trader@example.com', 'traderuser', '0x0987654321098765432109876543210987654321', true, 'SILVER'),
  ('hodler@example.com', 'hodleruser', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', true, 'STANDARD')
ON CONFLICT DO NOTHING;

-- Seed demo wallets
INSERT INTO wallets (user_id, wallet_address, balance_usdt, balance_usdc, balance_eth)
SELECT id, wallet_address, 10000, 5000, 2.5 FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

-- Seed demo trades
INSERT INTO trades (user_id, pair, type, amount, price, total, status, created_at)
SELECT id, 'BTC/USDT', 'BUY', 0.5, 45000, 22500, 'COMPLETED', NOW() FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

-- Seed staking records
INSERT INTO staking (user_id, asset, amount, apy, earned)
SELECT id, 'ETH', 5.0, 3.5, 0.175 FROM users WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;