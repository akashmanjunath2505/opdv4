# NeonDB Backend Integration Guide for Company Website

## Overview

This document provides complete instructions for connecting a company website (marketing site, landing page, etc.) to the OPD Platform backend powered by NeonDB PostgreSQL. This enables user authentication, subscription management, and payment processing from your main website.

## Database Connection

### NeonDB Details

**Database Type**: PostgreSQL (Serverless)  
**Connection String**:
```
postgresql://neondb_owner:npg_anhuGPbq3J6o@ep-red-star-ahlzoa78-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Connection Configuration**:
```javascript
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
```

### Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_anhuGPbq3J6o@ep-red-star-ahlzoa78-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Authentication
JWT_SECRET=opd_platform_super_secret_jwt_key_2024_production_min_32_characters
JWT_EXPIRES_IN=7d

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id

# API URL
API_URL=https://your-app.vercel.app
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    qualification VARCHAR(50),
    registration_number VARCHAR(100),
    phone VARCHAR(20),
    can_prescribe_allopathic VARCHAR(10),
    hospital_name VARCHAR(255),
    hospital_phone VARCHAR(20),
    hospital_address TEXT,
    profile_picture_url TEXT,
    
    -- Subscription fields
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Usage tracking
    cases_today INTEGER DEFAULT 0,
    total_cases INTEGER DEFAULT 0,
    last_case_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Usage Logs Table

```sql
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID,
    logged_at TIMESTAMP DEFAULT NOW()
);
```

### Payments Table

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    stripe_payment_id VARCHAR(255),
    amount INTEGER,
    currency VARCHAR(10),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Base URL

**Local Development**: `http://localhost:3000`  
**Production**: `https://opd.aivanahealth.com`

All API endpoints are prefixed with `/api`

---

## Authentication Endpoints

### 1. Register New User

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "name": "Dr. John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "qualification": "MBBS",
  "registration_number": "MH123456",
  "phone": "9876543210",
  "can_prescribe_allopathic": "yes",
  "hospital_name": "City Hospital",
  "hospital_phone": "02212345678",
  "hospital_address": "123 Main Street, Mumbai"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid-here",
    "name": "Dr. John Doe",
    "email": "john@example.com",
    "qualification": "MBBS",
    "subscription_tier": "free",
    "subscription_status": "active",
    "cases_today": 0,
    "total_cases": 0,
    "created_at": "2024-02-02T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields or user already exists
- `500 Internal Server Error`: Server error

**Example Code**:
```javascript
async function registerUser(userData) {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const { user, token } = await response.json();
  
  // Store token in localStorage or cookie
  localStorage.setItem('auth_token', token);
  
  return user;
}
```

---

### 2. Login User

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid-here",
    "name": "Dr. John Doe",
    "email": "john@example.com",
    "qualification": "MBBS",
    "hospital_name": "City Hospital",
    "subscription_tier": "free",
    "subscription_status": "active",
    "cases_today": 5,
    "total_cases": 42
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid email or password
- `400 Bad Request`: Missing email or password

**Example Code**:
```javascript
async function loginUser(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const { user, token } = await response.json();
  localStorage.setItem('auth_token', token);
  
  return user;
}
```

---

### 3. Get Current User

**Endpoint**: `GET /api/auth/me`

**Headers Required**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "id": "uuid-here",
  "name": "Dr. John Doe",
  "email": "john@example.com",
  "qualification": "MBBS",
  "registration_number": "MH123456",
  "phone": "9876543210",
  "hospital_name": "City Hospital",
  "hospital_phone": "02212345678",
  "hospital_address": "123 Main Street, Mumbai",
  "subscription_tier": "free",
  "subscription_status": "active",
  "cases_today": 5,
  "total_cases": 42,
  "last_case_date": "2024-02-02",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: No token or invalid token
- `404 Not Found`: User not found

**Example Code**:
```javascript
async function getCurrentUser() {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  
  return await response.json();
}
```

---

## Subscription & Payment Endpoints

### 4. Create Stripe Checkout Session

**Endpoint**: `POST /api/subscription/create-checkout`

**Headers Required**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**: None required

