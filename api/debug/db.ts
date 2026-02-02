import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as pg from 'pg';
const { Pool } = (pg as any).default || pg;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is missing');
        }

        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000 // Fail fast
        });

        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as now');
        client.release();
        await pool.end();

        res.status(200).json({ status: 'success', time: result.rows[0].now });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            stack: error.stack,
            type: typeof error
        });
    }
}
