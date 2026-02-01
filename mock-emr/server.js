
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// In-memory store for patients (history)
let patients = [];

// Endpoint for Veda to Push Data
app.post('/api/webhook', (req, res) => {
    console.log('Received Webhook Data:', req.body.resourceType || 'Unknown Type');
    const data = req.body;
    data._receivedAt = new Date().toISOString();

    // Add ID if missing (simple unique id)
    if (!data.id) data.id = `import-${Date.now()}`;

    // Unshift to add to beginning of list (newest first)
    patients.unshift(data);

    // Keep only last 50
    if (patients.length > 50) patients = patients.slice(0, 50);

    res.status(200).json({ status: 'success', message: 'Data received', id: data.id });
});

// Endpoint for Mock EMR Frontend to Poll (ALL Patients)
app.get('/api/patients', (req, res) => {
    res.json(patients);
});

// Endpoint to get specific patient/import
app.get('/api/patients/:id', (req, res) => {
    const p = patients.find(x => x.id === req.params.id);
    if (p) res.json(p);
    else res.status(404).json({ error: 'Not found' });
});

// Endpoint for backward compatibility (polls latest)
app.get('/api/latest-data', (req, res) => {
    res.json(patients.length > 0 ? patients[0] : null);
});

// Reset endpoint
app.post('/api/reset', (req, res) => {
    patients = [];
    res.json({ status: 'cleared' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Mock EMR Server running at http://localhost:${PORT}`);
    console.log(`📡 Webhook Endpoint: http://localhost:${PORT}/api/webhook`);
});
