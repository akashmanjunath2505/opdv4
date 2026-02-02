import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local' });

const { Pool } = pg;
const app = express();
const PORT = 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'OPD Platform API is running' });
});

// ==================== SESSION ENDPOINTS ====================

// Create new session
app.post('/api/sessions', async (req: Request, res: Response) => {
    try {
        const {
            user_id = '00000000-0000-0000-0000-000000000000', // Default user for now
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
        } = req.body;

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

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Get session by ID
app.get('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

// Update session
app.put('/api/sessions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
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

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: 'Failed to update session' });
    }
});

// Get all sessions
app.get('/api/sessions', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM sessions ORDER BY started_at DESC LIMIT 50'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// ==================== TRANSCRIPT ENDPOINTS ====================

// Add transcript entry
app.post('/api/transcripts', async (req: Request, res: Response) => {
    try {
        const { session_id, speaker, text, segment_index } = req.body;

        const result = await pool.query(
            `INSERT INTO transcripts (session_id, speaker, text, segment_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [session_id, speaker, text, segment_index]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding transcript:', error);
        res.status(500).json({ error: 'Failed to add transcript' });
    }
});

// Get transcripts for session
app.get('/api/transcripts/:sessionId', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const result = await pool.query(
            'SELECT * FROM transcripts WHERE session_id = $1 ORDER BY created_at ASC',
            [sessionId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transcripts:', error);
        res.status(500).json({ error: 'Failed to fetch transcripts' });
    }
});

// ==================== PRESCRIPTION ENDPOINTS ====================

// Create or update prescription
app.post('/api/prescriptions', async (req: Request, res: Response) => {
    try {
        const {
            session_id,
            subjective,
            objective,
            assessment,
            differential_diagnosis,
            lab_results,
            advice
        } = req.body;

        // Check if prescription exists for this session
        const existing = await pool.query(
            'SELECT id FROM prescriptions WHERE session_id = $1',
            [session_id]
        );

        let result;
        if (existing.rows.length > 0) {
            // Update existing
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
            // Create new
            result = await pool.query(
                `INSERT INTO prescriptions (
          session_id, subjective, objective, assessment,
          differential_diagnosis, lab_results, advice
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
                [session_id, subjective, objective, assessment, differential_diagnosis, lab_results, advice]
            );
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error saving prescription:', error);
        res.status(500).json({ error: 'Failed to save prescription' });
    }
});

// Get prescription for session
app.get('/api/prescriptions/:sessionId', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const result = await pool.query(
            'SELECT * FROM prescriptions WHERE session_id = $1',
            [sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({ error: 'Failed to fetch prescription' });
    }
});

// ==================== MEDICINE ENDPOINTS ====================

// Add medicine
app.post('/api/medicines', async (req: Request, res: Response) => {
    try {
        const { prescription_id, name, dosage, frequency, route } = req.body;

        const result = await pool.query(
            `INSERT INTO medicines (prescription_id, name, dosage, frequency, route)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [prescription_id, name, dosage, frequency, route]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding medicine:', error);
        res.status(500).json({ error: 'Failed to add medicine' });
    }
});

// Get medicines for prescription
app.get('/api/medicines/:prescriptionId', async (req: Request, res: Response) => {
    try {
        const { prescriptionId } = req.params;
        const result = await pool.query(
            'SELECT * FROM medicines WHERE prescription_id = $1 ORDER BY created_at ASC',
            [prescriptionId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching medicines:', error);
        res.status(500).json({ error: 'Failed to fetch medicines' });
    }
});

// Delete medicine
app.delete('/api/medicines/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM medicines WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Medicine not found' });
        }

        res.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        console.error('Error deleting medicine:', error);
        res.status(500).json({ error: 'Failed to delete medicine' });
    }
});

// Update all medicines for a prescription (bulk update)
app.put('/api/medicines/prescription/:prescriptionId', async (req: Request, res: Response) => {
    try {
        const { prescriptionId } = req.params;
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

        res.json(insertedMedicines);
    } catch (error) {
        console.error('Error updating medicines:', error);
        res.status(500).json({ error: 'Failed to update medicines' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ OPD Platform API Server running on http://localhost:${PORT}`);
    console.log(`📊 Database connected to NeonDB`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await pool.end();
    process.exit(0);
});
