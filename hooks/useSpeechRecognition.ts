
import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

// Standard model for high-quality audio streaming
const MODEL_NAME = 'gemini-2.0-flash-exp';

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
    const [stream, setStream] = useState<MediaStream | null>(null);

    const supported = true;

    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const wsRef = useRef<any>(null);
    const currentTurnTextRef = useRef('');
    const isCleaningUpRef = useRef(false);

    const shouldBeListeningRef = useRef(false);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize GenAI client with key from process.env
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const cleanup = useCallback(async () => {
        if (isCleaningUpRef.current) return;
        isCleaningUpRef.current = true;

        try {
            if (processorRef.current) {
                processorRef.current.disconnect();
                processorRef.current.onaudioprocess = null;
                processorRef.current = null;
            }
            if (compressorRef.current) {
                compressorRef.current.disconnect();
                compressorRef.current = null;
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
                sourceRef.current = null;
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                setStream(null);
            }

            if (audioContextRef.current) {
                const ctx = audioContextRef.current;
                audioContextRef.current = null;
                if (ctx.state !== 'closed') {
                    await ctx.close();
                }
            }

            if (wsRef.current) {
                // Close session properly
                try {
                    wsRef.current.close();
                } catch (ignore) { }
                wsRef.current = null;
            }

            if (currentTurnTextRef.current) {
                const leftover = currentTurnTextRef.current;
                setTranscript(prev => (prev + ' ' + leftover).trim());
                currentTurnTextRef.current = '';
                setInterimTranscript('');
            }
        } catch (error) {
            console.error("Cleanup error:", error);
        } finally {
            isCleaningUpRef.current = false;
            if (!shouldBeListeningRef.current) {
                setIsListening(false);
            }
        }
    }, []);

    const startListening = useCallback(async () => {
        if (isCleaningUpRef.current) return;

        shouldBeListeningRef.current = true;
        setError(null);

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContextClass({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const targetLang = options.lang || 'English';

            // Gemini Live Config
            const config = {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                inputAudioTranscription: {}, // Request input transcription
                systemInstruction: `You are a medical scribe. 
            Output transcription STRICTLY in ${targetLang}. 
            Ignore code-switching.`,
            };

            const sessionPromise = ai.live.connect({
                model: MODEL_NAME,
                config: config,
                callbacks: {
                    onopen: () => {
                        console.log("✅ Gemini Live Connected");
                        setIsListening(true);
                    },
                    onmessage: (message: any) => {
                        // Handle input transcription (what the user said)
                        const inputTranscription = message.serverContent?.inputTranscription;
                        if (inputTranscription) {
                            const text = inputTranscription.text;
                            if (text) {
                                currentTurnTextRef.current += text;
                                setInterimTranscript(currentTurnTextRef.current);
                            }
                        }

                        // Handle turn completion
                        if (message.serverContent?.turnComplete) {
                            if (currentTurnTextRef.current) {
                                const finalized = currentTurnTextRef.current;
                                setTranscript(prev => (prev + ' ' + finalized).trim());
                                currentTurnTextRef.current = '';
                                setInterimTranscript('');
                            }
                        }
                    },
                    onclose: () => {
                        console.log("Gemini Live Closed");
                        if (shouldBeListeningRef.current) {
                            // Auto-reconnect if dropped unexpectedly
                            cleanup().then(() => {
                                reconnectTimeoutRef.current = setTimeout(() => {
                                    startListening();
                                }, 1000);
                            });
                        } else {
                            setIsListening(false);
                        }
                    },
                    onerror: (err: any) => {
                        console.error("Gemini Live Error:", err);
                        if (!shouldBeListeningRef.current) {
                            setError("Transmission error.");
                            cleanup();
                            setIsListening(false);
                        }
                    }
                }
            });

            const session = await sessionPromise;
            wsRef.current = session;

            // Microphone Setup
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1,
                    sampleRate: 16000 // Optimized for speech
                }
            });
            streamRef.current = micStream;
            setStream(micStream);

            const source = audioContext.createMediaStreamSource(micStream);
            sourceRef.current = source;

            // Dynamics Compressor to normalize volume
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
            compressor.ratio.setValueAtTime(12, audioContext.currentTime);
            compressorRef.current = compressor;

            // Script Processor to extract raw PCM
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (!wsRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBuffer = floatTo16BitPCM(inputData);
                const base64Audio = arrayBufferToBase64(pcmBuffer);
                try {
                    // Send audio chunk to Gemini
                    wsRef.current.sendRealtimeInput({
                        media: {
                            mimeType: "audio/pcm;rate=16000",
                            data: base64Audio
                        }
                    });
                } catch (err) {
                    // Silent catch for send errors during cleanup
                }
            };

            source.connect(compressor);
            compressor.connect(processor);
            processor.connect(audioContext.destination);

        } catch (err: any) {
            console.error('Audio/Socket init failed:', err);
            setError("Microphone or Connection failed.");
            shouldBeListeningRef.current = false;
            cleanup();
            setIsListening(false);
        }
    }, [cleanup, options.lang]);

    const stopListening = useCallback(async () => {
        shouldBeListeningRef.current = false;
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        setIsListening(false);
        await cleanup();
    }, [cleanup]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        currentTurnTextRef.current = '';
    }, []);

    useEffect(() => {
        return () => {
            shouldBeListeningRef.current = false;
            cleanup();
        };
    }, [cleanup]);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        error,
        supported,
        stream
    };
};
