import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import { vercelAuthMiddleware } from '../../server/auth';
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

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const user = vercelAuthMiddleware(req);

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get user details
        const result = await pool.query(
            `SELECT id, email, name, qualification, can_prescribe_allopathic,
              phone, registration_number, profile_picture_url,
              hospital_name, hospital_address, hospital_phone,
              subscription_tier, subscription_status, subscription_start_date,
              subscription_end_date, cases_today, total_cases, last_case_date,
              created_at, last_login
       FROM users WHERE id = $1`,
            [user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error in me API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
