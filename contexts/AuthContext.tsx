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
    loginAsGuest: (name: string) => Promise<void>;
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
                // Check for Guest Session first
                const guestSessionStr = localStorage.getItem('guest_session');
                if (guestSessionStr) {
                    try {
                        const guestUser = JSON.parse(guestSessionStr);
                        if (mounted) {
                            setUser(guestUser);
                            setLoading(false);
                            return; // Exit early if guest
                        }
                    } catch (e) {
                        localStorage.removeItem('guest_session');
                    }
                }

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
                // Clear any guest session if real login happens
                localStorage.removeItem('guest_session');

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
            toast.success('Account created successfully!', { id: toastId });
        } catch (err: any) {
            console.error('Registration failed:', err);
            toast.error(err.message || 'Registration failed', { id: toastId });
            throw err;
        }
    };

    const loginAsGuest = async (name: string) => {
        const toastId = toast.loading('Entering as Guest...');
        try {
            // Create a transient guest user object
            const guestUser: User = {
                id: `guest-${Date.now()}`,
                name: name,
                email: 'guest@local',
                qualification: 'Guest',
                can_prescribe_allopathic: 'no',
                subscription_tier: 'free',
                subscription_status: 'active',
                cases_today: 0,
                total_cases: 0,
                created_at: new Date().toISOString(),
                // Add any other required fields for User type
            };

            // Save to local storage for persistence
            localStorage.setItem('guest_session', JSON.stringify(guestUser));

            // Set state
            setUser(guestUser);

            toast.success(`Welcome, ${name}!`, { id: toastId });
        } catch (err: any) {
            console.error('Guest login failed:', err);
            toast.error('Could not start guest session', { id: toastId });
        }
    };

    const logout = () => {
        authService.logout();
        localStorage.removeItem('guest_session');
        setUser(null);
        toast.success('Logged out successfully');
    };

    const refreshUser = async () => {
        try {
            // If guest, just refresh from local storage? Or do nothing?
            const guestSessionStr = localStorage.getItem('guest_session');
            if (guestSessionStr) {
                const guestUser = JSON.parse(guestSessionStr);
                setUser(guestUser);
                return;
            }

            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, loginAsGuest }}>
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
