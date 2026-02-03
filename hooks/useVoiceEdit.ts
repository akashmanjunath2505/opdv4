
import { useState, useCallback, useRef, useEffect } from 'react';
import { PrescriptionData, DoctorProfile } from '../types';
import { useSpeechRecognition } from './useSpeechRecognition';
import { processVoiceEdit } from '../services/geminiService';

export const useVoiceEdit = (
    currentData: PrescriptionData,
    doctorProfile: DoctorProfile,
    language: string,
    onUpdate: (newData: PrescriptionData) => void
) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { isListening, startListening, stopListening, transcript, interimTranscript, resetTranscript } = useSpeechRecognition({ lang: language });
    const isActiveRef = useRef(false);

    const handleToggleListening = useCallback(() => {
        if (isActiveRef.current) {
            // Stop
            isActiveRef.current = false;
            stopListening();
        } else {
            // Start
            resetTranscript();
            isActiveRef.current = true;
            startListening();
        }
    }, [startListening, stopListening, resetTranscript]);

    useEffect(() => {
        // Trigger processing when listening stops AND we were previously active
        if (!isListening && !isActiveRef.current && transcript.trim()) {
            const process = async () => {
                setIsProcessing(true);
                try {
                    const updatedData = await processVoiceEdit(currentData, transcript, doctorProfile, language);
                    if (updatedData) {
                        onUpdate(updatedData);
                    }
                } catch (error) {
                    console.error("Voice edit failed:", error);
                } finally {
                    setIsProcessing(false);
                    // Don't reset transcript here immediately if we want to show what was captured
                    // but for this flow it makes sense to reset after processing
                    resetTranscript();
                }
            };
            process();
        }
    }, [isListening, transcript, currentData, doctorProfile, language, onUpdate, resetTranscript]);

    // Force a re-render when we toggle so UI updates immediately
    const [isActive, setIsActive] = useState(false);

    const handleToggleListeningWithState = useCallback(() => {
        if (isActiveRef.current) {
            isActiveRef.current = false;
            setIsActive(false);
            stopListening();
        } else {
            resetTranscript();
            isActiveRef.current = true;
            setIsActive(true);
            startListening();
        }
    }, [startListening, stopListening, resetTranscript]);

    // Sync external listening state just in case, but rely on our explicit toggle for UI intent
    useEffect(() => {
        if (!isListening && isActive) {
            // If underlying stopped but we think we are active, maybe it crashed or stopped cleanly. 
            // But we handle processing in the other effect when isListening becomes false. 
        }
    }, [isListening, isActive]);

    return {
        isListening: isActive || isListening, // Show as listening if we intend to be, or if physically listening
        isProcessing,
        interimTranscript,
        toggleVoiceEdit: handleToggleListeningWithState,
        transcript
    };
};
