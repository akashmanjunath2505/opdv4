import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { method, body } = req;

        if (method === 'POST') {
            const {
                user_id = '00000000-0000-0000-0000-000000000000',
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

            const result = await pool.query(
                `INSERT INTO sessions (
          user_id, patient_name, patient_age, patient_sex, patient_mobile,
          patient_weight, patient_height, patient_bmi, hospital_name,
          hospital_address, hospital_phone, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
        RETURNING *`,
                [user_id, patient_name, patient_age, patient_sex, patient_mobile,
                    patient_weight, patient_height, patient_bmi, hospital_name,
                    hospital_address, hospital_phone]
            );

            return res.status(201).json(result.rows[0]);
        }

        if (method === 'GET') {
            const result = await pool.query(
                'SELECT * FROM sessions ORDER BY started_at DESC LIMIT 50'
            );
            return res.json(result.rows);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in sessions API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
