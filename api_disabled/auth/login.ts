import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { comparePassword, generateToken, validateEmail } from '../../server/auth';
import setCorsHeaders from '../../utils/cors';

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
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Find user
        const result = await pool.query(
            `SELECT id, email, password_hash, name, qualification, can_prescribe_allopathic,
              phone, registration_number, profile_picture_url,
              hospital_name, hospital_address, hospital_phone,
              subscription_tier, subscription_status, subscription_end_date,
              cases_today, total_cases
       FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await comparePassword(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Update last_login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email
        });

        // Remove password_hash from response
        delete user.password_hash;

        return res.status(200).json({
            message: 'Login successful',
            token,
            user
        });
    } catch (error) {
        console.error('Error in login API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
