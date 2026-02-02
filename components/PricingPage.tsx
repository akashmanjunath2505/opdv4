import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PricingPageProps {
    onClose: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpgrade = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/subscription/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create checkout session');
            }

            const { url } = await response.json();

            // Redirect to Stripe Checkout
            window.location.href = url;
        } catch (err: any) {
            setError(err.message || 'Failed to start checkout');
            setLoading(false);
        }
    };

    const isPremium = user?.subscription_tier === 'premium';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">Choose Your Plan</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Free Plan */}
                    <div className="border-2 border-slate-200 rounded-lg p-6">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Free</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-900">₹0</span>
                                <span className="text-slate-600">/month</span>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-6">
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span><strong>10 cases per day</strong></span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span>AI-powered transcription</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span>Clinical note generation</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span>Basic prescription templates</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-500">
                                <span className="mt-0.5">✗</span>
                                <span>Unlimited cases</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-500">
                                <span className="mt-0.5">✗</span>
                                <span>Priority support</span>
                            </li>
                        </ul>

                        <button
                            disabled={!isPremium}
                            className="w-full py-2 px-4 border-2 border-slate-300 text-slate-700 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPremium ? 'Current Plan' : 'Current Plan'}
                        </button>
                    </div>

                    {/* Premium Plan */}
                    <div className="border-2 border-blue-600 rounded-lg p-6 relative bg-blue-50">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                LIMITED OFFER
                            </span>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Premium</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-blue-600">₹2,000</span>
                                <span className="text-slate-600">/month</span>
                            </div>
                            <p className="text-sm text-amber-600 font-medium mt-1">
                                First 100 clinicians only!
                            </p>
                        </div>

                        <ul className="space-y-3 mb-6">
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span><strong>Unlimited cases</strong> per day</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span>AI-powered transcription</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span>Clinical note generation</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span>Advanced prescription templates</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span><strong>Priority support</strong></span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span><strong>Cloud storage</strong> for all records</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-blue-600 mt-0.5">✓</span>
                                <span><strong>Advanced analytics</strong></span>
                            </li>
                        </ul>

                        <button
                            onClick={handleUpgrade}
                            disabled={loading || isPremium}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : isPremium ? 'Current Plan' : 'Upgrade to Premium'}
                        </button>
                    </div>
                </div>

                {/* FAQ */}
                <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-slate-900 mb-1">Can I cancel anytime?</h4>
                            <p className="text-sm text-slate-600">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-900 mb-1">What payment methods do you accept?</h4>
                            <p className="text-sm text-slate-600">We accept all major credit and debit cards through our secure payment processor, Stripe.</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-900 mb-1">Is my data secure?</h4>
                            <p className="text-sm text-slate-600">Yes, all data is encrypted and stored securely. We comply with medical data protection standards.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
