import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { Dashboard } from './Dashboard';
import { ScribeSessionView } from './VedaSessionView';
import { UsageLimitModal } from './UsageLimitModal';
import { PricingPage } from './PricingPage';
import { DoctorProfile } from '../types';

export const AppRouter: React.FC = () => {
    const { user, loading, refreshUser } = useAuth();
    const [showRegister, setShowRegister] = useState(false);
    const [inSession, setInSession] = useState(false);
    const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [usageLimitInfo, setUsageLimitInfo] = useState({ casesToday: 0, limit: 10 });
    const [sessionLanguage, setSessionLanguage] = useState("Automatic Language Detection");

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show login/register
    if (!user) {
        if (showRegister) {
            return <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />;
        }
        return <LoginPage onSwitchToRegister={() => setShowRegister(true)} />;
    }

    const handleStartSession = async (language: string) => {
        // Check if user has reached limit
        if (user.subscription_tier === 'free' && user.cases_today >= 10) {
            setUsageLimitInfo({ casesToday: user.cases_today, limit: 10 });
            setShowUsageLimitModal(true);
            return;
        }

        // Start session
        setSessionLanguage(language);
        setInSession(true);
    };

    const handleEndSession = async () => {
        setInSession(false);
        // Refresh user data to get updated usage stats
        await refreshUser();
    };

    const handleUpgrade = () => {
        setShowUsageLimitModal(false);
        setShowPricing(true);
    };

    // Show pricing page
    if (showPricing) {
        return <PricingPage onClose={() => setShowPricing(false)} />;
    }

    // In active session
    if (inSession) {
        const doctorProfile: DoctorProfile = {
            name: user.name,
            qualification: user.qualification as 'MBBS' | 'BAMS' | 'BHMS',
            canPrescribeAllopathic: user.can_prescribe_allopathic as 'yes' | 'limited' | 'no'
        };

        return (
            <ScribeSessionView
                onEndSession={handleEndSession}
                doctorProfile={doctorProfile}
                language={sessionLanguage}
            />
        );
    }

    // Authenticated - show dashboard
    return (
        <>
            <Dashboard onStartSession={handleStartSession} onUpgrade={() => setShowPricing(true)} />
            <UsageLimitModal
                isOpen={showUsageLimitModal}
                onClose={() => setShowUsageLimitModal(false)}
                onUpgrade={handleUpgrade}
                casesToday={usageLimitInfo.casesToday}
                limit={usageLimitInfo.limit}
            />
        </>
    );
};
