import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES, LanguageOption } from '../utils/languages';
import { Icon } from './Icon';

interface LanguageSelectorProps {
    value: string[];
    onChange: (languageNames: string[]) => void;
}

const AUTO_DETECT_LABEL = 'Automatic Language Detection';

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingSelection, setPendingSelection] = useState<string[]>(value);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setPendingSelection(value);
    }, [value]);

    const filteredLanguages = LANGUAGES.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOption = LANGUAGES.find(lang => lang.name === value[0]) || LANGUAGES[0];
    const selectedLabel = value.length > 1
        ? `${selectedOption.name} +${value.length - 1}`
        : selectedOption.name;

    const toggleLanguage = (languageName: string) => {
        setPendingSelection((prev) => {
            if (languageName === AUTO_DETECT_LABEL) {
                return prev.includes(AUTO_DETECT_LABEL) ? [] : [AUTO_DETECT_LABEL];
            }
            const withoutAuto = prev.filter(item => item !== AUTO_DETECT_LABEL);
            if (withoutAuto.includes(languageName)) {
                return withoutAuto.filter(item => item !== languageName);
            }
            return [...withoutAuto, languageName];
        });
    };

    const handleDone = () => {
        const nextValue = pendingSelection.length > 0 ? pendingSelection : [AUTO_DETECT_LABEL];
        onChange(nextValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => {
                    setIsOpen(!isOpen);
                    setPendingSelection(value);
                }}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white flex items-center justify-between cursor-pointer hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">{selectedOption.flag}</span>
                    <span className="text-slate-900 font-medium">{selectedLabel}</span>
                </div>
                <Icon name="chevronDown" className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white rounded-t-lg z-10">
                        <div className="relative">
                            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search language..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                        {filteredLanguages.length > 0 ? (
                            filteredLanguages.map(lang => (
                                <div
                                    key={lang.code}
                                    onClick={() => toggleLanguage(lang.name)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${pendingSelection.includes(lang.name)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={pendingSelection.includes(lang.name)}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={() => toggleLanguage(lang.name)}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-lg w-6 text-center">{lang.flag}</span>
                                    <div className="flex flex-col">
                                        <span className={`text-sm ${pendingSelection.includes(lang.name) ? 'font-semibold' : 'font-medium'}`}>
                                            {lang.name}
                                        </span>
                                        {lang.name !== lang.nativeName && (
                                            <span className="text-xs text-slate-500 opacity-80">
                                                {lang.nativeName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                No languages found
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2 bg-white rounded-b-lg">
                        <span className="text-xs text-slate-500">
                            {pendingSelection.length} selected
                        </span>
                        <button
                            type="button"
                            onClick={handleDone}
                            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
