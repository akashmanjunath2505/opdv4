import { User } from '../services/authService';

export const getDailySessionLimit = (tier: string | null | undefined): number => {
    if (tier === 'pro' || tier === 'premium') return 100;
    // Default and free tier
    return 10;
};

export const getCasesRemaining = (user: Pick<User, 'subscription_tier' | 'cases_today'>): number => {
    const limit = getDailySessionLimit(user.subscription_tier);
    return Math.max(0, limit - (user.cases_today || 0));
};

