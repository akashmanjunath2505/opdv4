import { supabase } from '../lib/supabase';

// Auth Service using Supabase Auth
// Replaces custom backend logic

export interface User {
    id: string;
    email: string;
    name: string;
    qualification: string;
    can_prescribe_allopathic: string;
    phone?: string;
    registration_number?: string;
    profile_picture_url?: string;
    hospital_name?: string;
    hospital_address?: string;
    hospital_phone?: string;
    subscription_tier: 'free' | 'premium';
    subscription_status: string;
    cases_today: number;
    total_cases: number;
    created_at: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    qualification: string;
    can_prescribe_allopathic: string;
    phone?: string;
    registration_number?: string;
    hospital_name?: string;
    hospital_address?: string;
    hospital_phone?: string;
    hospital_logo?: File | null;
}

export interface LoginData {
    email: string;
    password: string;
}

class AuthService {

    async register(data: RegisterData): Promise<{ user: User; token: string }> {
        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error('Registration failed: No user returned');

        const userId = authData.user.id;

        // 2. Create Profile in public.users table
        const profileData = {
            id: userId,
            email: data.email,
            name: data.name,
            qualification: data.qualification,
            can_prescribe_allopathic: data.can_prescribe_allopathic,
            phone: data.phone || null,
            registration_number: data.registration_number || null,
            hospital_name: data.hospital_name || null,
            hospital_address: data.hospital_address || null,
            hospital_phone: data.hospital_phone || null,
            subscription_tier: 'free',
            subscription_status: 'active',
            cases_today: 0,
            total_cases: 0,
            password_hash: 'managed_by_supabase' // Placeholder to satisfy schema constraints
        };

        const { error: profileError } = await supabase
            .from('users')
            .insert(profileData);

        if (profileError) {
            // Rollback auth user if profile creation fails? (Ideal but complex)
            console.error('Profile creation failed:', profileError);
            throw new Error('Failed to create user profile: ' + profileError.message);
        }

        // 3. Return user structure expected by app
        const user: User = {
            ...profileData,
            created_at: new Date().toISOString(),
            subscription_tier: 'free'
        };

        return { user, token: authData.session?.access_token || '' };
    }

    async login(data: LoginData): Promise<{ user: User; token: string }> {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
        });

        if (error) throw new Error(error.message);
        if (!authData.user) throw new Error('Login failed');

        // Fetch User Profile
        const user = await this.getCurrentUser();
        return { user, token: authData.session?.access_token || '' };
    }

    async getCurrentUser(): Promise<User> {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) throw new Error('Not authenticated');

        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (error || !profile) {
            throw new Error('User profile not found');
        }

        return profile as User;
    }

    async logout() {
        await supabase.auth.signOut();
        localStorage.removeItem('auth_token'); // Cleanup legacy if exists
    }

    isAuthenticated(): boolean {
        // This is synchronous check, might need async verification
        return !!localStorage.getItem('sb-zdsohbjczbdktczzzujf-auth-token');
    }
}

export const authService = new AuthService();
