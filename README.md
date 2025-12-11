# ACE Exchange - Next Generation Crypto Trading Platform

A feature-rich cryptocurrency exchange built with Next.js, Supabase, and Web3 integration.

## Features

### Trading
- **Spot Trading**: Buy and sell cryptocurrencies instantly
- **Futures Trading**: Trade with up to 200x leverage
- **Market Data**: Real-time price updates and charts

### Earning & Rewards
- **Staking**: Earn APY on multiple cryptocurrencies
- **Lending Pools**: High-yield lending opportunities
- **Referral Program**: Earn up to 5% commission on referrals
- **VIP Program**: 4-tier membership with exclusive benefits

### Advanced Features
- **Copy Trading**: Automatically copy trades from top traders
- **Trading Bots**: AI-powered automated trading
- **Launchpad**: Participate in token launches
- **Admin Panel**: Comprehensive user and transaction management

### Security
- **Supabase Authentication**: Secure email/password authentication
- **Web3 Integration**: MetaMask wallet connection
- **Ethereum Mainnet**: Real blockchain transactions
- **Row Level Security**: Database-level data protection

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), API Routes
- **Blockchain**: Ethers.js, Web3 Integration
- **Charts**: Recharts, Chart.js
- **UI Components**: Radix UI, shadcn/ui

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- MetaMask wallet (for Web3 features)

### Environment Variables

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_RPC_URL=your_ethereum_rpc_url
PRIVATE_KEY=your_private_key
LIQUIDITY_POOL_ADDRESS=your_liquidity_pool_address
ADMIN_WALLET=your_admin_wallet_address
\`\`\`

### Installation

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
ACE-Exchange/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Landing page
│   ├── (auth)/
│   │   ├── login/           # Login page
│   │   ├── signup/          # Registration page
│   ├── (dashboard)/
│   │   ├── dashboard/       # User dashboard
│   │   ├── trade/           # Spot trading interface
│   │   ├── earn/            # Staking and lending
│   │   ├── vip/             # VIP membership tiers
│   │   ├── rewards/         # Referral rewards
│   ├── (admin)/
│   │   ├── admin/           # Admin dashboard
│   │   ├── users/           # User management
│   │   ├── transactions/    # Transaction history
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── trade/           # Trading endpoints
│   │   ├── admin/           # Admin endpoints
│
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── header.tsx           # Navigation header
│   ├── footer.tsx           # Footer component
│   ├── trading-charts.tsx   # Chart components
│
├── contexts/
│   ├── auth-context.tsx     # Authentication context
│   ├── wallet-context.tsx   # Wallet context
│
├── lib/
│   ├── supabaseClient.ts    # Supabase client
│   ├── auth.ts              # Auth utilities
│   ├── wallet.ts            # Wallet utilities
│   ├── database.ts          # Database queries
│
└── public/                  # Static assets
\`\`\`

## Pages Overview

### Public Pages
- `/` - Landing page with features and CTAs
- `/login` - User login
- `/signup` - User registration
- `/markets` - Live market data

### Protected Pages (Authentication Required)
- `/dashboard` - User portfolio and overview
- `/trade` - Spot trading interface
- `/earn` - Staking and lending products
- `/staking` - Detailed staking interface
- `/vip` - VIP tier information
- `/rewards` - Referral rewards dashboard
- `/profile` - User profile settings

### Admin Pages (Admin Access Required)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/transactions` - Transaction history
- `/admin/fund-user` - Fund user accounts

## Database Schema

The platform uses Supabase with the following main tables:

- `users` - User accounts and profiles
- `wallets` - User Ethereum wallets
- `trades` - Trading history
- `staking_positions` - Active staking positions
- `referrals` - Referral program data
- `admin_funding` - Admin funding transactions
- `transactions` - Transaction logs

## API Routes

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Trading
- `POST /api/trade/place-order` - Place trading order
- `GET /api/markets/price` - Get current prices

### Admin
- `POST /api/admin/fund-user` - Fund user account
- `GET /api/admin/users` - Get all users
- `GET /api/admin/transactions` - Get transactions

## Deployment

### Deploy to Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Environment Setup on Vercel

1. Go to Vercel Project Settings
2. Add environment variables from your `.env.local`
3. Deploy

## Security Considerations

- All sensitive keys stored in environment variables
- Supabase Row Level Security (RLS) policies enabled
- API routes validate authentication
- Input validation on all forms
- CSRF protection enabled
- XSS protection via React

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@aceexchange.com or open an issue on GitHub.

## Roadmap

- [ ] Copy trading implementation
- [ ] Advanced trading bots
- [ ] Mobile app (React Native)
- [ ] Options trading
- [ ] Margin trading
- [ ] Multi-chain support
- [ ] DAO governance
- [ ] NFT marketplace

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- UI Components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide Icons](https://lucide.dev/)
- Charts with [Recharts](https://recharts.org/)
\`\`\`

```tsx file="" isHidden