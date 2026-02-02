-- OPD Platform Database Schema - Updated with Auth & Subscription
-- PostgreSQL Database for NeonDB

-- Drop existing users table and recreate with new schema
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS profile_pictures CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS transcripts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (Enhanced with Auth & Subscription)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Profile
  name VARCHAR(255) NOT NULL,
  qualification VARCHAR(50) NOT NULL,
  can_prescribe_allopathic VARCHAR(20) NOT NULL,
  profile_picture_url TEXT,
  phone VARCHAR(20),
  registration_number VARCHAR(100),
  
  -- Hospital/Clinic Details
  hospital_name VARCHAR(255),
  hospital_address TEXT,
  hospital_phone VARCHAR(20),
  
  -- Subscription
  subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free' or 'premium'
  subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Usage Tracking
  cases_today INTEGER DEFAULT 0,
  total_cases INTEGER DEFAULT 0,
  last_case_date DATE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Sessions table (Veda scribe sessions)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  speaker VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  segment_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prescriptions table (Generated clinical notes)
CREATE TABLE prescriptions (
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
CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  route VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage logs table (Daily usage tracking)
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  date DATE NOT NULL,
  cases_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table (Stripe payment records)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  amount INTEGER NOT NULL, -- in paise (₹2000 = 200000)
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50), -- 'succeeded', 'pending', 'failed'
  subscription_period_start TIMESTAMP,
  subscription_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Profile pictures table (Image metadata)
CREATE TABLE profile_pictures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX idx_prescriptions_session_id ON prescriptions(session_id);
CREATE INDEX idx_medicines_prescription_id ON medicines(prescription_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_date ON usage_logs(date);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_profile_pictures_user_id ON profile_pictures(user_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
