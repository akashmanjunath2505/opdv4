-- OPD Platform Database Schema
-- PostgreSQL Database for NeonDB

-- Users table (Doctors/Clinicians)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  qualification VARCHAR(50) NOT NULL,
  can_prescribe_allopathic VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (Veda scribe sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  patient_name VARCHAR(255),
  patient_age VARCHAR(50),
  patient_sex VARCHAR(20),
  patient_mobile VARCHAR(50),
  patient_weight VARCHAR(50),
  patient_height VARCHAR(50),
  patient_bmi VARCHAR(50),
  hospital_name VARCHAR(255),
  hospital_address VARCHAR(255),
  hospital_phone VARCHAR(50),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  status VARCHAR(50) DEFAULT 'active'
);

-- Transcripts table (Conversation history)
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  speaker VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  segment_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions table (Generated clinical notes)
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  differential_diagnosis TEXT,
  lab_results TEXT,
  advice TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Medicines table (Prescribed medications)
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  route VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_session_id ON prescriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_medicines_prescription_id ON medicines(prescription_id);

-- Insert a default user for testing
INSERT INTO users (email, name, qualification, can_prescribe_allopathic)
VALUES ('doctor@example.com', 'Dr. Sharma', 'MBBS', 'yes')
ON CONFLICT (email) DO NOTHING;
