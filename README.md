# OPD Platform - Complete Medical Scribe SaaS Application

AI-powered medical scribe and clinical decision support system with authentication, subscription management, real-time transcription, and prescription generation.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Initialize database (one-time)
npx tsx server/init-db.ts

# Run both frontend and backend together
npm run dev:all

# Or run separately:
# Terminal 1 - Frontend (http://localhost:5173)
npm run dev

# Terminal 2 - Backend API (http://localhost:3000)
npm run server:dev
```

### Environment Setup

Create `.env` file (see `.env.example` for template):

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# API Configuration (local development)
VITE_API_URL=http://localhost:5173
```

## 📦 Features

### Authentication & User Management
- **User Registration** - Comprehensive signup with doctor profile
- **Secure Login** - JWT-based authentication with bcrypt password hashing
- **Profile Management** - Hospital/clinic details, qualifications, registration numbers
- **Session Management** - Persistent authentication across sessions

### Subscription & Billing
- **Free Tier** - 10 cases per day, basic features
- **Premium Tier** - ₹2000/month, unlimited cases, priority support
- **Stripe Integration** - Secure payment processing
- **Usage Tracking** - Daily case limits, automatic resets
- **Upgrade Prompts** - Smart modals when limits are reached

### Clinical Features
- **Real-time Transcription** - Live doctor-patient conversation capture with speaker diarization
- **AI Clinical Notes** - Automatic SOAP note generation
- **Voice Editing** - Natural language prescription editing
- **Cloud Storage** - All data persisted to NeonDB PostgreSQL
- **PDF Export** - Professional prescription PDF generation
- **Clinical Intelligence** - Drug validation, dosage checking, and clinical protocols

## 🏗️ Architecture

### Frontend
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.0 Flash

### Backend
- **Database**: NeonDB PostgreSQL
- **API**: Express.js (local) / Vercel Serverless Functions (production)
- **ORM**: pg (node-postgres)

### Database Schema
- `users` - Doctor/clinician accounts with auth, profile, and subscription data
- `sessions` - Veda scribe sessions
- `transcripts` - Conversation history
- `prescriptions` - Clinical notes (SOAP)
- `medicines` - Prescribed medications
- `usage_logs` - Daily usage tracking per user
- `payments` - Stripe payment records
- `profile_pictures` - User avatar metadata

## 🌐 Deployment to Vercel

### 1. Set Environment Variables in Vercel

Go to your Vercel project settings and add all variables from `.env.example`:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
GEMINI_API_KEY=your_gemini_api_key
BLOB_READ_WRITE_TOKEN=vercel_blob_token
```

### 2. Deploy

```bash
# Push to GitHub (Vercel will auto-deploy)
git add .
git commit -m "Deploy with authentication and subscriptions"
git push origin main
```

Vercel will automatically:
- Build the frontend
- Deploy serverless API functions
- Connect to NeonDB
- Serve the complete application

### 3. Initialize Database (One-time)

After first deployment, run locally:

```bash
npx tsx server/init-db.ts
```

This creates all required tables in NeonDB.

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/subscription/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy webhook secret to Vercel environment variables

## 📁 Project Structure

```
opdv4/
├── api/                          # Vercel Serverless Functions
│   ├── auth/                    # Authentication endpoints
│   │   ├── register.ts
│   │   ├── login.ts
│   │   └── me.ts
│   ├── subscription/            # Stripe integration
│   │   ├── create-checkout.ts
│   │   └── webhook.ts
│   ├── sessions/                # Session management
│   ├── transcripts/             # Transcript storage
│   ├── prescriptions/           # Prescription CRUD
│   └── medicines/               # Medicine management
├── server/                       # Local Express Server
│   ├── index.ts                 # Express app
│   ├── auth.ts                  # Auth utilities (bcrypt, JWT)
│   ├── init-db.ts              # Database initialization
│   └── schema.sql              # Database schema
├── services/
│   ├── apiService.ts           # Frontend API client
│   ├── authService.ts          # Auth API calls
│   └── geminiService.ts        # AI integration
├── contexts/
│   └── AuthContext.tsx         # Global auth state
├── components/
│   ├── LoginPage.tsx           # Login interface
│   ├── RegisterPage.tsx        # Registration form
│   ├── Dashboard.tsx           # Main dashboard
│   ├── PricingPage.tsx         # Subscription pricing
│   ├── UsageLimitModal.tsx     # Usage limit modal
│   ├── AppRouter.tsx           # Auth routing
│   └── VedaSessionView.tsx     # Main session component
├── hooks/                       # React hooks
├── types.ts                     # TypeScript definitions
└── vercel.json                  # Vercel configuration
```

## 🔧 Available Scripts

- `npm run dev` - Start frontend only
- `npm run dev:all` - Start frontend + backend together
- `npm run server` - Start backend API server
- `npm run server:dev` - Start backend with auto-reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🗄️ Database Management

### Initialize Database
```bash
npx tsx server/init-db.ts
```

### Connect to Database
```bash
psql $DATABASE_URL
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Subscription
- `POST /api/subscription/create-checkout` - Create Stripe checkout session
- `POST /api/subscription/webhook` - Stripe webhook handler

### Sessions
- `POST /api/sessions` - Create session (requires auth, checks usage limits)
- `GET /api/sessions/:id` - Get session
- `PUT /api/sessions/:id` - Update session
- `GET /api/sessions` - List user's sessions

### Transcripts
- `POST /api/transcripts` - Add transcript entry
- `GET /api/transcripts/:sessionId` - Get transcripts

### Prescriptions
- `POST /api/prescriptions` - Save prescription
- `GET /api/prescriptions/:sessionId` - Get prescription

### Medicines
- `PUT /api/medicines/prescription/:prescriptionId` - Update medicines

## 🔐 Security Notes

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Database credentials stored in environment variables
- SSL/TLS encryption for database connections
- Stripe webhook signature verification
- CORS enabled for API access
- API keys never exposed to client

## 💳 Subscription Tiers

### Free Plan
- ₹0/month
- 10 cases per day
- AI-powered transcription
- Clinical note generation
- Basic prescription templates

### Premium Plan
- ₹2000/month
- Unlimited cases
- Priority support
- Cloud storage for all records
- Advanced analytics
- Advanced prescription templates

## 📄 License

Private - Internal Use Only

## 🤝 Support

For issues or questions, contact the development team.
