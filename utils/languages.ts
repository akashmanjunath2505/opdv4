export interface LanguageOption {
    code: string;
    name: string;
    nativeName: string;
    flag?: string; // Optional emoji flag
}

export const LANGUAGES: LanguageOption[] = [
    { code: "auto", name: "Automatic Language Detection", nativeName: "Auto", flag: "✨" },

    // Major Global
    { code: "en-US", name: "English (US)", nativeName: "English", flag: "🇺🇸" },
    { code: "en-GB", name: "English (UK)", nativeName: "English", flag: "🇬🇧" },
    { code: "en-IN", name: "English (India)", nativeName: "English", flag: "🇮🇳" },

    // Middle East & Arabic Dialects
    { code: "ar-SA", name: "Arabic (Saudi Arabia)", nativeName: "العربية", flag: "🇸🇦" },
    { code: "ar-AE", name: "Arabic (UAE)", nativeName: "العربية (الإمارات)", flag: "🇦🇪" },
    { code: "ar-EG", name: "Arabic (Egypt)", nativeName: "العربية (مصر)", flag: "🇪🇬" },
    { code: "ar-QA", name: "Arabic (Qatar)", nativeName: "العربية", flag: "🇶🇦" },
    { code: "ur-PK", name: "Urdu (Pakistan)", nativeName: "اردو", flag: "🇵🇰" },
    { code: "ur-IN", name: "Urdu (India)", nativeName: "اردو", flag: "🇮🇳" },
    { code: "fa-IR", name: "Persian (Farsi)", nativeName: "فارسی", flag: "🇮🇷" },

    // Indian Subcontinent
    { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
    { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
    { code: "as", name: "Assamese", nativeName: "অসমীয়া", flag: "🇮🇳" },

    // Africa
    { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
    { code: "am", name: "Amharic", nativeName: "አማርኛ", flag: "🇪🇹" },
    { code: "ha", name: "Hausa", nativeName: "Harshen Hausa", flag: "🇳🇬" },
    { code: "yo", name: "Yoruba", nativeName: "Yorùbá", flag: "🇳🇬" },
    { code: "ig", name: "Igbo", nativeName: "Asụsụ Igbo", flag: "🇳🇬" },
    { code: "zu", name: "Zulu", nativeName: "isiZulu", flag: "🇿🇦" },
    { code: "xh", name: "Xhosa", nativeName: "isiXhosa", flag: "🇿🇦" },
    { code: "af", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦" },
    { code: "so", name: "Somali", nativeName: "Soomaaliga", flag: "🇸🇴" },

    // Europe
    { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
    { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
    { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
    { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
    { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
    { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
    { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },

    // East Asia & SE Asia
    { code: "zh", name: "Chinese (Mandarin)", nativeName: "中文", flag: "🇨🇳" },
    { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
    { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
    { code: "tl", name: "Tagalog (Filipino)", nativeName: "Filipino", flag: "🇵🇭" },
];
