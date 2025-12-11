-- ACE Exchange Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE,
  wallet_address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  vip_tier VARCHAR(50) DEFAULT 'STANDARD'
);

-- User Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  balance_usdt DECIMAL(20, 6) DEFAULT 0,
  balance_usdc DECIMAL(20, 6) DEFAULT 0,
  balance_eth DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading History
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair VARCHAR(20) NOT NULL,
  type VARCHAR(10) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 2) NOT NULL,
  total DECIMAL(20, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'COMPLETED',
  tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staking Records
CREATE TABLE IF NOT EXISTS staking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  apy DECIMAL(5, 2) DEFAULT 12.5,
  earned DECIMAL(20, 8) DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- Admin Funding Log
CREATE TABLE IF NOT EXISTS admin_funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(20, 6) NOT NULL,
  asset VARCHAR(50) DEFAULT 'USDT',
  pool_id VARCHAR(255),
  tx_hash VARCHAR(255),
  status VARCHAR(20) DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VIP Program
CREATE TABLE IF NOT EXISTS vip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  tier VARCHAR(50) NOT NULL,
  discount_rate DECIMAL(3, 2) DEFAULT 0.15,
  monthly_allowance DECIMAL(20, 2) DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referral Rewards
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID NOT NULL REFERENCES users(id),
  reward_amount DECIMAL(20, 2) DEFAULT 50,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_staking_user_id ON staking(user_id);
CREATE INDEX idx_admin_funding_user ON admin_funding(user_id);
CREATE INDEX idx_vip_members_user ON vip_members(user_id);