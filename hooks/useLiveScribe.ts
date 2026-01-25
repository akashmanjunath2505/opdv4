
import { useState, useEffect, useRef } from 'react';
import { DoctorProfile, TranscriptEntry, PrescriptionData } from '../types';
import { generateClinicalNote } from '../services/geminiService';

const UPDATE_THRESHOLD = 3; // Number of new segments to trigger an update
const DEBOUNCE_MS = 2000; // Wait for 2 seconds of silence before updating

export const useLiveScribe = (
    transcriptHistory: TranscriptEntry[],
    doctorProfile: DoctorProfile,
    language: string
) => {
    const [liveNote, setLiveNote] = useState<PrescriptionData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const lastProcessedLengthRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestTranscriptRef = useRef(transcriptHistory);

    // Keep ref in sync for async callbacks (Immediate sync for robustness)
    const syncTranscriptRef = (history: TranscriptEntry[]) => {
        latestTranscriptRef.current = history;
    };

    useEffect(() => {
        syncTranscriptRef(transcriptHistory);
        const currentLength = transcriptHistory.length;
        const diff = currentLength - lastProcessedLengthRef.current;

        // Condition 1: Enough new content has arrived
        if (diff >= UPDATE_THRESHOLD) {
            triggerBackgroundUpdate();
        }
        // Condition 2: Debounced update (if any new content exists but hasn't reached threshold)
        else if (diff > 0) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                triggerBackgroundUpdate();
            }, DEBOUNCE_MS);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [transcriptHistory]);

    const triggerBackgroundUpdate = async () => {
        if (isGenerating) return; // Skip if already busy

        // Don't process if no new segments since last SUCCESSFUL update start
        // Actually, we should check against what we HAVE processed, not just started.
        // For simplicity, let's just use the current ref length at start.

        setIsGenerating(true);
        const currentTranscript = latestTranscriptRef.current;
        const fullText = currentTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');

        // Update the marker immediately so we don't re-trigger for these segments
        lastProcessedLengthRef.current = currentTranscript.length;

        try {
            console.log("Triggering background note update...");
            const note = await generateClinicalNote(fullText, doctorProfile, language);
            if (note) {
                setLiveNote(note);
            }
        } catch (error) {
            console.error("Background generation failed", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        liveNote,
        isGenerating
    };
};
