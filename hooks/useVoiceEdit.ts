
import { useState, useCallback, useRef } from 'react';
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

    const handleToggleListening = useCallback(async () => {
        if (!isListening) {
            resetTranscript();
            isActiveRef.current = true;
            startListening();
        } else {
            isActiveRef.current = false;
            stopListening();

            // Wait a bit for the final transcript to settle
            setTimeout(async () => {
                if (transcript.trim()) {
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
                        resetTranscript();
                    }
                }
            }, 500);
        }
    }, [isListening, startListening, stopListening, transcript, currentData, doctorProfile, language, onUpdate, resetTranscript]);

    return {
        isListening,
        isProcessing,
        interimTranscript,
        toggleVoiceEdit: handleToggleListening,
        transcript
    };
};
