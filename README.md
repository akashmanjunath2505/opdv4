# OPD Platform - Complete Medical Scribe Application

AI-powered medical scribe and clinical decision support system with real-time transcription, prescription generation, and cloud database storage.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run both frontend and backend together
npm run dev:all

# Or run separately:
# Terminal 1 - Frontend (http://localhost:5173)
npm run dev

# Terminal 2 - Backend API (http://localhost:3000)
npm run server:dev
```

### Environment Setup

Create `.env.local` file:

```env
# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_anhuGPbq3J6o@ep-red-star-ahlzoa78-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# API Configuration (local development)
VITE_API_URL=http://localhost:3000

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📦 Features

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
- `users` - Doctor/clinician accounts
- `sessions` - Veda scribe sessions
- `transcripts` - Conversation history
- `prescriptions` - Clinical notes (SOAP)
- `medicines` - Prescribed medications

## 🌐 Deployment to Vercel

### 1. Set Environment Variables in Vercel

Go to your Vercel project settings and add:

```
DATABASE_URL=postgresql://neondb_owner:npg_anhuGPbq3J6o@ep-red-star-ahlzoa78-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Deploy

```bash
# Push to GitHub (Vercel will auto-deploy)
git add .
git commit -m "Complete backend integration with NeonDB"
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
npm run init-db
```

This creates all required tables in NeonDB.

## 📁 Project Structure

```
opdv4/
├── api/                          # Vercel Serverless Functions
│   ├── sessions/
│   ├── transcripts/
│   ├── prescriptions/
│   └── medicines/
├── server/                       # Local Express Server
│   ├── index.ts                 # Express app
│   ├── init-db.ts              # Database initialization
│   └── schema.sql              # Database schema
├── services/
│   ├── apiService.ts           # Frontend API client
│   └── geminiService.ts        # AI integration
├── components/
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
psql 'postgresql://neondb_owner:npg_anhuGPbq3J6o@ep-red-star-ahlzoa78-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
```

## 📝 API Endpoints

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session
- `PUT /api/sessions/:id` - Update session
- `GET /api/sessions` - List sessions

### Transcripts
- `POST /api/transcripts` - Add transcript entry
- `GET /api/transcripts/:sessionId` - Get transcripts

### Prescriptions
- `POST /api/prescriptions` - Save prescription
- `GET /api/prescriptions/:sessionId` - Get prescription

### Medicines
- `PUT /api/medicines/prescription/:prescriptionId` - Update medicines

## 🔐 Security Notes

- Database credentials are stored in environment variables
- SSL/TLS encryption for database connections
- CORS enabled for API access
- API keys never exposed to client

## 📄 License

Private - Internal Use Only

## 🤝 Support

For issues or questions, contact the development team.
