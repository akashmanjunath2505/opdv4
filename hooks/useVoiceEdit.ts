
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

    // UI State: Are we *intending* to listen?
    const [isActive, setIsActive] = useState(false);
    const isActiveRef = useRef(false);

    // Track if we are in the "finalizing" phase (stopped UI, but waiting for hardware to stop)
    const isStoppingRef = useRef(false);

    const handleToggleListeningWithState = useCallback(() => {
        // Prevent toggle if we are currently processing or in the middle of stopping
        if (isProcessing || isStoppingRef.current) return;

        if (isActiveRef.current) {
            // STOP ACTION
            console.log('[Voice Edit] User clicked Stop');
            isActiveRef.current = false;
            setIsActive(false);

            // Mark as stopping so we don't allow restart until processing is done/started
            isStoppingRef.current = true;

            stopListening();
        } else {
            // START ACTION
            console.log('[Voice Edit] User clicked Start');
            resetTranscript();
            isActiveRef.current = true;
            setIsActive(true);
            isStoppingRef.current = false;
            startListening();
        }
    }, [isProcessing, startListening, stopListening, resetTranscript]);

    useEffect(() => {
        // Trigger processing when hardware listening stops AND we intended to stop
        // We check !isActiveRef.current (User pressed stop) and !isListening (Hardware confirmed stop)
        if (!isListening && !isActiveRef.current && isStoppingRef.current) {

            const currentTranscript = transcript.trim();
            console.log('[Voice Edit] Hardware stopped. Transcript:', currentTranscript);

            if (currentTranscript) {
                const process = async () => {
                    setIsProcessing(true);
                    try {
                        const updatedData = await processVoiceEdit(currentData, currentTranscript, doctorProfile, language);
                        if (updatedData) {
                            onUpdate(updatedData);
                        }
                    } catch (error) {
                        console.error("Voice edit failed:", error);
                    } finally {
                        setIsProcessing(false);
                        isStoppingRef.current = false; // Reset stopping state
                        resetTranscript();
                    }
                };
                process();
            } else {
                // Empty transcript, just reset
                console.log('[Voice Edit] Empty transcript, skipping process');
                isStoppingRef.current = false;
                resetTranscript();
            }
        }
    }, [isListening, transcript, currentData, doctorProfile, language, onUpdate, resetTranscript]);

    return {
        // UI should reflect user intent (`isActive`) OR strict processing state
        // We do NOT include `isListening` here to avoid the "lag" that causes double-clicks.
        // If underlying hardware is still listening but user clicked stop, we show "Processing" or just "Active=False"
        isListening: isActive,
        isProcessing: isProcessing || (isStoppingRef.current && !isActive), // Show processing if we are stopping or actually processing
        interimTranscript,
        toggleVoiceEdit: handleToggleListeningWithState,
        transcript
    };
};
