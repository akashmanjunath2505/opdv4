import { useState, useCallback, useRef } from 'react';
import { PrescriptionData, DoctorProfile } from '../types';
import { processVoiceEdit, transcribeAudioCommand } from '../services/geminiService';
import { useAudioRecorder } from './useAudioRecorder';

export const useVoiceEdit = (
    currentData: PrescriptionData,
    doctorProfile: DoctorProfile,
    language: string,
    onUpdate: (newData: PrescriptionData) => void
) => {
    const [isProcessing, setIsProcessing] = useState(false);

    // Switch to Audio Recorder as primary mechanism to bypass Web Speech API network errors
    const { startRecording, stopRecording, isRecording } = useAudioRecorder();

    // UI State
    const [isActive, setIsActive] = useState(false);
    const isActiveRef = useRef(false);

    const handleToggleListening = useCallback(async () => {
        if (isProcessing) return;

        if (isActiveRef.current) {
            // STOP ACTION
            console.log('[Voice Edit] User clicked Stop (Audio Mode)');
            isActiveRef.current = false;
            setIsActive(false);

            // Stop recorder and get blob
            setIsProcessing(true); // Show processing immediately
            const audioBlob = await stopRecording();

            if (audioBlob) {
                console.log('[Voice Edit] Audio captured, size:', audioBlob.size);
                processAudioCheck(audioBlob);
            } else {
                console.warn('[Voice Edit] No audio blob captured');
                setIsProcessing(false);
            }

        } else {
            // START ACTION
            console.log('[Voice Edit] User clicked Start (Audio Mode)');
            isActiveRef.current = true;
            setIsActive(true);

            // Start recording
            await startRecording({
                // No need for VAD for explicit command recording
                segmentDuration: 60000 // Max 60s command
            });
        }
    }, [isProcessing, startRecording, stopRecording]);

    const processAudioCheck = async (blob: Blob) => {
        try {
            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                const base64Audio = base64String.split(',')[1];

                // 1. Transcribe
                console.log('[Voice Edit] Transcribing command...');
                // Clean mime type just in case
                const mimeType = blob.type || 'audio/webm';
                const transcript = await transcribeAudioCommand(base64Audio, mimeType, language);
                console.log('[Voice Edit] Transcript:', transcript);

                if (transcript && transcript.trim()) {
                    // 2. Process Edit
                    console.log('[Voice Edit] Processing edit...');
                    const updatedData = await processVoiceEdit(currentData, transcript, doctorProfile, language);
                    if (updatedData) {
                        onUpdate(updatedData);
                    }
                }

                setIsProcessing(false);
            };
        } catch (error) {
            console.error('[Voice Edit] Error processing audio:', error);
            setIsProcessing(false);
        }
    };

    return {
        // Show as listening if we are active AND recording (syncs UI)
        isListening: isActive,
        isProcessing,
        interimTranscript: isActive ? "Listening..." : "", // No real-time transcript with pure audio recorder
        toggleVoiceEdit: handleToggleListening,
        transcript: "" // Placeholder
    };
};
