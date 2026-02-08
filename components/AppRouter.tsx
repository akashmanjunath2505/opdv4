import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { CompleteProfilePage } from './CompleteProfilePage';
import { Dashboard } from './Dashboard';
import { ScribeSessionView } from './VedaSessionView';
import { UsageLimitModal } from './UsageLimitModal';
import { PricingPage } from './PricingPage';
import { GuidedWalkthroughOverlay, WalkthroughStep } from './GuidedWalkthroughOverlay';
import { LANGUAGES } from '../utils/languages';
import { DoctorProfile } from '../types';

export const AppRouter: React.FC = () => {
    const { user, loading, refreshUser, profileIncomplete } = useAuth();
    const [showRegister, setShowRegister] = useState(false);
    const [inSession, setInSession] = useState(false);
    const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [usageLimitInfo, setUsageLimitInfo] = useState({ casesToday: 0, limit: 10 });
    const [sessionLanguage, setSessionLanguage] = useState("Automatic Language Detection");
    const [showDashboardTour, setShowDashboardTour] = useState(false);
    const [dashboardTourStep, setDashboardTourStep] = useState(0);
    const [showVedaTour, setShowVedaTour] = useState(false);
    const [walkthroughLanguage, setWalkthroughLanguage] = useState("English (UK)");

    const dashboardCopy = useMemo(() => {
        const translations = {
            'English (UK)': {
                sidebar: { title: 'Navigation', message: 'This is your navigation and quick access area.' },
                usage: { title: 'Session Overview', message: 'Here’s your profile and session progress at a glance.' },
                language: { title: 'Consultation Language', message: 'Choose the consultation language before you start.' },
                pricing: { title: 'Upgrade Options', message: 'Upgrade here to unlock unlimited sessions and premium features.' },
                start: { title: 'Start Session', message: 'Click Start Session to begin your first consultation.' },
            },
            Hindi: {
                sidebar: { title: 'नेविगेशन', message: 'यह आपका नेविगेशन और क्विक एक्सेस एरिया है।' },
                usage: { title: 'सत्र सारांश', message: 'यहाँ आपका प्रोफ़ाइल और सेशन प्रोग्रेस दिखता है।' },
                language: { title: 'परामर्श भाषा', message: 'सेशन शुरू करने से पहले भाषा चुनें।' },
                pricing: { title: 'अपग्रेड विकल्प', message: 'अनलिमिटेड सेशन के लिए यहाँ अपग्रेड करें।' },
                start: { title: 'सेशन शुरू करें', message: 'अपनी पहली कंसल्टेशन शुरू करने के लिए क्लिक करें।' },
            },
            Marathi: {
                sidebar: { title: 'नेव्हिगेशन', message: 'हे तुमचे नेव्हिगेशन आणि क्विक अ‍ॅक्सेस क्षेत्र आहे.' },
                usage: { title: 'सेशन सारांश', message: 'इथे तुमचा प्रोफाइल आणि सेशन प्रगती दिसते.' },
                language: { title: 'कन्सल्टेशन भाषा', message: 'सेशन सुरू करण्यापूर्वी भाषा निवडा.' },
                pricing: { title: 'अपग्रेड पर्याय', message: 'अनलिमिटेड सेशनसाठी इथे अपग्रेड करा.' },
                start: { title: 'सेशन सुरू करा', message: 'पहिले कन्सल्टेशन सुरू करण्यासाठी क्लिक करा.' },
            },
            'Urdu (Pakistan)': {
                sidebar: { title: 'نیویگیشن', message: 'یہ آپ کا نیویگیشن اور فوری رسائی کا حصہ ہے۔' },
                usage: { title: 'سیشن خلاصہ', message: 'یہاں آپ کا پروفائل اور سیشن کی پیش رفت نظر آتی ہے۔' },
                language: { title: 'مشاورت کی زبان', message: 'سیشن شروع کرنے سے پہلے زبان منتخب کریں۔' },
                pricing: { title: 'اپ گریڈ آپشنز', message: 'لا محدود سیشنز کے لیے یہاں اپ گریڈ کریں۔' },
                start: { title: 'سیشن شروع کریں', message: 'اپنا پہلا مشاورت شروع کرنے کے لیے کلک کریں۔' },
            },
            'Urdu (India)': {
                sidebar: { title: 'نیویگیشن', message: 'یہ آپ کا نیویگیشن اور فوری رسائی کا حصہ ہے۔' },
                usage: { title: 'سیشن خلاصہ', message: 'یہاں آپ کا پروفائل اور سیشن کی پیش رفت نظر آتی ہے۔' },
                language: { title: 'مشاورت کی زبان', message: 'سیشن شروع کرنے سے پہلے زبان منتخب کریں۔' },
                pricing: { title: 'اپ گریڈ آپشنز', message: 'لا محدود سیشنز کے لیے یہاں اپ گریڈ کریں۔' },
                start: { title: 'سیشن شروع کریں', message: 'اپنا پہلا مشاورت شروع کرنے کے لیے کلک کریں۔' },
            },
            Swahili: {
                sidebar: { title: 'Urambazaji', message: 'Hili ni eneo lako la urambazaji na ufikiaji wa haraka.' },
                usage: { title: 'Muhtasari wa Kikao', message: 'Hapa unaona wasifu wako na maendeleo ya kikao.' },
                language: { title: 'Lugha ya Ushauri', message: 'Chagua lugha ya ushauri kabla ya kuanza.' },
                pricing: { title: 'Chaguo za Kuboresha', message: 'Boresha hapa kufungua vipindi visivyo na kikomo.' },
                start: { title: 'Anza Kikao', message: 'Bofya Anza Kikao kuanza ushauri wa kwanza.' },
            },
            'Arabic (Saudi Arabia)': {
                sidebar: { title: 'التنقل', message: 'هذه منطقة التنقل والوصول السريع.' },
                usage: { title: 'ملخص الجلسة', message: 'هنا يظهر ملفك الشخصي وتقدم الجلسة.' },
                language: { title: 'لغة الاستشارة', message: 'اختر لغة الاستشارة قبل البدء.' },
                pricing: { title: 'خيارات الترقية', message: 'قم بالترقية هنا لفتح الجلسات غير المحدودة.' },
                start: { title: 'ابدأ الجلسة', message: 'اضغط لبدء الاستشارة الأولى.' },
            },
        } as const;

        return translations[walkthroughLanguage as keyof typeof translations] || translations['English (UK)'];
    }, [walkthroughLanguage]);

    const dashboardSteps: WalkthroughStep[] = [
        {
            id: 'sidebar',
            targetId: 'dashboard-sidebar',
            title: dashboardCopy.sidebar.title,
            message: dashboardCopy.sidebar.message,
            placement: 'right',
        },
        {
            id: 'usage',
            targetId: 'dashboard-usage',
            title: dashboardCopy.usage.title,
            message: dashboardCopy.usage.message,
            placement: 'bottom',
        },
        {
            id: 'language',
            targetId: 'dashboard-language',
            title: dashboardCopy.language.title,
            message: dashboardCopy.language.message,
            placement: 'right',
        },
        {
            id: 'pricing',
            targetId: 'dashboard-pricing',
            title: dashboardCopy.pricing.title,
            message: dashboardCopy.pricing.message,
            placement: 'bottom',
        },
        {
            id: 'start',
            targetId: 'dashboard-start-session',
            title: dashboardCopy.start.title,
            message: dashboardCopy.start.message,
            placement: 'top',
        },
    ];

    useEffect(() => {
        if (!user || loading) return;
        const isGuestUser = user.email === 'guest@local' || user.id.startsWith('guest-');
        if (profileIncomplete && !isGuestUser) return;
        if (inSession || showPricing) return;
        const onboardingKey = `has_seen_onboarding_${user.id}`;
        const hasSeen = localStorage.getItem(onboardingKey) === 'true';
        if (!hasSeen) {
            const storedLanguage = localStorage.getItem(`walkthrough_language_${user.id}`);
            if (storedLanguage) {
                setWalkthroughLanguage(storedLanguage);
            }
            const timer = setTimeout(() => {
                setShowDashboardTour(true);
                setDashboardTourStep(0);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [user, loading, profileIncomplete, inSession, showPricing]);

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

    const isGuestUser = user.email === 'guest@local' || user.id.startsWith('guest-');
    if (profileIncomplete && !isGuestUser) {
        return <CompleteProfilePage />;
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
        const vedaTourKey = `has_seen_veda_tour_${user.id}`;
        const hasSeenVedaTour = localStorage.getItem(vedaTourKey) === 'true';
        setShowVedaTour(!hasSeenVedaTour);
        setShowDashboardTour(false);
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
                tourMode={showVedaTour}
                walkthroughLanguage={walkthroughLanguage}
                onTourComplete={() => {
                    if (user) {
                        localStorage.setItem(`has_seen_veda_tour_${user.id}`, 'true');
                    }
                    setShowVedaTour(false);
                }}
            />
        );
    }

    // Authenticated - show dashboard
    return (
        <>
            <Dashboard onStartSession={handleStartSession} onUpgrade={() => setShowPricing(true)} />
            <GuidedWalkthroughOverlay
                isOpen={showDashboardTour}
                steps={dashboardSteps}
                activeStep={dashboardTourStep}
                nurseImageUrl="https://raw.githubusercontent.com/akashmanjunath2505/public/main/nurse.jpeg"
                showLanguageSelect={dashboardTourStep === 1}
                languageOptions={LANGUAGES.filter((option) => [
                    'English (UK)',
                    'Hindi',
                    'Marathi',
                    'Urdu (Pakistan)',
                    'Urdu (India)',
                    'Swahili',
                    'Arabic (Saudi Arabia)'
                ].includes(option.name))}
                languageValue={walkthroughLanguage}
                onLanguageChange={(value) => {
                    setWalkthroughLanguage(value);
                    if (user) {
                        localStorage.setItem(`walkthrough_language_${user.id}`, value);
                    }
                }}
                onBack={() => setDashboardTourStep((prev) => Math.max(0, prev - 1))}
                onNext={() => setDashboardTourStep((prev) => Math.min(dashboardSteps.length - 1, prev + 1))}
                onDone={() => {
                    if (user) {
                        localStorage.setItem(`has_seen_onboarding_${user.id}`, 'true');
                    }
                    setShowDashboardTour(false);
                }}
                onMissingTarget={() => {
                    setDashboardTourStep((prev) => Math.min(dashboardSteps.length - 1, prev + 1));
                }}
            />
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
