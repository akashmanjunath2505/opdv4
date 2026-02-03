export interface Language {
    label: string; // The display name (e.g., "English (United States)")
    value: string; // The value passed to the API/Recorder (usually same as label or a code)
    group: string; // Region/Category
}

export const LANGUAGES: Language[] = [
    // Automatic
    { label: "✨ Automatic Language Detection", value: "Automatic Language Detection", group: "Suggested" },

    // Major Global
    { label: "English (US)", value: "English (US)", group: "Global" },
    { label: "English (UK)", value: "English (UK)", group: "Global" },
    { label: "English (India)", value: "English (India)", group: "Global" },
    { label: "Spanish (Español)", value: "Spanish", group: "Global" },
    { label: "French (Français)", value: "French", group: "Global" },
    { label: "German (Deutsch)", value: "German", group: "Global" },
    { label: "Portuguese (Português)", value: "Portuguese", group: "Global" },
    { label: "Russian (Русский)", value: "Russian", group: "Global" },
    { label: "Mandarin Chinese (普通话)", value: "Chinese (Mandarin)", group: "Global" },
    { label: "Japanese (日本語)", value: "Japanese", group: "Global" },

    // Middle East & Arabic Dialects
    { label: "Arabic (Modern Standard)", value: "Arabic (Modern Standard)", group: "Middle East" },
    { label: "Arabic (UAE/Gulf)", value: "Arabic (Gulf)", group: "Middle East" },
    { label: "Arabic (Saudi Arabia)", value: "Arabic (Saudi)", group: "Middle East" },
    { label: "Arabic (Egypt)", value: "Arabic (Egyptian)", group: "Middle East" },
    { label: "Arabic (Levantine)", value: "Arabic (Levantine)", group: "Middle East" },
    { label: "Arabic (Morocco/Maghrebi)", value: "Arabic (Moroccan)", group: "Middle East" },
    { label: "Persian (Farsi)", value: "Persian", group: "Middle East" },
    { label: "Turkish (Türkçe)", value: "Turkish", group: "Middle East" },
    { label: "Urdu (اردو)", value: "Urdu", group: "Middle East" }, // Often grouped here or South Asia, culturally linked

    // Indian Languages
    { label: "Hindi (हिंदी)", value: "Hindi", group: "India" },
    { label: "Bengali (বাংলা)", value: "Bengali", group: "India" },
    { label: "Marathi (मराठी)", value: "Marathi", group: "India" },
    { label: "Telugu (తెలుగు)", value: "Telugu", group: "India" },
    { label: "Tamil (தமிழ்)", value: "Tamil", group: "India" },
    { label: "Gujarati (ગુજરાતી)", value: "Gujarati", group: "India" },
    { label: "Kannada (ಕನ್ನಡ)", value: "Kannada", group: "India" },
    { label: "Malayalam (മലയാളം)", value: "Malayalam", group: "India" },
    { label: "Odia (ଓଡ଼ିଆ)", value: "Odia", group: "India" },
    { label: "Punjabi (ਪੰਜਾਬੀ)", value: "Punjabi", group: "India" },
    { label: "Assamese (অসমীয়া)", value: "Assamese", group: "India" },
    { label: "Urdu (India)", value: "Urdu (India)", group: "India" },

    // African Languages
    { label: "Swahili (Kiswahili)", value: "Swahili", group: "Africa" },
    { label: "Amharic (አማርኛ)", value: "Amharic", group: "Africa" },
    { label: "Yoruba (Èdè Yorùbá)", value: "Yoruba", group: "Africa" },
    { label: "Hausa (Harshen Hausa)", value: "Hausa", group: "Africa" },
    { label: "Zulu (isiZulu)", value: "Zulu", group: "Africa" },
    { label: "Igbo (Asụsụ Igbo)", value: "Igbo", group: "Africa" },
    { label: "Oromo (Afaan Oromoo)", value: "Oromo", group: "Africa" },
    { label: "Somali (Af-Soomaali)", value: "Somali", group: "Africa" },

    // Others
    { label: "Indonesian (Bahasa Indonesia)", value: "Indonesian", group: "Asia" },
    { label: "Vietnamese (Tiếng Việt)", value: "Vietnamese", group: "Asia" },
    { label: "Thai (ไทย)", value: "Thai", group: "Asia" },
    { label: "Korean (한국어)", value: "Korean", group: "Asia" },

];
