# Vercel Deployment Guide - OPD Platform

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- ✅ Vercel account (free tier works)
- ✅ GitHub repository (optional but recommended)
- ✅ NeonDB database (already configured)
- ✅ Stripe account (optional, for payments)

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/new
2. **Import Git Repository** or **Deploy from local**
3. **Configure Project**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables** (click "Environment Variables"):

```bash
# Required - Database
DATABASE_URL=postgresql://neondb_owner:npg_anhuGPbq3J6o@ep-red-star-ahlzoa78-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Required - JWT Authentication
JWT_SECRET=opd_platform_super_secret_jwt_key_2024_production_min_32_characters
JWT_EXPIRES_IN=7d

# Required - Google AI
GEMINI_API_KEY=AIzaSyDdgZbqnxfn24JlrtuVY33hlmEUGyZwfEI

# Required - API URL (will be your Vercel URL)
VITE_API_URL=https://your-app-name.vercel.app

# Optional - Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id
```

5. **Click "Deploy"**

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to configure environment variables
```

### 3. Initialize Database (One-Time)

After first deployment, run locally to create tables:

```bash
# Make sure DATABASE_URL is in your .env
npx tsx server/init-db.ts
```

**Expected Output**:
```
✅ Database initialized successfully!
Created tables:
- users
- sessions
- transcripts
- prescriptions
- medicines
- usage_logs
- payments
- profile_pictures
```

### 4. Update VITE_API_URL

After deployment, Vercel will give you a URL like `https://opdv4-xyz.vercel.app`

**Update the environment variable**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `VITE_API_URL` to your actual Vercel URL
3. Redeploy: Vercel Dashboard → Deployments → Redeploy

### 5. Test Your Deployment

Visit your Vercel URL: `https://your-app.vercel.app`

**Test Checklist**:
- [ ] Registration page loads
- [ ] Can create new account
- [ ] Can login with credentials
- [ ] Dashboard shows user data
- [ ] Can start Veda session
- [ ] Usage tracking works (10 cases/day limit)

### 6. Configure Stripe Webhook (Optional)

If using Stripe for payments:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Add Endpoint**: `https://your-app.vercel.app/api/subscription/webhook`
3. **Select Events**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy Webhook Secret** and add to Vercel environment variables
5. **Redeploy** to apply changes

## 📋 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | NeonDB connection string | `postgresql://...` |
| `JWT_SECRET` | Secret key for JWT tokens | Min 32 characters |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `GEMINI_API_KEY` | Google AI API key | `AIzaSy...` |
| `VITE_API_URL` | Your Vercel app URL | `https://app.vercel.app` |

### Optional Variables (Stripe)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_...) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PREMIUM_PRICE_ID` | Premium plan price ID |

## 🔍 Troubleshooting

### Build Fails

**Error**: `Module not found`
```bash
# Solution: Install dependencies
npm install
npm run build
```

**Error**: `TypeScript errors`
```bash
# Check for TypeScript errors locally
npm run build
```

### Database Connection Fails

**Error**: `Connection refused` or `SSL required`
```bash
# Verify DATABASE_URL includes ?sslmode=require
# Check NeonDB is accessible from Vercel
```

### API Routes Return 404

**Error**: `/api/auth/login` returns 404
```bash
# Verify vercel.json has correct rewrites
# Check API files are in /api directory
# Ensure serverless functions are deployed
```

### Authentication Not Working

**Error**: `Invalid token` or `Unauthorized`
```bash
# Verify JWT_SECRET is set in Vercel
# Check VITE_API_URL matches your deployment URL
# Clear browser localStorage and try again
```

## 🎯 Post-Deployment Checklist

- [ ] Application accessible at Vercel URL
- [ ] Registration creates new users
- [ ] Login returns JWT token
- [ ] Dashboard displays user data
- [ ] Sessions can be created
- [ ] Usage limits enforced (10/day for free)
- [ ] Database persists data
- [ ] No console errors

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] DATABASE_URL uses SSL (`?sslmode=require`)
- [ ] Stripe keys are production keys (not test)
- [ ] Environment variables are in Vercel (not in code)
- [ ] CORS configured for production domain

## 📊 Monitoring

### Vercel Dashboard
- **Deployments**: View deployment history
- **Analytics**: Track page views, performance
- **Logs**: View runtime logs and errors
- **Environment Variables**: Manage secrets

### Database Monitoring
- **NeonDB Console**: https://console.neon.tech
- Monitor connections, queries, storage

## 🚨 Rollback

If deployment has issues:

1. **Vercel Dashboard** → **Deployments**
2. Find previous working deployment
3. Click **"..."** → **"Promote to Production"**

## 📞 Support

**Documentation**:
- `README.md` - Main documentation
- `BACKEND_INTEGRATION_GUIDE.md` - API reference
- `API_QUICK_REFERENCE.md` - Quick lookup

**Resources**:
- Vercel Docs: https://vercel.com/docs
- NeonDB Docs: https://neon.tech/docs
- Stripe Docs: https://stripe.com/docs

## ✅ Success!

Once deployed, your OPD Platform will be live at:
```
https://your-app-name.vercel.app
```

Users can:
- ✅ Register for free accounts
- ✅ Login and access dashboard
- ✅ Create up to 10 sessions/day (free tier)
- ✅ Upgrade to Premium (₹2000/month) for unlimited access
- ✅ Use AI-powered medical transcription
- ✅ Generate clinical notes and prescriptions

**🎉 Your application is production-ready!**
