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
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { prescriptionId } = req.query;

    try {
        if (req.method === 'PUT') {
            const { medicines } = req.body;

            // Delete existing medicines
            await pool.query('DELETE FROM medicines WHERE prescription_id = $1', [prescriptionId]);

            // Insert new medicines
            const insertPromises = medicines.map((med: any) =>
                pool.query(
                    `INSERT INTO medicines (prescription_id, name, dosage, frequency, route)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
                    [prescriptionId, med.name, med.dosage, med.frequency, med.route]
                )
            );

            const results = await Promise.all(insertPromises);
            const insertedMedicines = results.map(r => r.rows[0]);

            return res.json(insertedMedicines);
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in medicines API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
