import React from 'react';

interface LanguageReminderBubbleProps {
    onDismiss: () => void;
}

export const LanguageReminderBubble: React.FC<LanguageReminderBubbleProps> = ({ onDismiss }) => {
    const handleChooseLanguage = () => {
        // Try to scroll to and open the language selector
        const languageSection = document.querySelector('[data-tour-id="dashboard-language"]') as HTMLElement | null;
        if (languageSection) {
            languageSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const selectorRoot = languageSection.querySelector('[data-language-selector-root="true"]') as HTMLElement | null;
            if (selectorRoot) {
                selectorRoot.click();
            }
        }
        onDismiss();
    };

    return (
        <div className="fixed bottom-4 right-4 z-[900] max-w-sm shadow-xl">
            <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 flex gap-3 items-start">
                <div className="mt-1 text-xl" aria-hidden="true">
                    🌐
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                        Start by choosing your consultation language
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                        This helps Aivana Doc transcribe and generate notes in the right language from your very first session.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleChooseLanguage}
                            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Choose language
                        </button>
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

