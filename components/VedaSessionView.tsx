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

interface ScribeSessionViewProps {
    onEndSession: () => void;
    doctorProfile: DoctorProfile;
    language: string;
}

// Visualizer Component
const VoiceVisualizer: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <div className="flex items-center gap-1 h-12 px-4">
        {[...Array(15)].map((_, i) => (
            <div
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${isActive ? 'bg-aivana-accent animate-wave' : 'bg-gray-600'}`}
                style={{
                    height: isActive ? `${Math.max(20, Math.random() * 100)}%` : '4px',
                    opacity: isActive ? 1 : 0.4,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: '0.8s'
                }}
            ></div>
        ))}
    </div>
);

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
            <div className="grid grid-cols-2 border border-gray-300 mb-5 relative" style={{ breakInside: 'avoid' }}>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
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
            <div className="grid grid-cols-2 border-l border-r border-t border-gray-300 bg-[#F0F7FF]">
                <div className={`${baseFontSize} p-2 font-bold border-r border-gray-300 uppercase tracking-tighter`}>Chief Complaint</div>
                <div className={`${baseFontSize} p-2 font-bold uppercase tracking-tighter`}>Clinical Findings</div>
            </div>
            <div className={`grid grid-cols-2 border border-gray-300 mb-5`}>
                <div className={`${baseFontSize} p-4 border-r border-gray-300 whitespace-pre-wrap leading-relaxed min-h-[140px] font-normal`}>
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
    const [phase, setPhase] = useState<'consent' | 'active' | 'processing' | 'review'>('consent');
    const [sessionLanguage, setSessionLanguage] = useState(defaultLanguage || "Automatic Language Detection");
    const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
    const [clinicalNote, setClinicalNote] = useState('');
    const [duration, setDuration] = useState(0);
    const [showPdfPreview, setShowPdfPreview] = useState(false);

    // NEW: Left Panel State
    const [activeTab, setActiveTab] = useState<'transcript' | 'checklist'>('transcript');

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

    const { isRecording, startRecording, stopRecording } = useAudioRecorder();
    const { startListening, stopListening, interimTranscript, resetTranscript } = useSpeechRecognition({ lang: sessionLanguage });

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

    // Restoring missing functions
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


    useEffect(() => {
        if (isRecording && phase !== 'active' && phase !== 'processing') {
            setPhase('active');
        }
    }, [isRecording, phase]);

    // ... existing effects ...

    // ...

    {/* RIGHT PANEL: MAIN EDITOR (Bigger Focus) */ }
    <div className={`${phase === 'active' || isRecording ? 'w-[450px]' : 'flex-1'} flex flex-col relative bg-aivana-dark transition-all duration-500`}>
        {/* Header Bar */}
        <header className="h-16 border-b border-white/5 bg-black/20 px-4 flex items-center justify-between">
            <div className={`flex items-center gap-${phase === 'active' || isRecording ? '2' : '6'}`}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${phase === 'active' || isRecording ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500 text-green-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${phase === 'active' || isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    {phase === 'active' || isRecording ? 'REC' : 'Standby'}
                </div>
                <span className="text-lg font-medium text-white tabular-nums">{formatTime(duration)}</span>
                <VoiceVisualizer isActive={phase === 'active' || isRecording} />
            </div>

            <div className="flex items-center gap-2">
                {isVoiceEditing && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg animate-fadeIn max-w-[300px] overflow-hidden">
                        <Icon name="microphone" className="w-3 h-3 text-purple-400 animate-pulse flex-shrink-0" />
                        <span className="text-xs text-purple-200 truncate">
                            {voiceEditInterim || "Listening..."}
                        </span>
                    </div>
                )}
                {/* Hide tools during active recording to save space and reduce distraction */}
                {phase !== 'active' && !isRecording && (
                    <>
                        <button onClick={toggleVoiceEdit} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isVoiceEditing ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                            <Icon name={isProcessingVoiceEdit ? "spinner" : "microphone"} className={`w-4 h-4 ${isProcessingVoiceEdit ? 'animate-spin' : ''}`} />
                            <span className="hidden lg:inline">Voice Edit</span>
                        </button>
                        <button onClick={() => setShowPdfPreview(!showPdfPreview)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                            <Icon name="document-text" className="w-4 h-4" />
                            <span className="hidden lg:inline">PDF</span>
                        </button>
                    </>
                )}

                {(phase === 'active' || isRecording) && (
                    <button onClick={handleStopSession} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all active:scale-95 whitespace-nowrap">
                        Stop Session
                    </button>
                )}
                <button onClick={onEndSession} className="p-2 text-gray-500 hover:text-white transition-colors"><Icon name="x" className="w-5 h-5" /></button>
            </div>
        </header>

        {/* Active Recording Placeholder */}
        {(phase === 'active' || isRecording) && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/20 text-center">
                <div className="w-20 h-20 mb-6 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                    <Icon name="microphone" className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Recording in Progress</h3>
                <p className="text-sm text-gray-500 max-w-[200px]">
                    Live transcription is active in the expanded center panel.
                </p>
            </div>
        )}

        {/* Main Editor Canvas */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-8 bg-black/20 ${phase === 'active' ? 'hidden' : 'block'}`}>
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Patient Info Card */}
                <div className="p-5 rounded-2xl bg-[#0f1014] border border-white/5 grid grid-cols-4 gap-6 shadow-sm">
                    <div className="col-span-2 space-y-1">
                        <label className="text-[9px] uppercase font-bold text-gray-600 tracking-wider">Patient Name</label>
                        <input value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })} className="w-full bg-transparent text-lg font-medium text-white placeholder-gray-700 outline-none border-b border-transparent focus:border-aivana-accent transition-colors" placeholder="Enter Name..." />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-gray-600 tracking-wider">Age</label>
                        <input value={patient.age} onChange={e => setPatient({ ...patient, age: e.target.value })} className="w-full bg-transparent text-white outline-none" placeholder="--" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-gray-600 tracking-wider">Sex</label>
                        <select value={patient.sex} onChange={e => setPatient({ ...patient, sex: e.target.value })} className="w-full bg-transparent text-white outline-none appearance-none"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select>
                    </div>
                </div>

                {/* Editor Grid */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Chief Complaint</label>
                        <textarea value={prescriptionData.subjective} onChange={e => setPrescriptionData({ ...prescriptionData, subjective: e.target.value })} className="w-full h-32 bg-[#0f1014] border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-aivana-accent focus:ring-1 focus:ring-aivana-accent transition-all resize-none" placeholder="Patient's primary complaints..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Clinical Findings</label>
                        <textarea value={prescriptionData.objective} onChange={e => setPrescriptionData({ ...prescriptionData, objective: e.target.value })} className="w-full h-32 bg-[#0f1014] border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-aivana-accent focus:ring-1 focus:ring-aivana-accent transition-all resize-none" placeholder="Observations found..." />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Diagnosis</label>
                    <input value={prescriptionData.differentialDiagnosis} onChange={e => setPrescriptionData({ ...prescriptionData, differentialDiagnosis: e.target.value })} className="w-full bg-[#0f1014] border border-white/5 rounded-xl p-4 text-white text-lg font-medium outline-none focus:border-aivana-accent transition-all" placeholder="Enter Diagnosis..." />
                </div>

                {/* Medicines */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Medicines</label>
                        <button onClick={() => setPrescriptionData({ ...prescriptionData, medicines: [...prescriptionData.medicines, { name: '', dosage: '', frequency: '', route: '' }] })} className="text-[9px] font-bold uppercase bg-aivana-accent/10 text-aivana-accent px-3 py-1.5 rounded-lg hover:bg-aivana-accent/20 transition-colors">+ Add Drug</button>
                    </div>
                    <div className="grid gap-3">
                        {prescriptionData.medicines.map((med, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-[#0f1014] p-2 rounded-lg border border-white/5 items-center">
                                <input value={med.name} onChange={e => { const m = [...prescriptionData.medicines]; m[i].name = e.target.value; setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="col-span-4 bg-transparent text-white text-sm border-b border-white/5 focus:border-aivana-accent px-2 outline-none" placeholder="Drug Name" />
                                <input value={med.dosage} onChange={e => { const m = [...prescriptionData.medicines]; m[i].dosage = e.target.value; setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="col-span-3 bg-transparent text-white text-sm border-b border-white/5 focus:border-aivana-accent px-2 outline-none" placeholder="Dosage" />
                                <input value={med.frequency} onChange={e => { const m = [...prescriptionData.medicines]; m[i].frequency = e.target.value; setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="col-span-3 bg-transparent text-white text-sm border-b border-white/5 focus:border-aivana-accent px-2 outline-none" placeholder="Freq" />
                                <div className="col-span-2 flex items-center gap-1">
                                    <input value={med.route} onChange={e => { const m = [...prescriptionData.medicines]; m[i].route = e.target.value; setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="w-full bg-transparent text-white text-sm border-b border-white/5 focus:border-aivana-accent px-2 outline-none" placeholder="Route" />
                                    <button onClick={() => { const m = prescriptionData.medicines.filter((_, idx) => idx !== i); setPrescriptionData({ ...prescriptionData, medicines: m }) }} className="text-red-500 hover:text-red-400 p-1 rounded">×</button>
                                </div>
                            </div>
                        ))}
                        {prescriptionData.medicines.length === 0 && <div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-gray-700 text-xs">No medicines prescribed via voice yet.</div>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Advice</label>
                    <textarea value={prescriptionData.advice} onChange={e => setPrescriptionData({ ...prescriptionData, advice: e.target.value })} className="w-full h-24 bg-[#0f1014] border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-aivana-accent focus:ring-1 focus:ring-aivana-accent transition-all resize-none" placeholder="Instructions for patient..." />
                </div>


            </div>
        </div>

        {/* Processing Overlay */}
        {phase === 'processing' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
                <div className="w-16 h-16 border-t-2 border-aivana-accent rounded-full animate-spin mb-4"></div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Processing Session</h2>
            </div>
        )}

        {/* PDF Preview Modal */}
        {showPdfPreview && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-8" onClick={() => setShowPdfPreview(false)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                        <h3 className="text-lg font-bold text-gray-900">Prescription Preview</h3>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                <Icon name="download" className="w-4 h-4" />
                                <span>Download PDF</span>
                            </button>
                            <button onClick={() => setShowPdfPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Icon name="close" className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <PrescriptionTemplate patient={patient} prescriptionData={prescriptionData} isPreview />
                    </div>
                </div>
            </div>
        )}
    </div>
        </div >
    );
};
