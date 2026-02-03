import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES, LanguageOption } from '../utils/languages';
import { Icon } from './Icon';

interface LanguageSelectorProps {
    value: string;
    onChange: (languageName: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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

    const filteredLanguages = LANGUAGES.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOption = LANGUAGES.find(lang => lang.name === value) || LANGUAGES[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white flex items-center justify-between cursor-pointer hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all"
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">{selectedOption.flag}</span>
                    <span className="text-slate-900 font-medium">{selectedOption.name}</span>
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
                                    onClick={() => {
                                        onChange(lang.name);
                                        setIsOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${value === lang.name
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <span className="text-lg w-6 text-center">{lang.flag}</span>
                                    <div className="flex flex-col">
                                        <span className={`text-sm ${value === lang.name ? 'font-semibold' : 'font-medium'}`}>
                                            {lang.name}
                                        </span>
                                        {lang.name !== lang.nativeName && (
                                            <span className="text-xs text-slate-500 opacity-80">
                                                {lang.nativeName}
                                            </span>
                                        )}
                                    </div>
                                    {value === lang.name && (
                                        <Icon name="check" className="w-4 h-4 ml-auto text-blue-600" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                No languages found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
