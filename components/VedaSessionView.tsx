import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DoctorProfile, TranscriptEntry, PrescriptionData, PatientDemographics } from '../types';
import { Icon } from './Icon';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useLiveScribe } from '../hooks/useLiveScribe';
import { useVoiceEdit } from '../hooks/useVoiceEdit';
import { processAudioSegment, generateClinicalNote } from '../services/geminiService';
import { renderMarkdownToHTML } from '../utils/markdownRenderer';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ScribeSessionViewProps {
    onEndSession: () => void;
    doctorProfile: DoctorProfile;
    language: string;
}

// Visualizer Component
const VoiceVisualizer: React.FC<{ isActive: boolean; size?: 'small' | 'large' }> = ({ isActive, size = 'small' }) => {
    const barCount = size === 'large' ? 40 : 15;
    const heightClass = size === 'large' ? 'h-32' : 'h-12';
    const gapClass = size === 'large' ? 'gap-1.5' : 'gap-1';
    const barWidthClass = size === 'large' ? 'w-1.5' : 'w-1';

    return (
        <div className={`flex items-center ${gapClass} ${heightClass} px-4 justify-center`}>
            {[...Array(barCount)].map((_, i) => (
                <div
                    key={i}
                    className={`${barWidthClass} rounded-full transition-all duration-300 ${isActive ? 'bg-[#7C5CFC] md:bg-aivana-accent animate-wave' : 'bg-slate-400 md:bg-gray-600'}`}
                    style={{
                        height: isActive ? `${Math.max(15, 30 + Math.random() * 70)}%` : '4px',
                        opacity: isActive ? 0.8 + Math.random() * 0.2 : 0.3,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: '0.6s'
                    }}
                ></div>
            ))}
        </div>
    );
};