**Response** (200 OK):
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6...",
  "url": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6..."
}
```

**Usage Flow**:
1. User clicks "Upgrade to Premium" on website
2. Call this endpoint to create Stripe checkout session
3. Redirect user to the returned `url`
4. Stripe handles payment
5. Webhook updates user's subscription in database
6. User is redirected back to your success URL

**Example Code**:
```javascript
async function createCheckoutSession() {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('http://localhost:3000/api/subscription/create-checkout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const { url } = await response.json();
  
  // Redirect to Stripe Checkout
  window.location.href = url;
}
```

---

### 5. Stripe Webhook Handler

**Endpoint**: `POST /api/subscription/webhook`

**Purpose**: Receives events from Stripe when subscriptions change

**Events Handled**:
- `checkout.session.completed` - User completed payment, upgrade to Premium
- `customer.subscription.updated` - Subscription status changed
- `customer.subscription.deleted` - Subscription canceled, downgrade to Free
- `invoice.payment_succeeded` - Recurring payment successful
- `invoice.payment_failed` - Payment failed, mark as past_due

**Configuration**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/subscription/webhook`
3. Select events listed above
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

**Note**: This endpoint is called by Stripe, not your website directly.

---

## Session Management Endpoints

### 6. Create Session (with Usage Tracking)

**Endpoint**: `POST /api/sessions`

**Headers Required**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "patient_name": "Jane Smith",
  "patient_age": "35",
  "patient_sex": "Female",
  "patient_mobile": "9876543210",
  "patient_weight": "65",
  "patient_height": "165",
  "patient_bmi": "23.9",
  "hospital_name": "City Hospital",
  "hospital_address": "123 Main Street",
  "hospital_phone": "02212345678"
}
```

**Response** (201 Created):
```json
{
  "session": {
    "id": "uuid-here",
    "user_id": "user-uuid",
    "patient_name": "Jane Smith",
    "status": "active",
    "started_at": "2024-02-02T10:30:00Z"
  },
  "usage": {
    "cases_today": 6,
    "total_cases": 43,
    "subscription_tier": "free",
    "limit": 10
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Daily limit reached (free tier)
  ```json
  {
    "error": "Daily limit reached",
    "message": "You have reached your daily limit of 10 cases. Upgrade to Premium for unlimited access.",
    "cases_today": 10,
    "limit": 10,
    "subscription_tier": "free"
  }
  ```

---

## Complete Integration Example

### HTML/JavaScript Website Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>OPD Platform - Login</title>
</head>
<body>
    <div id="login-form">
        <h2>Login to OPD Platform</h2>
        <input type="email" id="email" placeholder="Email">
        <input type="password" id="password" placeholder="Password">
        <button onclick="login()">Sign In</button>
        <a href="/register">Create Account</a>
    </div>

    <script>
        const API_URL = 'http://localhost:3000';

        async function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    const error = await response.json();
                    alert(error.error);
                    return;
                }

                const { user, token } = await response.json();
                
                // Store token
                localStorage.setItem('auth_token', token);
                
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        }

        // Check if user is already logged in
        async function checkAuth() {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const user = await response.json();
                    console.log('Logged in as:', user.name);
                    // Redirect to dashboard if already logged in
                    window.location.href = '/dashboard';
                }
            } catch (error) {
                // Token invalid, clear it
                localStorage.removeItem('auth_token');
            }
        }

        checkAuth();
    </script>
</body>
</html>
```

### React/Next.js Integration

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
  qualification: string;
  // ... other fields
}) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Not authenticated');
  }

  return await response.json();
}

export async function createCheckoutSession(token: string) {
  const response = await fetch(`${API_URL}/api/subscription/create-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
}
```

```typescript
// components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { loginUser } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const { user, token } = await loginUser(email, password);
      
      // Store token (use httpOnly cookies in production)
      localStorage.setItem('auth_token', token);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit">Sign In</button>
    </form>
  );
}
```

---

## Subscription Tiers

### Free Tier
- **Price**: ₹0/month
- **Limits**: 10 cases per day
- **Features**:
  - AI-powered transcription
  - Clinical note generation
  - Basic prescription templates

### Premium Tier
- **Price**: ₹2000/month
- **Limits**: Unlimited cases
- **Features**:
  - All Free features
  - Unlimited cases per day
  - Priority support
  - Cloud storage for all records
  - Advanced analytics
  - Advanced prescription templates

---

## Security Best Practices

### 1. Token Storage
**Development**: `localStorage`
**Production**: httpOnly cookies (more secure)

```javascript
// Set cookie (server-side)
res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`);
```

### 2. CORS Configuration
```javascript
app.use(cors({
  origin: ['https://your-website.com', 'https://app.your-website.com'],
  credentials: true
}));
```

### 3. Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

### 4. Rate Limiting
Implement rate limiting on authentication endpoints:
```javascript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per window
});

app.use('/api/auth/login', authLimiter);
```

---

## Testing the Integration

### 1. Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test User",
    "email": "test@example.com",
    "password": "Test@123",
    "qualification": "MBBS",
    "phone": "9876543210",
    "hospital_name": "Test Hospital"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

### 3. Test Get Current User
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure backend has CORS enabled for your website domain
- Check that credentials are included in requests

**2. 401 Unauthorized**
- Verify JWT token is being sent in Authorization header
- Check token hasn't expired (7 days default)
- Ensure JWT_SECRET matches between environments

**3. Database Connection Errors**
- Verify DATABASE_URL is correct
- Check NeonDB is accessible from your server
- Ensure SSL is enabled in connection config

**4. Stripe Webhook Not Working**
- Verify webhook URL is publicly accessible
- Check STRIPE_WEBHOOK_SECRET is correct
- Test webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/subscription/webhook`

---

## Support & Resources

**Database Console**: https://console.neon.tech  
**Stripe Dashboard**: https://dashboard.stripe.com  
**API Documentation**: See README.md in project root

For additional help, contact the development team or refer to the main application codebase at `/home/akash/Life/Company/Code/opdv4`.
