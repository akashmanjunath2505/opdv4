import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ROBUST AUTH SERVICE
// Handles Supabase Auth + Public Profile Syncing

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
            password_hash: 'managed_by_supabase'
        };

        const { error: profileError } = await supabase
            .from('users')
            .insert(profileData);

        if (profileError) {
            console.error('Profile creation failed:', profileError);
            throw new Error('Failed to create user profile: ' + profileError.message);
        }

        const user: User = {
            ...profileData,
            created_at: new Date().toISOString(),
            subscription_tier: 'free'
        };

        return { user, token: authData.session?.access_token || '' };
    }

    async login(data: LoginData): Promise<{ user: Partial<User> | null; token: string }> {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
        });

        if (error) throw new Error(error.message);
        if (!authData.user) throw new Error('Login failed');

        // Note: We do NOT fetch the full profile here to prevent race conditions.
        // The AuthContext's onAuthStateChange listener will handle fetching the full profile.

        return { user: null, token: authData.session?.access_token || '' };
    }

    async getCurrentUser(): Promise<User> {
        // 1. Get Auth User
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            throw new Error('Not authenticated');
        }

        // 2. Get Public Profile
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (error || !profile) {
            // AUTO-HEAL: If profile is missing but Auth exists, try to create basic profile
            console.warn('User profile missing, attempting to create default profile...');

            const fallbackName =
                (authUser.user_metadata && (authUser.user_metadata.full_name || authUser.user_metadata.name)) ||
                authUser.email?.split('@')[0] ||
                'Doctor (Pending Setup)';

            const defaultProfile = {
                id: authUser.id,
                email: authUser.email || '',
                name: fallbackName,
                qualification: 'MBBS',
                can_prescribe_allopathic: 'yes',
                password_hash: 'managed_by_supabase', // Required by schema
                subscription_tier: 'free',
                subscription_status: 'active'
            };

            const { error: insertError } = await supabase.from('users').insert(defaultProfile);

            if (insertError) {
                console.error('Failed to auto-create profile:', insertError);
                throw new Error('User profile not found and could not be created.');
            }

            localStorage.setItem('profile_incomplete', 'true');

            // Return the newly created profile (approximated since we just inserted)
            return {
                ...defaultProfile,
                cases_today: 0,
                total_cases: 0,
                created_at: new Date().toISOString()
            } as User;
        }

        return profile as User;
    }

    async updateProfile(data: Partial<User>): Promise<User> {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            throw new Error('Not authenticated');
        }

        const { data: updated, error } = await supabase
            .from('users')
            .update({
                name: data.name,
                qualification: data.qualification,
                can_prescribe_allopathic: data.can_prescribe_allopathic,
                phone: data.phone,
                registration_number: data.registration_number,
                hospital_name: data.hospital_name,
                hospital_address: data.hospital_address,
                hospital_phone: data.hospital_phone
            })
            .eq('id', authUser.id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return updated as User;
    }

    async logout() {
        await supabase.auth.signOut();
        localStorage.removeItem('auth_token');
    }

    async incrementCaseCount(): Promise<Partial<User>> {
        const { data, error } = await supabase.rpc('increment_user_cases', {
            user_id: (await supabase.auth.getUser()).data.user?.id
        });

        if (error) {
            console.error('Failed to increment cases:', error);
            throw error;
        }

        return data as Partial<User>;
    }

    async loginWithGoogle() {
        const envSiteUrl =
            import.meta.env.VITE_SITE_URL ||
            import.meta.env.VITE_PUBLIC_SITE_URL ||
            '';
        const origin = window.location.origin;
        const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
        const redirectTo = envSiteUrl ? envSiteUrl : origin;

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: isLocal ? origin : redirectTo
            }
        });

        if (error) throw new Error(error.message);
        return data;
    }

    isAuthenticated(): boolean {
        // We rely on Supabase state mostly, but can check local storage presence
        const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        return !!key;
    }
}

export const authService = new AuthService();
