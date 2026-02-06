import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, RegisterData } from '../services/authService';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<User | null>;
    incrementCaseCount: () => Promise<void>;
    profileIncomplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const profileFlagKey = 'profile_incomplete';

    // Initial Load
    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mounted) setLoading(false);
        }, 8000);

        const initSession = async () => {
            try {
                // Get Session from LocalStorage
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                if (session) {
                    // Fetch Profile
                    const currentUser = await authService.getCurrentUser();
                    if (mounted) {
                        setUser(currentUser);
                        setProfileIncomplete(localStorage.getItem(profileFlagKey) === 'true');
                    }
                }
            } catch (err: any) {
                console.error('Session init error:', err);
                // Don't toast on page load for auth errors
            } finally {
                if (mounted) setLoading(false);
                clearTimeout(safetyTimeout);
            }
        };

        initSession();

        // Listen for Real-time Auth State Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event);

            if (event === 'SIGNED_IN' && session) {
                // Retry logic for profile fetching to handle race conditions or network blips
                let attempts = 0;
                const maxAttempts = 3;

                const fetchProfileWithRetry = async () => {
                    try {
                        const currentUser = await authService.getCurrentUser();
                        if (mounted) {
                            setUser(currentUser);
                            setLoading(false);
                            clearTimeout(safetyTimeout);
                            setProfileIncomplete(localStorage.getItem(profileFlagKey) === 'true');
                            if (!user) toast.success('Welcome back!');
                        }
                    } catch (err: any) {
                        attempts++;
                        console.error(`Profile fetch failed (Attempt ${attempts}/${maxAttempts}):`, err);

                        if (attempts < maxAttempts) {
                            setTimeout(fetchProfileWithRetry, 1500 * attempts); // Backoff: 1.5s, 3s
                        } else {
                            toast.error('Login successful, but profile could not be loaded. Please refresh.');
                            if (mounted) setLoading(false);
                        }
                    }
                };

                fetchProfileWithRetry();

            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
            } else if (event === 'INITIAL_SESSION') {
                // Handle initial session check if separate from initSession logic
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        const toastId = toast.loading('Signing in...');
        try {
            // We just trigger the login. The state change is handled by onAuthStateChange
            await authService.login({ email, password });
            toast.dismiss(toastId);
        } catch (err: any) {
            console.error('Login failed:', err);
            toast.error(err.message || 'Login failed', { id: toastId });
            throw err;
        }
    };

    const register = async (data: RegisterData) => {
        const toastId = toast.loading('Creating your account...');
        try {
            const result = await authService.register(data);
            setUser(result.user);
            localStorage.removeItem(profileFlagKey);
            setProfileIncomplete(false);
            toast.success('Account created successfully!', { id: toastId });
        } catch (err: any) {
            console.error('Registration failed:', err);
            toast.error(err.message || 'Registration failed', { id: toastId });
            throw err;
        }
    };

    const logout = () => {
        authService.logout();
        localStorage.removeItem(profileFlagKey);
        setUser(null);
        setProfileIncomplete(false);
        toast.success('Logged out successfully');
    };

    const refreshUser = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            setProfileIncomplete(localStorage.getItem(profileFlagKey) === 'true');
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        try {
            const updatedUser = await authService.updateProfile(data);
            setUser(updatedUser);
            localStorage.removeItem(profileFlagKey);
            setProfileIncomplete(false);
            toast.success('Profile updated');
            return updatedUser;
        } catch (err: any) {
            toast.error(err.message || 'Failed to update profile');
            return null;
        }
    };

    const incrementCaseCount = async () => {
        try {
            await authService.incrementCaseCount();
        } catch (err) {
            console.error('Failed to increment cases:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile, incrementCaseCount, profileIncomplete }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
