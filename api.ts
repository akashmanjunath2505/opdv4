// MOCK API IMPLEMENTATION (Frontend Revert)
// This file replaces real API calls with simulation for "Website Mode"

const MOCK_DELAY = 800;

const mockUser = {
    id: 'mock-user-123',
    name: 'Dr. Akash',
    email: 'akash@example.com',
    qualification: 'MBBS',
    hospital_name: 'Akash Clinic',
    subscription_status: 'active',
    subscription_tier: 'premium',
    cases_today: 5,
    total_cases: 120
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Axios-like interface
const api = {
    interceptors: {
        request: { use: () => { } },
        response: { use: () => { } }
    },
    get: async () => ({ data: {} }),
    post: async () => ({ data: {} }),
    put: async () => ({ data: {} }),
    delete: async () => ({ data: {} })
};

export default api;

export const authAPI = {
    signup: async (data: any) => {
        await wait(MOCK_DELAY);
        return { data: { user: { ...mockUser, ...data }, token: 'mock-jwt-token' } };
    },
    login: async (data: any) => {
        await wait(MOCK_DELAY);
        return { data: { user: mockUser, token: 'mock-jwt-token' } };
    },
    refresh: async () => {
        await wait(MOCK_DELAY);
        return { data: { token: 'new-mock-token' } };
    }
};

export const userAPI = {
    getProfile: async () => {
        await wait(MOCK_DELAY);
        return { data: mockUser };
    },
    updateProfile: async (data: any) => {
        await wait(MOCK_DELAY);
        return { data: { ...mockUser, ...data } };
    },
    getDoctorProfile: async () => {
        await wait(MOCK_DELAY);
        return { data: mockUser };
    },
    updateDoctorProfile: async (data: any) => {
        await wait(MOCK_DELAY);
        return { data: { ...mockUser, ...data } };
    },
    uploadLogo: async () => {
        await wait(MOCK_DELAY);
        return { data: { success: true } };
    }
};

export const subscriptionAPI = {
    getPlans: async () => {
        await wait(MOCK_DELAY);
        return { data: [] };
    },
    getCurrent: async () => {
        await wait(MOCK_DELAY);
        return { data: { status: 'active', tier: 'premium' } };
    },
    getUsage: async () => {
        await wait(MOCK_DELAY);
        return { data: { cases_today: 5, limit: 10 } };
    },
    createCheckoutSession: async () => {
        await wait(MOCK_DELAY);
        return { data: { url: '#' } };
    },
    cancel: async () => {
        await wait(MOCK_DELAY);
        return { data: { status: 'cancelled' } };
    }
};

export const casesAPI = {
    create: async () => {
        await wait(MOCK_DELAY);
        return { data: { id: 'case-1' } };
    },
    list: async () => {
        await wait(MOCK_DELAY);
        return { data: [] };
    },
    get: async () => {
        await wait(MOCK_DELAY);
        return { data: {} };
    },
    update: async () => {
        await wait(MOCK_DELAY);
        return { data: {} };
    },
    delete: async () => {
        await wait(MOCK_DELAY);
        return { data: {} };
    }
};
