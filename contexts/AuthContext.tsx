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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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
                    if (mounted) setUser(currentUser);
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
                            // Only toast if this was a fresh login (not just a refresh)
                            // We can't easily detect "fresh" vs "refresh" here without more state, 
                            // but we can check if user was previously null.
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

            // We don't need to manually setUser here as the event listener will do it.
            // But we should dismiss the toast when we are sure.
            // Actually, waiting for the user state to update might be better.

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
            toast.success('Account created successfully!', { id: toastId });
        } catch (err: any) {
            console.error('Registration failed:', err);
            toast.error(err.message || 'Registration failed', { id: toastId });
            throw err;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        toast.success('Logged out successfully');
    };

    const refreshUser = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
