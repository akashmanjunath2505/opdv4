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

    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            return res.json(result.rows[0]);
        }

        if (req.method === 'PUT') {
            const { ended_at, duration_seconds, status } = req.body;

            const result = await pool.query(
                `UPDATE sessions 
         SET ended_at = $1, duration_seconds = $2, status = $3
         WHERE id = $4
         RETURNING *`,
                [ended_at, duration_seconds, status, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            return res.json(result.rows[0]);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in session API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