const stripMarkdown = (text: string): string => {
    if (!text) return "";
    return text.replace(/^[#\s*+-]+/gm, '').replace(/[*_]{1,2}/g, '').trim();
};

const PrescriptionTemplate: React.FC<{ patient: PatientDemographics; prescriptionData: PrescriptionData; isPreview?: boolean }> = ({ patient, prescriptionData, isPreview }) => {
    const containerClass = isPreview
        ? "w-full bg-white text-black p-6 rounded-lg shadow-inner overflow-hidden border border-gray-200"
        : "printable-area p-8 bg-white text-black relative";

    const baseFontSize = isPreview ? 'text-[10px]' : 'text-[12.5px]';
    const headerTitleSize = isPreview ? 'text-[15px]' : 'text-[22px]';
    const metaLabelSize = isPreview ? 'text-[9.5px]' : 'text-[12.5px]';

    return (
        <div className={containerClass} style={{ fontFamily: 'Arial, Helvetica, "Noto Sans Devanagari", sans-serif' }}>
            {/* Header Branding */}
            <div className="flex justify-between items-start mb-1" style={{ breakInside: 'avoid' }}>
                <div className="flex-1">
                    <div className={`${headerTitleSize} font-bold leading-tight uppercase`}>Doctors Name</div>
                    <div className={`${isPreview ? 'text-[8.5px]' : 'text-[11.5px]'} font-normal mt-0.5`}>Qualification</div>
                    <div className={`${isPreview ? 'text-[8.5px]' : 'text-[11.5px]'} font-normal`}>Reg. No :</div>
                </div>
                <div className="flex-1 text-right">
                    <div className={`${headerTitleSize} font-bold leading-tight uppercase`}>{patient.hospitalName}</div>
                    <div className={`${isPreview ? 'text-[8.5px]' : 'text-[11.5px]'} font-normal mt-0.5`}>{patient.hospitalAddress}</div>
                    <div className={`flex justify-end ${isPreview ? 'gap-4' : 'gap-10'} mt-1 ${isPreview ? 'text-[8.5px]' : 'text-[11.5px]'}`}>
                        <div><span className="font-bold">Ph:</span> {patient.hospitalPhone}</div>
                        <div><span className="font-bold">Time:</span> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                    </div>
                </div>
            </div>

            <div className="h-0.5 bg-[#8A63D2] w-full mb-5"></div>

            {/* Demographics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 border border-gray-300 mb-5 relative" style={{ breakInside: 'avoid' }}>
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
                <div className={`${metaLabelSize} space-y-3.5 p-3.5`}>
                    <div className="font-bold">Name/ID - <span className="font-normal ml-1">{patient.name}</span></div>
                    <div className="font-bold">Age - <span className="font-normal ml-1">{patient.age}</span></div>
                    <div className="flex justify-between max-w-[95%]">
                        <div className="font-bold">Sex - <span className="font-normal ml-1">{patient.sex}</span></div>
                        <div className="font-bold">Mob. No. - <span className="font-normal ml-1">{patient.mobile}</span></div>
                    </div>
                </div>
                <div className={`${metaLabelSize} p-3.5 space-y-3.5`}>
                    <div className="font-bold">Date: <span className="font-normal ml-1">{patient.date}</span></div>
                    <div className="font-bold">Weight - <span className="font-normal ml-1">{patient.weight}</span></div>
                    <div className="flex justify-between">
                        <div className="font-bold">Height - <span className="font-normal ml-1">{patient.height}</span></div>
                        <div className="font-bold">B.M.I. - <span className="font-normal ml-1">{patient.bmi}</span></div>
                    </div>
                </div>
            </div>

            {/* Side-by-Side: Chief Complaints & Clinical Findings */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-l border-r border-t border-gray-300 bg-[#F0F7FF]">
                <div className={`${baseFontSize} p-2 font-bold border-b md:border-b-0 border-r md:border-r border-gray-300 uppercase tracking-tighter`}>Chief Complaint</div>
                <div className={`${baseFontSize} p-2 font-bold uppercase tracking-tighter`}>Clinical Findings</div>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 border border-gray-300 mb-5`}>
                <div className={`${baseFontSize} p-4 border-b md:border-b-0 border-r md:border-r border-gray-300 whitespace-pre-wrap leading-relaxed min-h-[140px] font-normal`}>
                    {prescriptionData.subjective}
                </div>
                <div className={`${baseFontSize} p-4 whitespace-pre-wrap leading-relaxed min-h-[140px] font-normal`}>
                    {prescriptionData.objective}
                </div>
            </div>


            {/* Differential Diagnosis (Full Width) */}
            <div className="bg-[#FFF0F0] border-l border-r border-t border-gray-300 p-2">
                <div className={`${baseFontSize} font-bold uppercase tracking-tighter`}>Differential Diagnosis</div>
            </div>
            <div className={`border border-gray-300 mb-5 p-4 ${baseFontSize} whitespace-pre-wrap min-h-[60px] font-normal leading-relaxed`}>
                {[prescriptionData.assessment, prescriptionData.differentialDiagnosis].filter(Boolean).join('\n') || "None identified."}
            </div>

            {/* Lab Test Results (Full Width) */}
            <div className="bg-[#FAF5FF] border-l border-r border-t border-gray-300 p-2">
                <div className={`${baseFontSize} font-bold uppercase tracking-tighter`}>Lab Test Results</div>
            </div>
            <div className={`border border-gray-300 mb-5 p-4 ${baseFontSize} whitespace-pre-wrap min-h-[60px] font-normal leading-relaxed`}>
                {prescriptionData.labResults || "No lab results recorded."}
            </div>

            {/* Medicine Table */}
            <div className="mb-5">
                <div className="grid grid-cols-4 bg-[#D1F7E2] border border-gray-300 font-bold uppercase tracking-tighter">
                    <div className={`${baseFontSize} p-2 border-r border-gray-300`}>Name</div>
                    <div className={`${baseFontSize} p-2 border-r border-gray-300 text-center`}>Dosage</div>
                    <div className={`${baseFontSize} p-2 border-r border-gray-300 text-center`}>Frequency</div>
                    <div className={`${baseFontSize} p-2 text-center`}>Route</div>
                </div>
                <div className="border-l border-r border-b border-gray-300 min-h-[140px]">
                    {prescriptionData.medicines.map((med, i) => (
                        <div key={i} className="grid grid-cols-4 border-b border-gray-200 last:border-0 font-normal">
                            <div className={`${baseFontSize} p-3 border-r border-gray-200`}>{med.name}</div>
                            <div className={`${baseFontSize} p-3 border-r border-gray-200 text-center`}>{med.dosage}</div>
                            <div className={`${baseFontSize} p-3 border-r border-gray-200 text-center`}>{med.frequency}</div>
                            <div className={`${baseFontSize} p-3 text-center`}>{med.route}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Advice (Full Width) */}
            <div className="flex flex-col flex-grow">
                <div className="bg-[#FEF9C3] border border-gray-300 p-2">
                    <div className={`${baseFontSize} font-bold uppercase tracking-tighter`}>Advice / Instructions</div>
                </div>
                <div className={`border-l border-r border-b border-gray-300 p-4 h-full ${baseFontSize} whitespace-pre-wrap leading-relaxed font-normal`}>
                    {prescriptionData.advice || "N/A"}
                </div>
            </div>

            {/* Signature Area */}
            <div className="flex justify-end items-end pt-14" style={{ breakInside: 'avoid' }}>
                <div className="text-center">
                    <div className={`border-t border-black ${isPreview ? 'w-32' : 'w-60'} pt-2 font-bold ${baseFontSize} uppercase`}>Doctors Signature</div>
                </div>
            </div>
        </div>
    );
};


export const ScribeSessionView: React.FC<ScribeSessionViewProps> = ({ onEndSession, doctorProfile, language: defaultLanguage }) => {
    const { refreshUser } = useAuth();
    const [phase, setPhase] = useState<'consent' | 'active' | 'processing' | 'review'>('active');
    const [sessionLanguage, setSessionLanguage] = useState(defaultLanguage || "Automatic Language Detection");
    const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
    const [clinicalNote, setClinicalNote] = useState('');
    const [duration, setDuration] = useState(0);
    const [showPdfPreview, setShowPdfPreview] = useState(false);

    // NEW: Left Panel State
    const [activeTab, setActiveTab] = useState<'transcript' | 'checklist'>('transcript');
    const [showTranscript, setShowTranscript] = useState(false);
    const [patient, setPatient] = useState<PatientDemographics>({
        name: '', age: '', sex: '', mobile: '', weight: '', height: '', bmi: '',
        date: new Date().toLocaleDateString('en-GB'),
        hospitalName: 'OPD PLATFORM CLINIC',
        hospitalAddress: 'Mumbai, India',
        hospitalPhone: ''
    });

    const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
        subjective: '',
        objective: '',
        assessment: '',
        differentialDiagnosis: '',
        labResults: '',
        medicines: [],
        advice: ''
    });

    // Backend integration state
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [prescriptionId, setPrescriptionId] = useState<string | null>(null);

    const processedSegmentsRef = useRef<number>(0);
    const pendingSegmentsQueue = useRef<Blob[]>([]);
    const transcriptHistoryRef = useRef<TranscriptEntry[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const hasStartedRef = useRef(false);

    const { isRecording, startRecording, stopRecording } = useAudioRecorder();
    const { startListening, stopListening, interimTranscript, transcript, resetTranscript, isListening } = useSpeechRecognition({ lang: sessionLanguage });

    // Background Generation Hook
    const { liveNote, isGenerating: isGeneratingBackground } = useLiveScribe(
        transcriptHistory,
        doctorProfile,
        sessionLanguage
    );

    // Voice Edit Hook
    const { isListening: isVoiceEditing, isProcessing: isProcessingVoiceEdit, toggleVoiceEdit, interimTranscript: voiceEditInterim } = useVoiceEdit(
        prescriptionData,
        doctorProfile,
        sessionLanguage,
        setPrescriptionData
    );

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRecording]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptHistory, interimTranscript]);

    useEffect(() => {
        transcriptHistoryRef.current = transcriptHistory;
    }, [transcriptHistory]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const processSegment = useCallback((blob: Blob, index: number): Promise<void> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                try {
                    const base64Audio = (reader.result as string).split(',')[1];
                    const latestTranscript = transcriptHistoryRef.current;
                    const context = latestTranscript.slice(-3).map(t => `${t.speaker}: ${t.text}`).join(' ');

                    const results = await processAudioSegment(base64Audio, blob.type, sessionLanguage, doctorProfile, context);
                    if (results) {
                        const newEntries: TranscriptEntry[] = results.map((r, i) => ({
                            id: `seg-${index}-${i}-${Date.now()}`,
                            speaker: r.speaker,
                            text: r.text,
                            segmentIndex: index
                        }));
                        setTranscriptHistory(prev => {
                            if (prev.some(e => e.segmentIndex === index)) return prev;
                            const updated = [...prev, ...newEntries];
                            transcriptHistoryRef.current = updated;
                            return updated;
                        });

                        // Save transcripts to database
                        if (sessionId) {
                            newEntries.forEach(entry => {
                                apiService.addTranscript({
                                    session_id: sessionId,
                                    speaker: entry.speaker,
                                    text: entry.text,
                                    segment_index: entry.segmentIndex
                                }).catch(err => console.error('Failed to save transcript:', err));
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Error processing segment ${index}:`, err);
                } finally {
                    processedSegmentsRef.current++;
                    resolve();
                }
            };
        });
    }, [sessionLanguage, doctorProfile, sessionId]);

    const handleStartSession = useCallback(async () => {
        try {
            // Create session in database
            const session = await apiService.createSession({
                patient_name: patient.name,
                patient_age: patient.age,
                patient_sex: patient.sex,
                patient_mobile: patient.mobile,
                patient_weight: patient.weight,
                patient_height: patient.height,
                patient_bmi: patient.bmi,
                hospital_name: patient.hospitalName,
                hospital_address: patient.hospitalAddress,
                hospital_phone: patient.hospitalPhone
            });

            setSessionId(session.data.id);
            console.log('✅ Session created in database:', session.data.id);

            setPhase('active');
            setDuration(0);
            setTranscriptHistory([]);
            transcriptHistoryRef.current = [];
            resetTranscript();
            setClinicalNote('');
            processedSegmentsRef.current = 0;
            pendingSegmentsQueue.current = [];
            await startRecording({
                segmentDuration: 10000,
                vadThreshold: 0.02,
                minSegmentDuration: 2000,
                onSegment: (blob) => {
                    const idx = pendingSegmentsQueue.current.length;
                    pendingSegmentsQueue.current.push(blob);
                    processSegment(blob, idx);
                }
            });
            startListening();
        } catch (error) {
            console.error('Failed to create session:', error);
            // Continue anyway with local-only mode
            setPhase('active');
            setDuration(0);
            setTranscriptHistory([]);
            transcriptHistoryRef.current = [];
            resetTranscript();
            setClinicalNote('');
            processedSegmentsRef.current = 0;
            pendingSegmentsQueue.current = [];
            await startRecording({
                segmentDuration: 10000,
                vadThreshold: 0.02,
                minSegmentDuration: 2000,
                onSegment: (blob) => {
                    const idx = pendingSegmentsQueue.current.length;
                    pendingSegmentsQueue.current.push(blob);
                    processSegment(blob, idx);
                }
            });
            startListening();
        }
    }, [patient, startRecording, startListening, processSegment, resetTranscript]);

    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;
        handleStartSession();
    }, [handleStartSession]);

    const handleStopSession = useCallback(async () => {
        stopListening();
        setPhase('processing');
        const finalBlob = await stopRecording();
        if (finalBlob) {
            const idx = pendingSegmentsQueue.current.length;
            pendingSegmentsQueue.current.push(finalBlob);
            await processSegment(finalBlob, idx);
        }

        // Update session in database
        if (sessionId) {
            apiService.updateSession(sessionId, {
                ended_at: new Date().toISOString(),
                duration_seconds: duration,
                status: 'processing'
            }).catch(err => console.error('Failed to update session:', err));
        }

        let attempts = 0;
        const checkDone = setInterval(async () => {
            const allProcessed = processedSegmentsRef.current >= pendingSegmentsQueue.current.length;
            const timedOut = attempts > 10;

            if (allProcessed || timedOut) {
                clearInterval(checkDone);
                try {
                    await handleGenerateNote();
                } catch (err) {
                    console.error("Note generation failed", err);
                } finally {
                    setPhase('review');
                }
            }
            attempts++;
        }, 500);
    }, [stopRecording, stopListening, processSegment, sessionId, duration]);

    const handleGenerateNote = async () => {
        if (liveNote && !isGeneratingBackground) {
            setPrescriptionData(liveNote);
            setClinicalNote("Generated");

            // Save prescription to database
            if (sessionId) {
                try {
                    const prescription = await apiService.savePrescription({
                        session_id: sessionId,
                        subjective: liveNote.subjective,
                        objective: liveNote.objective,
                        assessment: liveNote.assessment,
                        differential_diagnosis: liveNote.differentialDiagnosis,
                        lab_results: liveNote.labResults,
                        advice: liveNote.advice
                    });
                    setPrescriptionId(prescription.id);

                    // Save medicines
                    if (liveNote.medicines.length > 0) {
                        await apiService.updateMedicines(prescription.id, liveNote.medicines);
                    }

                    console.log('✅ Prescription saved to database');

                    // Update session status
                    await apiService.updateSession(sessionId, {
                        status: 'completed'
                    });
                } catch (error) {
                    console.error('Failed to save prescription:', error);
                }
            }
            return;
        }

        let latestTranscript = transcriptHistoryRef.current;
        if (latestTranscript.length === 0 && transcriptHistory.length > 0) latestTranscript = transcriptHistory;
        const fullTranscript = latestTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');

        if (!fullTranscript.trim()) {
            setClinicalNote("Generated");
            return;
        }

        const noteData = await generateClinicalNote(fullTranscript, doctorProfile, sessionLanguage);
        if (noteData) {
            setPrescriptionData(noteData);
            setClinicalNote("Generated");

            // Save prescription to database
            if (sessionId) {
                try {
                    const prescription = await apiService.savePrescription({
                        session_id: sessionId,
                        subjective: noteData.subjective,
                        objective: noteData.objective,
                        assessment: noteData.assessment,
                        differential_diagnosis: noteData.differentialDiagnosis,
                        lab_results: noteData.labResults,
                        advice: noteData.advice
                    });
                    setPrescriptionId(prescription.id);

                    // Save medicines
                    if (noteData.medicines.length > 0) {
                        await apiService.updateMedicines(prescription.id, noteData.medicines);
                    }

                    console.log('✅ Prescription saved to database');

                    // Update session status
                    await apiService.updateSession(sessionId, {
                        status: 'completed'
                    });
                } catch (error) {
                    console.error('Failed to save prescription:', error);
                }
            }
        }
    };

    // Checklist Validation Helper
    const checkField = (value: any) => {
        if (!value) return false;
        if (typeof value === 'string') {
            const invalid = ["not specified", "none identified", "n/a", "unknown"];
            return !invalid.some(i => value.toLowerCase().includes(i));
        }
        if (Array.isArray(value)) return value.length > 0;
        return true;
    };

    const checklistItems = [
        { label: "Chief Complaint & History", valid: checkField(prescriptionData.subjective), icon: "user" },
        { label: "Examination & Vitals", valid: checkField(prescriptionData.objective), icon: "shieldCheck" },
        { label: "Diagnosis", valid: checkField(prescriptionData.differentialDiagnosis), icon: "activity" },
        { label: "Treatment Plan", valid: checkField(prescriptionData.medicines), icon: "document-text" }
    ];

    const completedCount = checklistItems.filter(i => i.valid).length;
    const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

    return (
        <div className="flex-1 flex flex-col md:flex-row bg-[#F5F7FA] md:bg-slate-50 overflow-y-auto md:overflow-hidden min-h-screen md:h-screen font-sans pt-28 md:pt-0 pb-10 md:pb-0">
            <style>{`
                @keyframes wave { 0%, 100% { height: 20%; opacity: 0.5; } 50% { height: 100%; opacity: 1; } }
                .animate-wave { animation: wave 1s ease-in-out infinite; }
            `}</style>
            {/* MOBILE TOP STRIP */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
                <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[9px] uppercase tracking-[0.25em] text-[#9CA3AF]">Doctor</div>
                            <div className="text-sm font-semibold text-[#1A1D23]">Dr. {doctorProfile?.name || "Sharma"} (MBBS)</div>
                            <div className="text-[11px] text-[#6B7280]">General Medicine</div>
                        </div>
                        <div className="text-[#3B6FE0] text-sm font-bold">{progressPercent}%</div>
                    </div>
                </div>
                <div className="px-4 pb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${phase === 'active' ? 'bg-[#E8524A]/10 border-[#E8524A]/30 text-[#E8524A]' : 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${phase === 'active' ? 'bg-[#E8524A] animate-pulse' : 'bg-[#22C55E]'}`}></div>
                            {phase === 'active' ? 'REC' : 'STANDBY'}
                        </div>
                        <span className="text-sm font-medium text-[#1A1D23] tabular-nums">{formatTime(duration)}</span>
                        {phase === 'active' && <VoiceVisualizer isActive={true} />}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTranscript(prev => !prev)}
                            className="min-h-[44px] px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-all"
                        >
                            {showTranscript ? 'Hide Chat' : 'Show Chat'}
                        </button>
                        {phase !== 'active' && (
                            <>
                                <button onClick={toggleVoiceEdit} className={`min-h-[44px] px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${isVoiceEditing ? 'bg-[#3B6FE0] text-white shadow-[0_0_12px_rgba(59,111,224,0.35)]' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'}`}>
                                    <span className="flex items-center gap-2">
                                        <Icon name={isProcessingVoiceEdit ? "spinner" : "microphone"} className={`w-4 h-4 ${isProcessingVoiceEdit ? 'animate-spin' : ''}`} />
                                        Voice Edit
                                    </span>
                                </button>
                                <button onClick={() => setShowPdfPreview(!showPdfPreview)} className="min-h-[44px] px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-all">
                                    <span className="flex items-center gap-2">
                                        <Icon name="document-text" className="w-4 h-4" />
                                        PDF
                                    </span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {isVoiceEditing && phase !== 'active' && (
                    <div className="px-4 pb-3">
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <Icon name="microphone" className="w-3 h-3 text-purple-500 animate-pulse" />
                            <span className="text-[10px] text-purple-600 font-medium">Listening...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* LEFT SIDEBAR: SESSION INFO */}
            {/* Desktop: Always Visible. Mobile: Hidden unless in 'session' tab? Actually, maybe hide sidebar on mobile entirely or put in menu. 
                Let's hide it on mobile for now to save space, or make it a slide-out.
                For simplicity: Hidden on mobile, accessible via menu if needed? 
                Better: Stack it? No space.
                Let's hide it on mobile small screens < 768px.
            */}
            <div className="hidden md:flex w-[300px] flex-col border-r border-slate-200 bg-white z-20">
                <div className="p-6 border-b border-slate-200">
                    {/* Replaced Global Sidebar Header */}
                    <div className="flex items-center gap-2 mb-8">
                        <Icon name="logo" className="w-6 h-6 text-white" />
                        <span className="font-bold text-lg text-white">OPD Platform</span>
                    </div>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Session Info</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                        <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Doctor Profile</div>
                        <div className="text-sm font-bold text-slate-900">Dr. {doctorProfile?.name || "Sharma"} (MBBS)</div>
                        <div className="text-[10px] uppercase text-slate-500 font-bold mt-3 mb-1">Department</div>
                        <div className="text-sm font-bold text-slate-900">General Medicine</div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Session Progress</span>
                        <span className="text-xl font-black text-blue-600">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-8">
                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>

                    <div className="space-y-6">
                        {checklistItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 group">
                                <Icon name={item.icon || "circle"} className={`w-5 h-5 ${item.valid ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`} />
                                <span className={`text-xs font-medium transition-colors ${item.valid ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>{item.label}</span>
                                <div className={`ml-auto w-2 h-2 rounded-full ${item.valid ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]' : 'bg-slate-200 border border-slate-300'}`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 items-center">
                        <Icon name="wifi" className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-slate-400">Status: Connected</span>
                    </div>
                </div>
            </div>

            {/* MIDDLE COLUMN: TRANSCRIPT (Independent Space) */}
            {(phase === 'active' || showTranscript) && (
                <div className={`flex ${phase === 'active' ? 'flex-1' : 'w-full md:w-[380px]'} flex-col border-b md:border-b-0 md:border-r border-slate-200 bg-white transition-all duration-500`}>
                <div className="h-14 md:h-16 flex items-center px-4 md:px-6 border-b border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3B6FE0] md:text-blue-600">Transcript</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {phase === 'active' ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                            <VoiceVisualizer isActive={true} size="large" />
                            <p className="text-[11px] uppercase tracking-[0.3em] text-[#7C5CFC] md:text-blue-600 mt-6 animate-pulse font-bold">Listening...</p>
                            <p className="text-[11px] text-[#6B7280] md:text-slate-500 mt-2">Speak clearly into the microphone</p>
                            <button
                                onClick={handleStopSession}
                                className="mt-6 min-h-[44px] px-6 py-3 bg-[#E8524A] hover:bg-[#E23F36] text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all active:scale-95"
                            >
                                Stop Session
                            </button>
                        </div>
                    ) : (
                        <>
                            {transcriptHistory.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full opacity-60 min-h-[300px]">
                                    <Icon name="message" className="w-12 h-12 mb-4 text-slate-300" />
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400">No Speech Detected</p>
                                </div>
                            )}

                            {/* Backend History */}
                            {transcriptHistory.map(entry => (
                                <div key={entry.id} className={`max-w-[90%] ${entry.speaker === 'Doctor' ? 'self-end ml-auto' : 'self-start mr-auto'}`}>
                                    <div className={`text-[9px] uppercase font-bold mb-1.5 ${entry.speaker === 'Doctor' ? 'text-right text-blue-600' : 'text-left text-slate-500'}`}>{entry.speaker}</div>
                                    <div className={`p-4 rounded-2xl text-xs leading-relaxed ${entry.speaker === 'Doctor'
                                        ? 'bg-blue-50 border border-blue-100 text-blue-900 rounded-tr-none'
                                        : 'bg-slate-100 border border-slate-200 text-slate-700 rounded-tl-none'
                                        }`}>
                                        {entry.text}
                                    </div>
                                </div>
                            ))}

                            <div ref={transcriptEndRef} />
                        </>
                    )}
                </div>
            </div>
            )}

            {/* RIGHT PANEL: MAIN EDITOR (Bigger Focus) */}
            <div className={`flex ${phase === 'active' ? 'md:w-[450px]' : 'flex-1'} w-full flex-col relative bg-[#F5F7FA] md:bg-slate-50 transition-all duration-500`}>
                {/* Header Bar */}
                <header className="hidden md:flex h-16 border-b border-slate-200 bg-white px-4 items-center justify-between">
                    <div className={`flex items-center gap-${phase === 'active' ? '2' : '6'}`}>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${phase === 'active' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500 text-green-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${phase === 'active' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                            {phase === 'active' ? 'REC' : 'Standby'}
                        </div>
                        <span className="text-lg font-medium text-slate-900 tabular-nums">{formatTime(duration)}</span>
                        <VoiceVisualizer isActive={phase === 'active'} />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTranscript(prev => !prev)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
                        >
                            <Icon name="document-text" className="w-4 h-4" />
                            <span className="hidden lg:inline">{showTranscript ? 'Hide Chat' : 'Show Chat'}</span>
                        </button>
                        {isVoiceEditing && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg animate-fadeIn">
                                <Icon name="microphone" className="w-3 h-3 text-purple-400 animate-pulse" />
                                <span className="text-xs text-purple-200 hidden md:inline">Listening...</span>
                            </div>
                        )}

                        {/* Hide tools during active recording to save space and reduce distraction */}
                        {phase !== 'active' && (
                            <>
                                <button onClick={toggleVoiceEdit} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isVoiceEditing ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                                    <Icon name={isProcessingVoiceEdit ? "spinner" : "microphone"} className={`w-4 h-4 ${isProcessingVoiceEdit ? 'animate-spin' : ''}`} />
                                    <span className="hidden lg:inline">Voice Edit</span>
                                </button>
                                <button onClick={() => setShowPdfPreview(!showPdfPreview)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">
                                    <Icon name="document-text" className="w-4 h-4" />
                                    <span className="hidden lg:inline">PDF</span>
                                </button>
                            </>
                        )}

                        {phase === 'active' && (
                            <button onClick={handleStopSession} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all active:scale-95 whitespace-nowrap">
                                Stop Session
                            </button>
                        )}
                        <button onClick={onEndSession} className="p-2 text-gray-500 hover:text-white transition-colors ml-2"><Icon name="x" className="w-5 h-5" /></button>
                    </div>

                    {/* New Patient Button */}
                    <button
                        onClick={onEndSession}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-slate-200 mr-2"
                    >
                        <Icon name="user-plus" className="w-4 h-4 text-blue-600" />
                        <span>New Patient</span>
                    </button>

                    {/* Mobile New Patient (Icon Only) */}
                    <button
                        onClick={onEndSession}
                        className="md:hidden p-2 text-slate-700 bg-white rounded-lg border border-slate-200 mr-2"
                    >
                        <Icon name="user-plus" className="w-5 h-5 text-blue-600" />
                    </button>
                </header>
                {/* Active Recording Placeholder */}
                {phase === 'active' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F5F7FA] md:bg-slate-50 text-center min-h-[260px]">
                        <div className="w-20 h-20 mb-6 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                            <Icon name="microphone" className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Recording in Progress</h3>
                        <p className="text-sm text-slate-500 max-w-[200px]">
                            Live transcription is active in the expanded center panel.
                        </p>
                    </div>
                )}

                {/* Main Editor Canvas */}
                <div className={`flex-1 overflow-y-auto p-5 md:p-8 bg-[#F5F7FA] md:bg-slate-50 ${phase === 'active' ? 'hidden' : 'block'}`}>
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* Patient Info Card */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 shadow-sm">
                            <div className="col-span-1 md:col-span-2 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider">Patient Name</label>
                                <input value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })} className="w-full bg-transparent text-base md:text-lg font-medium text-[#1A1D23] placeholder-slate-400 outline-none border-b border-transparent focus:border-[#3B6FE0] md:focus:border-blue-600 transition-colors py-2" placeholder="Enter Name..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider">Age</label>
                                <input value={patient.age} onChange={e => setPatient({ ...patient, age: e.target.value })} className="w-full bg-transparent text-[#1A1D23] text-base outline-none placeholder-slate-400 py-2" placeholder="--" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider">Sex</label>
                                <select value={patient.sex} onChange={e => setPatient({ ...patient, sex: e.target.value })} className="w-full bg-transparent text-[#1A1D23] text-base outline-none appearance-none py-2"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select>
                            </div>
                        </div>

                        {/* Editor Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Chief Complaint</label>
                                <textarea value={prescriptionData.subjective} onChange={e => setPrescriptionData({ ...prescriptionData, subjective: e.target.value })} className="w-full h-32 bg-white border border-slate-200 rounded-xl p-4 text-[#1A1D23] text-base md:text-sm outline-none focus:border-[#3B6FE0] md:focus:border-blue-600 focus:ring-1 focus:ring-[#3B6FE0] md:focus:ring-blue-600 transition-all resize-none placeholder-slate-400" placeholder="Patient's primary complaints..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Clinical Findings</label>
                                <textarea value={prescriptionData.objective} onChange={e => setPrescriptionData({ ...prescriptionData, objective: e.target.value })} className="w-full h-32 bg-white border border-slate-200 rounded-xl p-4 text-[#1A1D23] text-base md:text-sm outline-none focus:border-[#3B6FE0] md:focus:border-blue-600 focus:ring-1 focus:ring-[#3B6FE0] md:focus:ring-blue-600 transition-all resize-none placeholder-slate-400" placeholder="Observations found..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Differential Diagnosis</label>
                            <input value={prescriptionData.differentialDiagnosis} onChange={e => setPrescriptionData({ ...prescriptionData, differentialDiagnosis: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl p-4 text-[#1A1D23] text-base md:text-lg font-medium outline-none focus:border-[#3B6FE0] md:focus:border-blue-600 transition-all placeholder-slate-400" placeholder="Enter Differential Diagnosis..." />
                        </div>

                        {/* Medicines */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Medicines</label>
                                <button onClick={() => setPrescriptionData({ ...prescriptionData, medicines: [...prescriptionData.medicines, { name: '', dosage: '', frequency: '', route: '' }] })} className="w-full md:w-auto text-[11px] font-bold uppercase bg-blue-50 text-[#3B6FE0] md:text-blue-600 px-4 py-3 md:py-1.5 rounded-xl hover:bg-blue-100 transition-colors min-h-[44px] flex items-center justify-center">+ Add Drug</button>
                            </div>
                            <div className="grid gap-3">
                                {prescriptionData.medicines.map((med, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:grid md:grid-cols-12 md:gap-2 md:p-2 md:items-center">
                                        {/* Mobile: Stacked | Desktop: Grid */}
                                        <div className="mb-3 md:mb-0 md:col-span-4">
                                            <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Drug Name</label>
                                            <input value={med.name} onChange={e => { const m = [...prescriptionData.medicines]; m[i].name = e.target.value; setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="w-full bg-transparent text-slate-900 text-base md:text-sm border-b border-slate-100 focus:border-blue-600 px-2 outline-none placeholder-slate-400 py-2 md:py-0" placeholder="Drug Name" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-3 md:mb-0 md:contents">
                                            <div className="md:col-span-3">
                                                <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Dosage</label>
                                                <input value={med.dosage} onChange={e => { const m = [...prescriptionData.medicines]; m[i].dosage = e.target.value; setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="w-full bg-transparent text-slate-900 text-base md:text-sm border-b border-slate-100 focus:border-blue-600 px-2 outline-none placeholder-slate-400 py-2 md:py-0" placeholder="Dosage" />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Frequency</label>
                                                <input value={med.frequency} onChange={e => { const m = [...prescriptionData.medicines]; m[i].frequency = e.target.value; setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="w-full bg-transparent text-slate-900 text-base md:text-sm border-b border-slate-100 focus:border-blue-600 px-2 outline-none placeholder-slate-400 py-2 md:py-0" placeholder="Freq" />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 flex items-center gap-2">
                                            <div className="flex-1">
                                                <label className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Route</label>
                                                <input value={med.route} onChange={e => { const m = [...prescriptionData.medicines]; m[i].route = e.target.value; setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="w-full bg-transparent text-slate-900 text-base md:text-sm border-b border-slate-100 focus:border-blue-600 px-2 outline-none placeholder-slate-400 py-2 md:py-0" placeholder="Route" />
                                            </div>
                                            <button onClick={() => { const m = prescriptionData.medicines.filter((_, idx) => idx !== i); setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="text-red-500 hover:text-red-400 p-2 md:p-1 rounded-full hover:bg-red-50 transition-colors mt-auto md:mt-0">
                                                <Icon name="close" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {prescriptionData.medicines.length === 0 && <div className="text-center p-6 border border-dashed border-slate-300 rounded-xl text-[#6B7280] text-xs italic">No medicines prescribed via voice yet.</div>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Advice</label>
                            <textarea value={prescriptionData.advice} onChange={e => setPrescriptionData({ ...prescriptionData, advice: e.target.value })} className="w-full h-24 bg-white border border-slate-200 rounded-xl p-4 text-[#1A1D23] text-sm outline-none focus:border-[#3B6FE0] md:focus:border-blue-600 focus:ring-1 focus:ring-[#3B6FE0] md:focus:ring-blue-600 transition-all resize-none placeholder-slate-400" placeholder="Instructions for patient..." />
                        </div>


                    </div>
                </div>

                {/* Processing Overlay */}
                {phase === 'processing' && (
                    <div className="absolute inset-0 bg-[#111]/90 md:bg-slate-50/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
                        <div className="w-16 h-16 border-t-2 border-[#7C5CFC] md:border-blue-600 rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl md:text-2xl font-bold text-white md:text-slate-800 tracking-widest uppercase">Processing Session</h2>
                        <div className="md:hidden absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2 flex items-center gap-2 animate-fadeIn">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-[11px] text-slate-700 font-medium">Welcome back!</span>
                        </div>
                    </div>
                )}

                {/* PDF Preview Modal */}
                {showPdfPreview && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 md:p-8" onClick={() => setShowPdfPreview(false)}>
                        <div className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full h-full md:max-w-4xl md:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between md:rounded-t-2xl z-10">
                                <h3 className="text-lg font-bold text-slate-900">Prescription Preview</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={async () => {
                                            try {
                                                await authService.incrementCaseCount();
                                                await refreshUser(); // Update local stats instantly
                                                window.print();
                                            } catch (error: any) {
                                                toast.error(error.message || "Failed to update case count");
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#3B6FE0] md:bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md shadow-blue-600/20"
                                    >
                                        <Icon name="download" className="w-4 h-4" />
                                        <span>Download PDF</span>
                                    </button>
                                    <button onClick={() => setShowPdfPreview(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                        <Icon name="close" className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 md:p-6">
                                <PrescriptionTemplate patient={patient} prescriptionData={prescriptionData} isPreview />
                            </div>
                            <div className="printable-area">
                                <PrescriptionTemplate patient={patient} prescriptionData={prescriptionData} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
