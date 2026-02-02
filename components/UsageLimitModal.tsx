import React from 'react';

interface UsageLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    casesToday: number;
    limit: number;
}

export const UsageLimitModal: React.FC<UsageLimitModalProps> = ({
    isOpen,
    onClose,
    onUpgrade,
    casesToday,
    limit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-3xl">⚠️</span>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
                    Daily Limit Reached
                </h2>

                {/* Message */}
                <p className="text-slate-600 text-center mb-6">
                    You've used <span className="font-semibold text-slate-900">{casesToday} of {limit}</span> cases today on the Free plan.
                </p>

                {/* Features */}
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3">Upgrade to Premium</h3>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span><strong>Unlimited cases</strong> per day</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Priority support</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Advanced analytics</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>Cloud storage for all records</span>
                        </li>
                    </ul>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-slate-900">₹2,000<span className="text-lg font-normal text-slate-600">/month</span></p>
                    <p className="text-sm text-amber-600 font-medium mt-1">Limited offer: First 100 clinicians only!</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={onUpgrade}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                    >
                        Upgrade Now
                    </button>
                </div>

                {/* Reset Info */}
                <p className="text-xs text-slate-500 text-center mt-4">
                    Your free cases will reset tomorrow at midnight
                </p>
            </div>
        </div>
    );
};
