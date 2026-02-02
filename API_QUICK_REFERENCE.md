# Backend API Quick Reference

## Base URL
- **Local**: `http://localhost:3000`
- **Production**: `https://your-app.vercel.app`

## Database Connection
```
postgresql://neondb_owner:npg_anhuGPbq3J6o@ep-red-star-ahlzoa78-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Authentication Endpoints

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Dr. John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "qualification": "MBBS",
  "phone": "9876543210",
  "hospital_name": "City Hospital"
}

Response: { user, token }
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: { user, token }
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: { user object }
```

## Subscription Endpoints

### Create Checkout Session
```http
POST /api/subscription/create-checkout
Authorization: Bearer <token>

Response: { sessionId, url }
```

### Webhook (Stripe calls this)
```http
POST /api/subscription/webhook
Stripe-Signature: <signature>

Events: checkout.session.completed, customer.subscription.*
```

## Session Endpoints

### Create Session
```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_name": "Jane Smith",
  "patient_age": "35",
  "patient_sex": "Female"
}

Response: { session, usage }
```

## Subscription Tiers

| Feature | Free | Premium |
|---------|------|---------|
| Price | ₹0/month | ₹2000/month |
| Daily Cases | 10 | Unlimited |
| Support | Basic | Priority |

## JWT Token Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (daily limit reached)
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

## Quick Test Commands

### Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Test","email":"test@example.com","password":"Test@123","qualification":"MBBS","phone":"9876543210","hospital_name":"Test Hospital"}'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

### Test Get User
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Database Tables

### users
- `id` (UUID, PK)
- `name`, `email`, `password_hash`
- `qualification`, `registration_number`, `phone`
- `hospital_name`, `hospital_phone`, `hospital_address`
- `subscription_tier`, `subscription_status`
- `stripe_customer_id`, `stripe_subscription_id`
- `cases_today`, `total_cases`, `last_case_date`

### usage_logs
- `id` (UUID, PK)
- `user_id` (FK → users)
- `session_id`
- `logged_at`

### payments
- `id` (UUID, PK)
- `user_id` (FK → users)
- `stripe_payment_id`
- `amount`, `currency`, `status`

## Frontend Integration Example

```javascript
// Login
const { user, token } = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
}).then(r => r.json());

localStorage.setItem('auth_token', token);

// Get current user
const user = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Create checkout
const { url } = await fetch('/api/subscription/create-checkout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

window.location.href = url; // Redirect to Stripe
```

## Support
For detailed documentation, see `BACKEND_INTEGRATION_GUIDE.md`
