import React, { useEffect, useMemo, useState } from 'react';

interface OnboardingWalkthroughModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NURSE_IMAGE_URL = 'https://raw.githubusercontent.com/akashmanjunath2505/public/main/nurse.jpeg';

export const OnboardingWalkthroughModal: React.FC<OnboardingWalkthroughModalProps> = ({ isOpen, onClose }) => {
    const steps = useMemo(() => ([
        {
            title: 'Welcome',
            message: "Hi, I’m your nurse guide. I’ll walk you through the app and your first session.",
        },
        {
            title: 'Dashboard',
            message: 'This dashboard lets you start a new session and manage visits.',
        },
        {
            title: 'Start a Session',
            message: 'Tap Start Session, then speak clearly while the recording is active.',
        },
        {
            title: 'Finish Recording',
            message: 'Use Stop Session to finish. Transcription and notes are generated automatically.',
        },
        {
            title: 'Review & Chat',
            message: 'Review the transcript and notes. You can open Chat after transcription completes.',
        },
    ]), []);

    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setActiveStep(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isFirst = activeStep === 0;
    const isLast = activeStep === steps.length - 1;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-2/5 bg-slate-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
                        <img
                            src={NURSE_IMAGE_URL}
                            alt="Nurse guide"
                            className="w-36 h-36 md:w-48 md:h-48 rounded-full object-cover shadow-lg border border-slate-200"
                        />
                        <div className="mt-4 text-center">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Guide</div>
                            <div className="text-base font-semibold text-slate-800">Nurse Assistant</div>
                        </div>
                    </div>
                    <div className="md:w-3/5 p-6">
                        <div className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-2">
                            Step {activeStep + 1} of {steps.length}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">
                            {steps[activeStep].title}
                        </h3>
                        <div className="bg-blue-50 border border-blue-100 text-slate-700 rounded-2xl px-4 py-3 text-sm leading-relaxed">
                            {steps[activeStep].message}
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${isFirst ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                disabled={isFirst}
                            >
                                Back
                            </button>
                            <div className="flex items-center gap-3">
                                {!isLast && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Next
                                    </button>
                                )}
                                {isLast && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Done
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
