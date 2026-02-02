import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;
const ALLOWED_ORIGINS = [
    'https://opd.aivanahealth.com',
    'https://opdv4.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
];

// --- HELPER FUNCTIONS (INLINED) ---
function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
    const origin = req.headers.origin as string;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://opd.aivanahealth.com');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
    return { valid: true };
}

function generateToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// --- DATABASE CONNECTION ---
let pool: Pool;
function getDb() {
    if (!pool) {
        if (!process.env.DATABASE_URL) {
            console.error('CRITICAL: DATABASE_URL is missing!');
            throw new Error('DATABASE_URL environment variable is missing');
        }
        try {
            pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
            console.log('Database pool initialized');
        } catch (err) {
            console.error('Database initialization failed:', err);
            throw err;
        }
    }
    return pool;
}

// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Set CORS immediately
    setCorsHeaders(req, res);

    // 2. Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Enforce POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            email, password, name, qualification, can_prescribe_allopathic,
            phone, registration_number, hospital_name, hospital_address, hospital_phone
        } = req.body;

        // 4. Validate Input
        if (!email || !password || !name || !qualification) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

        const pwdCheck = validatePassword(password);
        if (!pwdCheck.valid) return res.status(400).json({ error: pwdCheck.message });

        // 5. Connect DB
        const db = getDb();

        // 6. Check Existing User
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // 7. Create User
        const hashedPassword = await hashPassword(password);

        const result = await db.query(
            `INSERT INTO users (
                email, password_hash, name, qualification, can_prescribe_allopathic,
                phone, registration_number, hospital_name, hospital_address, hospital_phone,
                subscription_tier, subscription_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'free', 'active')
            RETURNING id, email, name, qualification, can_prescribe_allopathic, phone,
                      registration_number, hospital_name, hospital_address, hospital_phone,
                      subscription_tier, subscription_status, created_at`,
            [
                email.toLowerCase(), hashedPassword, name, qualification, can_prescribe_allopathic,
                phone || null, registration_number || null, hospital_name || null,
                hospital_address || null, hospital_phone || null
            ]
        );

        const user = result.rows[0];
        const token = generateToken({ userId: user.id, email: user.email });

        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user
        });

    } catch (error: any) {
        console.error('Register API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message || String(error)
        });
    }
}
