// Auth Service for Frontend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    subscription_end_date?: string;
    cases_today: number;
    total_cases: number;
    last_case_date?: string;
    created_at: string;
    last_login?: string;
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
    private token: string | null = null;

    constructor() {
        // Load token from localStorage on init
        this.token = localStorage.getItem('auth_token');
    }

    async register(data: RegisterData): Promise<{ user: User; token: string }> {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }

        const result = await response.json();
        this.setToken(result.token);
        return result;
    }

    async login(data: LoginData): Promise<{ user: User; token: string }> {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const result = await response.json();
        this.setToken(result.token);
        return result;
    }

    async getCurrentUser(): Promise<User> {
        if (!this.token) {
            throw new Error('No authentication token');
        }

        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                this.logout();
            }
            throw new Error('Failed to get user');
        }

        const result = await response.json();
        return result.user;
    }

    setToken(token: string) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    getToken(): string | null {
        return this.token;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    getAuthHeader(): { Authorization: string } | {} {
        return this.token ? { Authorization: `Bearer ${this.token}` } : {};
    }
}

export const authService = new AuthService();
