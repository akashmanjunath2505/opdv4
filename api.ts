import { supabase } from './lib/supabase';

// Supabase-based API Service
// Replaces the Axios backend client

const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
};

// We keep the structure to minimize refactoring in components
const api = {
    // Legacy axios compatibility stub (if any component uses api.get directly)
    // Ideally components should use exported *API objects
    get: async () => ({ data: {} }),
    post: async () => ({ data: {} }),
};

export default api;

export const authAPI = {
    // Handled by authService mostly
};

export const userAPI = {
    getProfile: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error) throw error;
        return { data };
    },
    updateProfile: async (updates: any) => {
        const userId = await getUserId();
        const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
        if (error) throw error;
        return { data };
    },
    getDoctorProfile: async () => {
        return userAPI.getProfile();
    },
    // ...
};

export const subscriptionAPI = {
    // For now, we mock subscription API on top of Supabase or use Stripe integration via frontend? 
    // User deleted backend scripts, so Stripe Checkout via backend is GONE.
    // We will return Free Tier for now.
    getPlans: async () => ({ data: [] }),
    getCurrent: async () => ({ data: { status: 'active', tier: 'free' } }),
    getUsage: async () => {
        const userId = await getUserId();
        const { data } = await supabase.from('users').select('cases_today, subscription_tier').eq('id', userId).single();
        // Default limit
        const limit = data.subscription_tier === 'premium' ? 9999 : 10;
        return { data: { cases_today: data.cases_today, limit } };
    }
    // createCheckoutSession -> Cannot work without backend (Stripe Secret Key). 
    // Maybe user handles via Supabase Functions?
};

export const casesAPI = {
    create: async (data: any) => {
        const userId = await getUserId();
        // Map frontend fields to DB schema
        const { data: session, error } = await supabase
            .from('sessions')
            .insert({
                user_id: userId,
                patient_name: data.patientName || data.patient_name,
                patient_age: data.patientAge || data.patient_age,
                patient_sex: data.patientSex || data.patient_sex,
                patient_mobile: data.patientMobile || data.patient_mobile,
                // Add validation or optional fields handling
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;
        return { data: session };
    },
    list: async () => {
        const userId = await getUserId();
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId)
            .order('started_at', { ascending: false });
        if (error) throw error;
        return { data: data || [] };
    },
    get: async (id: string) => {
        const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
        if (error) throw error;
        return { data };
    },
    update: async (id: string, updates: any) => {
        const { data, error } = await supabase.from('sessions').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return { data };
    }
};

// Export specialized APIs for Transcripts/Prescriptions as they might be called
export const transcriptAPI = {
    add: async (data: any) => {
        const { data: transcript, error } = await supabase.from('transcripts').insert(data).select().single();
        if (error) throw error;
        return { data: transcript };
    },
    list: async (sessionId: string) => {
        const { data, error } = await supabase.from('transcripts').select('*').eq('session_id', sessionId).order('created_at');
        if (error) throw error;
        return { data: data || [] };
    }
};
