import React, { useEffect, useMemo, useState } from 'react';
import { LanguageOption } from '../utils/languages';

type Placement = 'top' | 'right' | 'bottom' | 'left';

export interface WalkthroughStep {
    id: string;
    targetId: string;
    title: string;
    message: string;
    placement?: Placement;
}

interface GuidedWalkthroughOverlayProps {
    isOpen: boolean;
    steps: WalkthroughStep[];
    activeStep: number;
    nurseImageUrl: string;
    onNext: () => void;
    onBack: () => void;
    onDone: () => void;
    onMissingTarget?: () => void;
    showLanguageSelect?: boolean;
    languageOptions?: LanguageOption[];
    languageValue?: string;
    onLanguageChange?: (value: string) => void;
}

type Rect = { top: number; left: number; width: number; height: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const GuidedWalkthroughOverlay: React.FC<GuidedWalkthroughOverlayProps> = ({
    isOpen,
    steps,
    activeStep,
    nurseImageUrl,
    onNext,
    onBack,
    onDone,
    onMissingTarget,
    showLanguageSelect = false,
    languageOptions,
    languageValue,
    onLanguageChange,
}) => {
    const [rect, setRect] = useState<Rect | null>(null);

    const step = steps[activeStep];

    useEffect(() => {
        if (!isOpen || !step) return;

        const updateRect = () => {
            const elements = Array.from(document.querySelectorAll(`[data-tour-id="${step.targetId}"]`)) as HTMLElement[];
            const element = elements.find((node) => {
                if (step.targetId === 'review-pdf-button') {
                    return node.closest('header') !== null;
                }
                const rect = node.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            }) || elements.find((node) => {
                const rect = node.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            }) || null;
            if (!element) {
                setRect(null);
                if (onMissingTarget && activeStep < steps.length - 1) {
                    onMissingTarget();
                }
                return;
            }
            const initialBox = element.getBoundingClientRect();
            const isInViewport = initialBox.top >= 0
                && initialBox.left >= 0
                && initialBox.bottom <= window.innerHeight
                && initialBox.right <= window.innerWidth;
            if (!isInViewport) {
                element.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            const setFromRect = () => {
                const box = element.getBoundingClientRect();
                setRect({
                    top: box.top,
                    left: box.left,
                    width: box.width,
                    height: box.height,
                });
            };
            setFromRect();
            requestAnimationFrame(() => setFromRect());
        };

        updateRect();
        const isModalTarget = step.targetId === 'review-pdf-preview' || step.targetId === 'review-save-export';
        if (isModalTarget) {
            requestAnimationFrame(() => updateRect());
            setTimeout(() => updateRect(), 80);
        }
        if (step.targetId === 'review-pdf-button') {
            const timeouts: ReturnType<typeof setTimeout>[] = [];
            [60, 120, 200, 280].forEach((delay) => {
                timeouts.push(setTimeout(() => updateRect(), delay));
            });
            return () => {
                timeouts.forEach(clearTimeout);
            };
        }
        const handleResize = () => updateRect();
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
        };
    }, [isOpen, step, onMissingTarget]);

    const spotlightStyle = useMemo(() => {
        if (!rect) return undefined;
        return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        };
    }, [rect]);

    const bubbleStyle = useMemo(() => {
        if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        const placement: Placement = step?.placement || 'right';
        const offset = 16;
        const bubbleWidth = 320;
        const bubbleHeight = 180;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let top = rect.top;
        let left = rect.left;

        switch (placement) {
            case 'top':
                top = rect.top - bubbleHeight - offset;
                left = rect.left + rect.width / 2 - bubbleWidth / 2;
                break;
            case 'bottom':
                top = rect.top + rect.height + offset;
                left = rect.left + rect.width / 2 - bubbleWidth / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - bubbleHeight / 2;
                left = rect.left - bubbleWidth - offset;
                break;
            default:
                top = rect.top + rect.height / 2 - bubbleHeight / 2;
                left = rect.left + rect.width + offset;
                break;
        }

        return {
            top: clamp(top, 16, viewportHeight - bubbleHeight - 16),
            left: clamp(left, 16, viewportWidth - bubbleWidth - 16),
        };
    }, [rect, step]);

    if (!isOpen || !step) return null;

    const isFirst = activeStep === 0;
    const isLast = activeStep === steps.length - 1;

    return (
        <div className="fixed inset-0 z-[999]">
            <div className="absolute inset-0 bg-black/50" />
            {rect && (
                <>
                    <div
                        className="absolute rounded-xl border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.55),0_0_20px_rgba(59,111,224,0.7)]"
                        style={spotlightStyle}
                    />
                </>
            )}

            <div
                className="absolute w-[440px]"
                style={bubbleStyle}
            >
                <div className="flex items-start gap-4">
                    <img
                        src={nurseImageUrl}
                        alt="Nurse guide"
                        className="w-48 h-48 object-contain drop-shadow-md"
                    />
                    <div className="flex-1">
                        <div className="relative bg-white border border-slate-200 shadow-2xl rounded-3xl px-6 py-4">
                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Nurse Guide</div>
                            <div className="text-base font-semibold text-slate-900">{step.title}</div>
                            <p className="mt-2 text-base text-slate-700 leading-relaxed">
                                {step.message}
                            </p>
                            {showLanguageSelect && languageOptions && onLanguageChange && (
                                <div className="mt-3">
                                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">
                                        Walkthrough Language
                                    </label>
                                    <select
                                        value={languageValue}
                                        onChange={(event) => onLanguageChange(event.target.value)}
                                        className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2 py-2 text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    >
                                        {languageOptions.map((option) => (
                                            <option key={option.code} value={option.name}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="absolute -left-3 top-8 h-5 w-5 bg-white border-l border-t border-slate-200 rotate-45"></div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={onBack}
                                disabled={isFirst}
                                className={`px-4 py-2 rounded-md text-sm font-semibold border ${isFirst ? 'text-slate-300 border-slate-200 cursor-not-allowed bg-slate-100' : 'text-slate-700 border-slate-400 bg-white hover:bg-slate-100'}`}
                            >
                                Back
                            </button>
                            {isLast ? (
                                <button
                                    type="button"
                                    onClick={onDone}
                                    className="px-4 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Done
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onNext}
                                    className="px-4 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
