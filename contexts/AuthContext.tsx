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
                // Determine if we need to fetch profile (avoid double fetch if initSession did it)
                // But simplified: just fetch it.
                try {
                    const currentUser = await authService.getCurrentUser();
                    if (mounted) {
                        setUser(currentUser);
                        setLoading(false); // <--- Ensuring loading is cleared when we know we are signed in
                        clearTimeout(safetyTimeout);
                    }
                } catch (err: any) {
                    console.error('Profile fetch failed:', err);
                    toast.error('Login successful, but profile could not be loaded.');
                    if (mounted) setLoading(false); // Fail gracefully
                }
            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
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
            const result = await authService.login({ email, password });
            setUser(result.user);
            toast.success('Welcome back!', { id: toastId });
        } catch (err: any) {
            console.error('Login failed:', err);
            toast.error(err.message || 'Login failed', { id: toastId });
            throw err; // Re-throw to let component know
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
