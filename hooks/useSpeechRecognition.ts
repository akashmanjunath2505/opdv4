import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
    supported: boolean;
    stream: MediaStream | null;
}

export const useSpeechRecognition = (options: { lang?: string } = {}): UseSpeechRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Ref to track if we should be listening (to handle auto-restarts)
    const shouldListenRef = useRef(false);
    // Ref to hold the recognition instance
    const recognitionRef = useRef<any>(null);
    const retryCountRef = useRef(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Helper to map language names to BCP 47 tags
    const getLangCode = (langName?: string) => {
        const map: Record<string, string> = {
            'English': 'en-IN',
            'Hindi': 'hi-IN',
            'Marathi': 'mr-IN',
            'Gujarati': 'gu-IN',
            'Tamil': 'ta-IN',
            'Telugu': 'te-IN',
            'Kannada': 'kn-IN',
            'Malayalam': 'ml-IN',
            'Bengali': 'bn-IN',
            'Punjabi': 'pa-IN',
            'Odia': 'or-IN',
            'Assamese': 'as-IN',
            'Urdu': 'ur-IN'
        };
        return map[langName || 'English'] || 'en-US';
    };

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window)) {
            setError('Browser does not support speech recognition.');
            return;
        }

        // Prevent multiple starts
        if (isListening) return;

        shouldListenRef.current = true;
        setError(null);

        try {
            // @ts-ignore - webkitSpeechRecognition is not standard in all TS libs
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = getLangCode(options.lang);

            recognition.onstart = () => {
                setIsListening(true);
                setError(null);
                retryCountRef.current = 0; // Reset retries on success
            };

            recognition.onresult = (event: any) => {
                let final = '';
                let interim = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }

                if (final) {
                    setTranscript(prev => (prev + ' ' + final).trim());
                }
                setInterimTranscript(interim);
            };

            recognition.onerror = (event: any) => {
                console.warn('Speech recognition error:', event.error);

                // Don't show technical errors to user, just log them
                // 'aborted' and 'network' will trigger onend -> restart if shouldListenRef is true
                if (event.error === 'not-allowed') {
                    setError('Microphone access denied.');
                    shouldListenRef.current = false;
                } else if (event.error === 'no-speech') {
                    // Ignore no-speech, it just restarts
                } else {
                    // For other errors, we might want to capture them but not stop the flow
                    // setError(event.error); 
                }
            };

            recognition.onend = () => {
                // If we should still be listening, restart!
                if (shouldListenRef.current) {
                    // Exponential backoff for retries to handle network blips
                    const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 10000); // Cap at 10s

                    retryTimeoutRef.current = setTimeout(() => {
                        if (shouldListenRef.current) { // Check again
                            try {
                                retryCountRef.current++;
                                console.log(`🔄 Restarting speech recognition (Attempt ${retryCountRef.current})...`);
                                recognition.start();
                            } catch (e) {
                                console.error("Failed to restart recognition:", e);
                                setIsListening(false);
                            }
                        }
                    }, delay);
                } else {
                    setIsListening(false);
                    retryCountRef.current = 0;
                }
            };

            recognitionRef.current = recognition;
            recognition.start();

        } catch (err: any) {
            console.error('Failed to start speech recognition:', err);
            setError(err.message);
            setIsListening(false);
        }
    }, [options.lang, isListening]);

    const stopListening = useCallback(() => {
        shouldListenRef.current = false; // Explicitly stop
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

        if (recognitionRef.current) {
            recognitionRef.current.stop();
            // We don't nullify it immediately to allow onend to fire cleanly, 
            // but shouldListenRef=false prevents restart.
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    useEffect(() => {
        return () => {
            shouldListenRef.current = false;
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        error,
        supported: 'webkitSpeechRecognition' in window,
        stream: null
    };
};
