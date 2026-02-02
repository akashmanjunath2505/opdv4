import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { hashPassword, validatePassword, validateEmail, generateToken } from '../../server/auth';
import setCorsHeaders from '../../utils/cors';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            email,
            password,
            name,
            qualification,
            can_prescribe_allopathic,
            phone,
            registration_number,
            hospital_name,
            hospital_address,
            hospital_phone
        } = req.body;

        // Validation
        if (!email || !password || !name || !qualification || !can_prescribe_allopathic) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ error: passwordValidation.message });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const password_hash = await hashPassword(password);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (
        email, password_hash, name, qualification, can_prescribe_allopathic,
        phone, registration_number, hospital_name, hospital_address, hospital_phone,
        subscription_tier, subscription_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'free', 'active')
      RETURNING id, email, name, qualification, can_prescribe_allopathic, phone,
                registration_number, hospital_name, hospital_address, hospital_phone,
                subscription_tier, subscription_status, created_at`,
            [
                email.toLowerCase(),
                password_hash,
                name,
                qualification,
                can_prescribe_allopathic,
                phone || null,
                registration_number || null,
                hospital_name || null,
                hospital_address || null,
                hospital_phone || null
            ]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email
        });

        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                qualification: user.qualification,
                can_prescribe_allopathic: user.can_prescribe_allopathic,
                phone: user.phone,
                registration_number: user.registration_number,
                hospital_name: user.hospital_name,
                hospital_address: user.hospital_address,
                hospital_phone: user.hospital_phone,
                subscription_tier: user.subscription_tier,
                subscription_status: user.subscription_status,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Error in register API:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
