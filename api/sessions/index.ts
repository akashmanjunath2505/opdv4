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
    // Enable CORS
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { method, body } = req;

        if (method === 'POST') {
            // Verify authentication
            const authUser = vercelAuthMiddleware(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Get user details including subscription and usage
            const userResult = await pool.query(
                `SELECT id, subscription_tier, cases_today, last_case_date 
         FROM users WHERE id = $1`,
                [authUser.userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = userResult.rows[0];
            const today = new Date().toISOString().split('T')[0];

            // Reset daily counter if it's a new day
            let casesToday = user.cases_today;
            if (user.last_case_date !== today) {
                await pool.query(
                    'UPDATE users SET cases_today = 0, last_case_date = $1 WHERE id = $2',
                    [today, user.id]
                );
                casesToday = 0;
            }

            // Check usage limits for free tier
            if (user.subscription_tier === 'free' && casesToday >= 10) {
                return res.status(403).json({
                    error: 'Daily limit reached',
                    message: 'You have reached your daily limit of 10 cases. Upgrade to Premium for unlimited access.',
                    cases_today: casesToday,
                    limit: 10,
                    subscription_tier: 'free'
                });
            }

            const {
                patient_name,
                patient_age,
                patient_sex,
                patient_mobile,
                patient_weight,
                patient_height,
                patient_bmi,
                hospital_name,
                hospital_address,
                hospital_phone
            } = body;

            // Create session
            const sessionResult = await pool.query(
                `INSERT INTO sessions (
          user_id, patient_name, patient_age, patient_sex, patient_mobile,
          patient_weight, patient_height, patient_bmi, hospital_name,
          hospital_address, hospital_phone, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
        RETURNING *`,
                [user.id, patient_name, patient_age, patient_sex, patient_mobile,
                    patient_weight, patient_height, patient_bmi, hospital_name,
                    hospital_address, hospital_phone]
            );

            const session = sessionResult.rows[0];

            // Increment usage counters
            await pool.query(
                `UPDATE users 
         SET cases_today = cases_today + 1, 
             total_cases = total_cases + 1,
             last_case_date = $1
         WHERE id = $2`,
                [today, user.id]
            );

            // Log usage
            await pool.query(
                `INSERT INTO usage_logs (user_id, session_id, date, cases_count)
         VALUES ($1, $2, $3, 1)`,
                [user.id, session.id, today]
            );

            return res.status(201).json({
                session,
                usage: {
                    cases_today: casesToday + 1,
                    total_cases: user.total_cases + 1,
                    subscription_tier: user.subscription_tier,
                    limit: user.subscription_tier === 'free' ? 10 : null
                }
            });
        }

        if (method === 'GET') {
            // Verify authentication
            const authUser = vercelAuthMiddleware(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const result = await pool.query(
                'SELECT * FROM sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 50',
                [authUser.userId]
            );
            return res.json(result.rows);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in sessions API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
