import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RegisterData } from '../services/authService';

// NO-AUTH MODE: Default Guest User with Premium Access
const GUEST_USER: User = {
    id: 'guest_doctor',
    name: 'Guest Doctor',
    email: 'guest@aivanahealth.com',
    qualification: 'MBBS',
    can_prescribe_allopathic: 'yes',
    hospital_name: 'My Clinic',
    hospital_address: '',
    phone: '',
    registration_number: '',
    subscription_tier: 'premium', // Unlocks unlimited usage
    subscription_status: 'active',
    cases_today: 0,
    total_cases: 0,
    created_at: new Date().toISOString()
};

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
    // Always start authenticated
    const [user, setUser] = useState<User | null>(GUEST_USER);
    // Never show loading spinner
    const [loading, setLoading] = useState(false);

    // Login just sets the guest user (or could be no-op)
    const login = async (email: string, password: string) => {
        setUser(GUEST_USER);
    };

    // Register just sets the guest user
    const register = async (data: RegisterData) => {
        setUser({ ...GUEST_USER, name: data.name, email: data.email });
    };

    // Logout resets to Guest User (so they are never "out")
    const logout = () => {
        setUser(GUEST_USER);
    };

    const refreshUser = async () => {
        // No-op in no-auth mode
        setUser(GUEST_USER);
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
