import { supabase } from '../lib/supabase';

export interface Session {
    id: string;
    user_id: string;
    patient_name: string;
    patient_age: string;
    patient_sex: string;
    patient_mobile: string;
    patient_weight: string;
    patient_height: string;
    patient_bmi: string;
    hospital_name: string;
    hospital_address: string;
    hospital_phone: string;
    started_at: string;
    ended_at?: string;
    duration_seconds?: number;
    status: string;
}

export interface TranscriptEntry {
    id: string;
    session_id: string;
    speaker: string;
    text: string;
    segment_index?: number;
    created_at: string;
}

export interface Prescription {
    id: string;
    session_id: string;
    subjective: string;
    objective: string;
    assessment: string;
    differential_diagnosis: string;
    lab_results: string;
    advice: string;
    created_at: string;
    updated_at: string;
}

export interface Medicine {
    id: string;
    prescription_id: string;
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    created_at: string;
}

class ApiService {

    // Helper to get current user
    private async getUserId() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        return user.id;
    }

    // ==================== SESSION METHODS ====================

    async createSession(patientData: {
        patient_name: string;
        patient_age: string;
        patient_sex: string;
        patient_mobile: string;
        patient_weight: string;
        patient_height: string;
        patient_bmi: string;
        hospital_name: string;
        hospital_address: string;
        hospital_phone: string;
    }): Promise<{ session: Session; usage?: { cases_today: number; total_cases: number; subscription_tier: string; limit: number | null }, data?: Session }> {
        const userId = await this.getUserId();

        // 1. Check Usage (Optional, implementation complexity reduces, can rely on triggers or just ignore for beta)
        // For now, allow creation.

        const { data: session, error } = await supabase
            .from('sessions')
            .insert({
                user_id: userId,
                patient_name: patientData.patient_name,
                patient_age: patientData.patient_age,
                patient_sex: patientData.patient_sex,
                patient_mobile: patientData.patient_mobile,
                patient_weight: patientData.patient_weight,
                patient_height: patientData.patient_height,
                patient_bmi: patientData.patient_bmi,
                hospital_name: patientData.hospital_name,
                hospital_address: patientData.hospital_address,
                hospital_phone: patientData.hospital_phone,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw new Error('Failed to create session: ' + error.message);

        // Update cases count (optimistic)
        // supabase.rpc('increment_cases')... or handled by trigger

        // Return structure compatible with VedaSessionView expectations
        // If view expects session.data.id, we return { data: session }
        // BUT the interface above says { session: Session }
        // Let's return both to be safe: { data: session, session: session }
        return { session: session as Session, data: session as Session };
    }

    async getSession(sessionId: string): Promise<Session> {
        const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
        if (error) throw error;
        return data as Session;
    }

    async updateSession(sessionId: string, updates: {
        ended_at?: string;
        duration_seconds?: number;
        status?: string;
    }): Promise<Session> {
        const { data, error } = await supabase
            .from('sessions')
            .update(updates)
            .eq('id', sessionId)
            .select()
            .single();
        if (error) throw error;
        return data as Session;
    }

    // ==================== TRANSCRIPT METHODS ====================

    async addTranscript(entry: {
        session_id: string;
        speaker: string;
        text: string;
        segment_index?: number;
    }): Promise<TranscriptEntry> {
        const { data, error } = await supabase
            .from('transcripts')
            .insert(entry)
            .select()
            .single();
        if (error) throw error;
        return data as TranscriptEntry;
    }

    async getTranscripts(sessionId: string): Promise<TranscriptEntry[]> {
        const { data, error } = await supabase
            .from('transcripts')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return (data || []) as TranscriptEntry[];
    }

    // ==================== PRESCRIPTION METHODS ====================

    async savePrescription(data: {
        session_id: string;
        subjective: string;
        objective: string;
        assessment: string;
        differential_diagnosis: string;
        lab_results: string;
        advice: string;
    }): Promise<Prescription> {
        const { data: prescription, error } = await supabase
            .from('prescriptions')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return prescription as Prescription;
    }

    // ==================== MEDICINE METHODS ====================

    async updateMedicines(prescriptionId: string, medicines: Array<{
        name: string;
        dosage: string;
        frequency: string;
        route: string;
    }>): Promise<Medicine[]> {
        // 1. Delete existing medicines for this prescription
        await supabase.from('medicines').delete().eq('prescription_id', prescriptionId);

        // 2. Insert new ones
        if (medicines.length === 0) return [];

        const medsToInsert = medicines.map(m => ({
            prescription_id: prescriptionId,
            ...m
        }));

        const { data, error } = await supabase
            .from('medicines')
            .insert(medsToInsert)
            .select();

        if (error) throw error;
        return (data || []) as Medicine[];
    }
}

export const apiService = new ApiService();
