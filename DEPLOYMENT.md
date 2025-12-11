# ACE Exchange - Deployment Guide

This guide covers deploying ACE Exchange to Vercel and configuring production environments.

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository with ACE Exchange code
- Supabase project with credentials
- Environment variables ready

## Step 1: Prepare Your Repository

### Create .env.local

Copy `.env.example` and fill in your values:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in the values:
- Supabase URL and Anon Key
- Optional: RPC URL for blockchain features

### Verify Build Locally

\`\`\`bash
npm run build
npm run start
\`\`\`

Ensure the application builds and runs without errors.

## Step 2: Push to GitHub

\`\`\`bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
\`\`\`

## Step 3: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select the repository
4. Vercel will auto-detect Next.js configuration
5. Add Environment Variables:
   - Click "Environment Variables"
   - Add each variable from your `.env.local`
6. Click "Deploy"

### Option B: Using Vercel CLI

\`\`\`bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production
vercel --prod
\`\`\`

## Step 4: Configure Environment Variables on Vercel

After deployment, configure production environment variables:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all required variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_RPC_URL (optional)
PRIVATE_KEY (if using blockchain features)
LIQUIDITY_POOL_ADDRESS (if using liquidity features)
ADMIN_WALLET (if using admin features)
\`\`\`

4. Redeploy to apply changes:
   - Go to "Deployments"
   - Click the latest deployment
   - Click "Redeploy"

## Step 5: Set Up Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records according to Vercel's instructions
4. Wait for DNS propagation (usually 24-48 hours)

## Environment Variables Reference

### Required
- **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Supabase anonymous key

### Optional (for blockchain features)
- **NEXT_PUBLIC_RPC_URL** - Ethereum RPC endpoint
- **PRIVATE_KEY** - Private key for admin operations
- **LIQUIDITY_POOL_ADDRESS** - Address of liquidity pool
- **ADMIN_WALLET** - Admin wallet address

## Verify Deployment

After deployment, test the following:

1. **Homepage loads** - https://your-domain.vercel.app
2. **Authentication works** - Try signup/login
3. **Pages load** - Test /trade, /earn, /dashboard
4. **Supabase connects** - Check browser console for errors
5. **No console errors** - Open DevTools (F12) and check console

## Troubleshooting

### Build Fails
- Check `npm run build` locally
- Ensure all environment variables are set on Vercel
- Check build logs in Vercel dashboard

### Pages Not Loading
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for errors (F12)
- Check Vercel deployment logs
- Verify environment variables are correctly set

### Supabase Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` format
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Ensure Supabase project is active
- Check CORS settings in Supabase

### Slow Performance
- Check Network tab in DevTools
- Enable Vercel Analytics to identify bottlenecks
- Consider using Image Optimization
- Check database query performance

## Production Optimization

### Enable Vercel Analytics

1. In Vercel dashboard, go to project settings
2. Click "Analytics" (beta)
3. Enable "Web Analytics"

### Configure Caching

Add caching headers in `vercel.json`:

\`\`\`json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
\`\`\`

### Database Optimization

Ensure Supabase is configured for production:
- Enable Row Level Security (RLS)
- Configure appropriate database indexes
- Set up backup policies
- Monitor database usage

## Monitoring & Maintenance

### Set Up Alerts

In Vercel dashboard:
1. Go to Settings > Monitoring
2. Enable deployment alerts
3. Configure email notifications

### Regular Maintenance

- Monitor error rates in Vercel Analytics
- Check Supabase database usage
- Review security logs
- Keep dependencies updated with `npm update`

## Rollback Deployment

If issues arise after deployment:

1. Go to Vercel project "Deployments"
2. Find the previous stable deployment
3. Click the three dots menu
4. Select "Promote to Production"

## Support & Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Create an issue in your repo

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure custom domain
3. Set up CDN for faster global delivery
4. Monitor performance metrics
5. Plan feature additions and updates