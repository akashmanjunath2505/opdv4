// API Service for OPD Platform Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_URL;
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
    }): Promise<{ session: Session; usage?: { cases_today: number; total_cases: number; subscription_tier: string; limit: number | null } }> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${this.baseUrl}/api/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(patientData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || error.error || 'Failed to create session');
        }

        return response.json();
    }

    async getSession(sessionId: string): Promise<Session> {
        const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch session');
        }

        return response.json();
    }

    async updateSession(sessionId: string, updates: {
        ended_at?: string;
        duration_seconds?: number;
        status?: string;
    }): Promise<Session> {
        const response = await fetch(`${this.baseUrl}/api/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error('Failed to update session');
        }

        return response.json();
    }

    async getSessions(): Promise<Session[]> {
        const response = await fetch(`${this.baseUrl}/api/sessions`);

        if (!response.ok) {
            throw new Error('Failed to fetch sessions');
        }

        return response.json();
    }

    // ==================== TRANSCRIPT METHODS ====================

    async addTranscript(entry: {
        session_id: string;
        speaker: string;
        text: string;
        segment_index?: number;
    }): Promise<TranscriptEntry> {
        const response = await fetch(`${this.baseUrl}/api/transcripts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });

        if (!response.ok) {
            throw new Error('Failed to add transcript');
        }

        return response.json();
    }

    async getTranscripts(sessionId: string): Promise<TranscriptEntry[]> {
        const response = await fetch(`${this.baseUrl}/api/transcripts/${sessionId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch transcripts');
        }

        return response.json();
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
        const response = await fetch(`${this.baseUrl}/api/prescriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to save prescription');
        }

        return response.json();
    }

    async getPrescription(sessionId: string): Promise<Prescription | null> {
        const response = await fetch(`${this.baseUrl}/api/prescriptions/${sessionId}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch prescription');
        }

        return response.json();
    }

    // ==================== MEDICINE METHODS ====================

    async addMedicine(medicine: {
        prescription_id: string;
        name: string;
        dosage: string;
        frequency: string;
        route: string;
    }): Promise<Medicine> {
        const response = await fetch(`${this.baseUrl}/api/medicines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(medicine)
        });

        if (!response.ok) {
            throw new Error('Failed to add medicine');
        }

        return response.json();
    }

    async getMedicines(prescriptionId: string): Promise<Medicine[]> {
        const response = await fetch(`${this.baseUrl}/api/medicines/${prescriptionId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch medicines');
        }

        return response.json();
    }

    async deleteMedicine(medicineId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/medicines/${medicineId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete medicine');
        }
    }

    async updateMedicines(prescriptionId: string, medicines: Array<{
        name: string;
        dosage: string;
        frequency: string;
        route: string;
    }>): Promise<Medicine[]> {
        const response = await fetch(`${this.baseUrl}/api/medicines/prescription/${prescriptionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ medicines })
        });

        if (!response.ok) {
            throw new Error('Failed to update medicines');
        }

        return response.json();
    }
}

export const apiService = new ApiService();
