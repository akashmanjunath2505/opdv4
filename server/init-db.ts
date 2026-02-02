import { config } from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config(); // Loads .env by default

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

console.log('🔗 Using database URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initializeDatabase() {
    try {
        console.log('🔌 Connecting to NeonDB...');

        const client = await pool.connect();
        console.log('✅ Connected to database');

        // Read and execute schema file
        const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

        console.log('📝 Creating tables...');
        await client.query(schemaSQL);

        console.log('✅ Database schema initialized successfully!');
        console.log('📊 Tables created:');
        console.log('   - users');
        console.log('   - sessions');
        console.log('   - transcripts');
        console.log('   - prescriptions');
        console.log('   - medicines');

        client.release();
        await pool.end();

        console.log('✅ Database initialization complete!');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase();
