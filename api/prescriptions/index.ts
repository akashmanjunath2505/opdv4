import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
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

    try {
        if (req.method === 'POST') {
            const {
                session_id,
                subjective,
                objective,
                assessment,
                differential_diagnosis,
                lab_results,
                advice
            } = req.body;

            // Check if prescription exists
            const existing = await pool.query(
                'SELECT id FROM prescriptions WHERE session_id = $1',
                [session_id]
            );

            let result;
            if (existing.rows.length > 0) {
                result = await pool.query(
                    `UPDATE prescriptions 
           SET subjective = $1, objective = $2, assessment = $3,
               differential_diagnosis = $4, lab_results = $5, advice = $6,
               updated_at = NOW()
           WHERE session_id = $7
           RETURNING *`,
                    [subjective, objective, assessment, differential_diagnosis, lab_results, advice, session_id]
                );
            } else {
                result = await pool.query(
                    `INSERT INTO prescriptions (
            session_id, subjective, objective, assessment,
            differential_diagnosis, lab_results, advice
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
                    [session_id, subjective, objective, assessment, differential_diagnosis, lab_results, advice]
                );
            }

            return res.status(200).json(result.rows[0]);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in prescriptions API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
