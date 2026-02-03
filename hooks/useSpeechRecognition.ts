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
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = getLangCode(options.lang);

            recognition.onstart = () => {
                setIsListening(true);
                setError(null);
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
                    // Add a small delay to prevent rapid-fire restart loops if something is broken
                    setTimeout(() => {
                        if (shouldListenRef.current) { // Check again
                            try {
                                recognition.start();
                            } catch (e) {
                                console.error("Failed to restart recognition:", e);
                                setIsListening(false);
                            }
                        }
                    }, 100);
                } else {
                    setIsListening(false);
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
