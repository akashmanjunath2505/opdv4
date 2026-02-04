import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSelector } from './LanguageSelector';
import { Icon } from './Icon';

interface DashboardProps {
    onStartSession: (language: string) => void;
    onUpgrade?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartSession, onUpgrade }) => {
    const { user, logout } = useAuth();
    const [selectedLanguage, setSelectedLanguage] = React.useState("Automatic Language Detection");

    if (!user) return null;

    const isFreeTier = user.subscription_tier === 'free';
    const casesRemaining = isFreeTier ? Math.max(0, 10 - user.cases_today) : null;

    return (
        <div className="min-h-screen bg-[#F5F7FA] md:bg-slate-50">
            {/* Header/Navbar */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#3B6FE0] flex items-center justify-center shadow-md shadow-blue-600/20">
                                <Icon name="logo" className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg md:text-2xl font-bold text-[#1A1D23] md:text-slate-900">OPD Platform</h1>
                                <p className="text-[11px] md:text-sm text-[#6B7280] md:text-slate-600">AI-Powered Medical Scribe</p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            {/* Subscription Badge */}
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${isFreeTier
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                {isFreeTier ? 'Free Plan' : 'Premium'}
                            </div>

                            {/* User Menu */}
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                    <p className="text-xs text-slate-600">{user.qualification}</p>
                                </div>
                                {user.profile_picture_url ? (
                                    <img
                                        src={user.profile_picture_url}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <button
                                    onClick={logout}
                                    className="text-sm text-slate-600 hover:text-slate-900"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>

                        {/* Mobile User Menu */}
                        <div className="md:hidden flex items-center gap-3">
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${isFreeTier
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                {isFreeTier ? 'Free Plan' : 'Premium'}
                            </div>
                            <details className="relative">
                                <summary className="list-none cursor-pointer">
                                    {user.profile_picture_url ? (
                                        <img
                                            src={user.profile_picture_url}
                                            alt={user.name}
                                            className="w-9 h-9 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-[#3B6FE0] flex items-center justify-center text-white font-semibold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </summary>
                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl p-3 z-20">
                                    <div className="mb-2">
                                        <p className="text-sm font-semibold text-[#1A1D23]">{user.name}</p>
                                        <p className="text-[11px] text-[#6B7280]">{user.qualification}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left text-sm text-slate-600 hover:text-slate-900"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1A1D23] md:text-slate-900 mb-2">
                        Welcome back, {user.name}
                    </h2>
                    <p className="text-[#6B7280] md:text-slate-600">Ready to start a new consultation?</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-8">
                    {/* Today's Cases */}
                    <div className="bg-white rounded-[14px] md:rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:shadow-sm p-5 md:p-6">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-[11px] uppercase tracking-wider text-[#9CA3AF] md:text-sm md:normal-case md:tracking-normal md:text-slate-600">Today's Cases</h3>
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-lg">📋</div>
                        </div>
                        <p className="text-3xl font-bold text-[#1A1D23] md:text-slate-900">{user.cases_today}</p>
                        {isFreeTier && (
                            <p className="text-sm text-[#6B7280] md:text-slate-600 mt-1">
                                {casesRemaining} remaining today
                            </p>
                        )}
                    </div>

                    {/* Total Cases */}
                    <div className="bg-white rounded-[14px] md:rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:shadow-sm p-5 md:p-6">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-[11px] uppercase tracking-wider text-[#9CA3AF] md:text-sm md:normal-case md:tracking-normal md:text-slate-600">Total Cases</h3>
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-lg">📊</div>
                        </div>
                        <p className="text-3xl font-bold text-[#1A1D23] md:text-slate-900">{user.total_cases}</p>
                        <p className="text-sm text-[#6B7280] md:text-slate-600 mt-1">All time</p>
                    </div>

                    {/* Subscription */}
                    <div className="bg-white rounded-[14px] md:rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:shadow-sm p-5 md:p-6">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-[11px] uppercase tracking-wider text-[#9CA3AF] md:text-sm md:normal-case md:tracking-normal md:text-slate-600">Subscription</h3>
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-lg">💎</div>
                        </div>
                        <p className="text-3xl font-bold text-[#1A1D23] md:text-slate-900">
                            {isFreeTier ? 'Free' : 'Premium'}
                        </p>
                        {isFreeTier && onUpgrade && (
                            <button
                                onClick={onUpgrade}
                                className="text-sm text-[#3B6FE0] md:text-blue-600 hover:text-blue-700 font-medium mt-1"
                            >
                                Upgrade to Premium →
                            </button>
                        )}
                    </div>
                </div>

                {/* Usage Limit Warning (Free Tier) */}
                {isFreeTier && casesRemaining !== null && casesRemaining <= 2 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h3 className="font-medium text-amber-900 mb-1">
                                    {casesRemaining === 0 ? 'Daily Limit Reached' : `Only ${casesRemaining} case${casesRemaining === 1 ? '' : 's'} remaining today`}
                                </h3>
                                <p className="text-sm text-amber-700 mb-2">
                                    {casesRemaining === 0
                                        ? 'You\'ve reached your daily limit of 10 cases. Upgrade to Premium for unlimited access.'
                                        : 'Upgrade to Premium for unlimited cases and priority support.'}
                                </p>
                                <button
                                    onClick={onUpgrade}
                                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                                >
                                    Upgrade to Premium - ₹2000/month
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Start Session Card */}
                <div className="bg-white rounded-[16px] md:rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:shadow-sm p-5 md:p-8">
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="mb-6">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">🎙️</span>
                            </div>
                            <h3 className="text-2xl font-bold text-[#1A1D23] md:text-slate-900 mb-2">Start New Session</h3>
                            <p className="text-[#6B7280] md:text-slate-600">
                                Begin a new patient consultation with AI-powered transcription and clinical note generation
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-left text-[11px] uppercase tracking-wider font-semibold text-[#6B7280] md:text-sm md:normal-case md:tracking-normal md:font-medium md:text-slate-700 mb-2">
                                Consultation Language
                            </label>
                            <LanguageSelector
                                value={selectedLanguage}
                                onChange={setSelectedLanguage}
                            />
                        </div>

                        <button
                            onClick={() => onStartSession(selectedLanguage)}
                            disabled={isFreeTier && casesRemaining === 0}
                            className="w-full min-h-[48px] bg-[#3B6FE0] md:bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl md:rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-blue-900/10"
                        >
                            {isFreeTier && casesRemaining === 0 ? 'Upgrade to Continue' : 'Start Veda Session'}
                        </button>

                        {user.hospital_name && (
                            <p className="text-[11px] text-[#9CA3AF] md:text-slate-500 mt-4">
                                {user.hospital_name}
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
