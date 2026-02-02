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
            const { session_id, speaker, text, segment_index } = req.body;

            const result = await pool.query(
                `INSERT INTO transcripts (session_id, speaker, text, segment_index)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [session_id, speaker, text, segment_index]
            );

            return res.status(201).json(result.rows[0]);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in transcripts API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
