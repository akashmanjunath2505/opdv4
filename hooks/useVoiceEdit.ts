
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
        if (!isListening) {
            resetTranscript();
            isActiveRef.current = true;
            startListening();
        } else {
            isActiveRef.current = false;
            stopListening();
        }
    }, [isListening, startListening, stopListening, resetTranscript]);

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

    return {
        isListening,
        isProcessing,
        interimTranscript,
        toggleVoiceEdit: handleToggleListening,
        transcript
    };
};
