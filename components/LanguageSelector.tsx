import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { LANGUAGES, Language } from '../config/languages';

interface LanguageSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredLanguages = LANGUAGES.filter(lang =>
        lang.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedLanguage = LANGUAGES.find(l => l.value === value) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (langValue: string) => {
        onChange(langValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <div
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className={`w-full px-4 py-3 rounded-lg border border-slate-300 bg-white flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'ring-2 ring-blue-600 border-transparent' : 'hover:border-blue-400'}`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-slate-900 truncate">
                        {selectedLanguage?.label || value}
                    </span>
                </div>
                <Icon name="chevron-down" className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-[300px] flex flex-col">
                    {/* Search Input */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
                        <div className="relative">
                            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search language..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Language List */}
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredLanguages.length > 0 ? (
                            filteredLanguages.map((lang, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSelect(lang.value)}
                                    className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer mb-0.5 flex items-center justify-between ${value === lang.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <span>{lang.label}</span>
                                    {value === lang.value && <Icon name="check" className="w-4 h-4 text-blue-600" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-slate-400">
                                No languages found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
