
import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

// FIX: Updated to the correct native audio preview model name
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

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

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
        let s = Math.max(-1, Math.min(1, input[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        output.setInt16(i * 2, s, true);
    }
    return output.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export const useSpeechRecognition = (options: { lang?: string } = {}): UseSpeechRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

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

        // Prevent multiple instances
        if (recognitionRef.current) return;

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
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    setError('Microphone access denied.');
                    setIsListening(false);
                }
                // 'aborted' and 'network' are common, we will try to restart in onend
            };

            recognition.onend = () => {
                // Only stop if we explicitly requested it
                if (recognitionRef.current) {
                    console.log('Speech recognition ended unexpectedly, restarting...');
                    try {
                        recognition.start();
                    } catch (e) {
                        // unexpected start error
                    }
                } else {
                    setIsListening(false);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();

        } catch (err: any) {
            console.error('Failed to start speech recognition:', err);
            setError(err.message);
        }
    }, [options.lang]);

    const stopListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition) {
            // Clear ref FIRST to signal intentional stop to onend
            recognitionRef.current = null;
            recognition.stop();
        }
        setIsListening(false);
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    useEffect(() => {
        return () => {
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
        stream: null // Not needed for Web Speech API
    };
};
