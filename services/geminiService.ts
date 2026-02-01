
import { GoogleGenAI, Type } from "@google/genai";
import {
  Message,
  DoctorProfile,
  PreCodedGpt,
  PromptInsight,
  ClinicalProtocol,
  UserRole,
  PrescriptionData,
} from '../types';
import { runNexusWorkflow } from '../engine/workflow';
import { prescriptionDictionary } from '../prescription_dictionary';
import { CLINICAL_PROTOCOLS } from '../knowledgeBase';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SUPPORTED_LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Punjabi", "Odia", "Assamese", "Urdu"];

// FIX: Updated model name to latest version according to guidelines
export const processAudioSegment = async (
  base64Audio: string,
  mimeType: string,
  language: string,
  doctorProfile: DoctorProfile,
  previousContext: string = ""
): Promise<{ speaker: 'Doctor' | 'Patient'; text: string }[] | null> => {
  const systemInstruction = `
    You are an advanced Medical Scribe specialized in Indian clinical contexts.
    
    TASK: Perform a two-pass transcription for this clinical audio segment.
    
    PASS 1 (Phonetic Capture): Capture raw speech verbatim. Handle code-switching (e.g., Hindi + English) and regional accents naturally.
    PASS 2 (Semantic & Medical Normalization): Refine the raw capture into professional clinical text.
    - Normalize regional terms (e.g., "chakkar" to "dizziness/vertigo", "bukhaar" to "fever").
    - Correct medical terms and medication names.
    - Maintain the primary language script of the speaker but ensure clinical clarity.
    
    DIARIZATION: Identify "Doctor" and "Patient". 
    CONTEXT: Use previous dialogue for speaker consistency: "${previousContext}"
    
    LANGUAGE DETECTION & SCRIPT: 
    ${language === 'Auto-detect'
      ? 'Automatically detect the language of each speaker turn. Use native scripts (Devanagari, Tamil, etc.).'
      : `Primary Language Hint: ${language}. Preferably use the native script for ${language}, but automatically detect and handle other languages if the speaker switches.`}
    - Use Devanagari for Hindi/Marathi, Tamil script for Tamil, etc.
    - For English medical terms interleaved in native speech, keep them in English/Roman script if that's standard clinical practice in India.
    
    RULES: 
    1. Return ONLY valid JSON array of objects.
    2. Do NOT use markdown formatting.
    3. Ensure high accuracy for Indian accents and multilingual conversations.
  `;

  try {
    const audioPart = {
      inlineData: { data: base64Audio, mimeType },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [audioPart, { text: "Transcribe and normalize this clinical segment." }] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              speaker: { type: Type.STRING, enum: ['Doctor', 'Patient'] },
              text: { type: Type.STRING },
              detectedLanguage: { type: Type.STRING },
            },
            required: ['speaker', 'text', 'detectedLanguage'],
          },
        },
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Segment processing error:", error);
    return null;
  }
};

export const cleanupTranscript = async (
  transcript: string,
  language: string
): Promise<string> => {
  const dictionaryContext = JSON.stringify(prescriptionDictionary);
  const systemInstruction = `
    You are an expert Medical Editor.
    TASK: Clean up the following medical transcript.
    
    CLEANUP RULES:
    1. Remove filler words (um, ah, like, you know).
    2. Correct diarization errors if they seem obvious.
    3. CRITICAL: Correct any misspelled medical terms, symptoms, or medications using the provided dictionary as a reference.
    4. HARD RULE: Do NOT add any medications that were not explicitly mentioned in the raw transcript. Only correct spellings of mentioned ones.
    5. ${language === 'Auto-detect' ? 'Use the primary language(s) detected in the transcript.' : `Keep the output strictly in the native script of ${language}.`}
    6. Maintain the original meaning and conversational flow, but make it professional.
    
    DICTIONARY REFERENCE:
    ${dictionaryContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Raw Transcript:\n${transcript}`,
      config: { systemInstruction, temperature: 0 },
    });
    return response.text || transcript;
  } catch (error) {
    console.error("Cleanup error:", error);
    return transcript;
  }
};

export const generateSoapNote = async (
  cleanedTranscript: string,
  language: string
): Promise<string> => {
  const systemInstruction = `
    You are an expert clinical documentalist.
    TASK: Generate a professional SOAP note from the cleaned transcript.
    
    STRICT LANGUAGE RULE: ${language === 'Auto-detect' ? 'Use the primary language(s) detected in the transcript.' : `All content MUST be written strictly in the native script of ${language}.`}
    
    STRUCTURE RULES:
    1. Use exactly these headers: ## Subjective, ## Objective, ## Lab Results, ## Assessment, ## Differential Diagnosis.
    2. SUBJECTIVE: List patient symptoms in short bullet points.
    3. OBJECTIVE: List physical findings or observations if any.
    4. LAB RESULTS: List any lab test values, vital signs (BP, PR, SpO2, Temp), or investigation reports mentioned.
    5. ASSESSMENT: Leave this section empty.
    6. DIFFERENTIAL DIAGNOSIS: List the Primary Diagnosis first, followed by other potential diagnoses that are being considered.
    7. DO NOT include a "Plan" or "Prescription" section here.
    8. NO markdown formatting within sections (bold/italics).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Cleaned Transcript:\n${cleanedTranscript}`,
      config: { systemInstruction, temperature: 0 },
    });
    return response.text || '';
  } catch (error) {
    console.error("SOAP generation error:", error);
    return 'Error generating SOAP note.';
  }
};

export const generatePrescription = async (
  cleanedTranscript: string,
  language: string
): Promise<string> => {
  const dictionaryContext = JSON.stringify(prescriptionDictionary);
  const protocolsContext = JSON.stringify(CLINICAL_PROTOCOLS);

  const systemInstruction = `
    You are an expert clinical pharmacologist.
    TASK: Extract and format the medication plan (Prescription) from the transcript.
    
    REFERENCE DATA:
    - Dictionary: ${dictionaryContext}
    - Clinical Protocols: ${protocolsContext}
    
    RULES:
    1. HEADER: Use "## Plan".
    2. HARD RULE: Only extract drugs and advice (diet, follow-up, warnings, etc.) that were EXPLICITLY mentioned in the cleaned transcript. Do NOT hallucinate, suggest, or recommend any additional drugs or advice that were not stated by the clinician.
    3. VALIDATION RULE: You MUST validate and extract four parameters for every medication:
       - Name: Validate against the Dictionary.
       - Dosage: Extract the specific dose mentioned (e.g., 500mg, 1 tablet).
       - Frequency: Extract how often (e.g., once daily, BD).
       - Route: Extract the route (e.g., Oral, IV).
    4. MEDICINE FORMAT: "- Medicine Name | Dosage | Frequency | Route". 
       Example: "- Paracetamol | 500mg | Twice daily | Oral"
       If a parameter is missing, mark it as "Not specified".
    5. ADVICE: List all other clinician-stated instructions in short bullet points.
    6. ACCURACY: Cross-reference with the Dictionary and Clinical Protocols only for spelling and dosage validation of mentioned items.
    7. LANGUAGE: ${language === 'Auto-detect' ? 'Use the primary language(s) detected in the transcript.' : `Write strictly in the native script of ${language}.`}
    8. NO markdown formatting within sections (bold/italics).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Cleaned Transcript:\n${cleanedTranscript}`,
      config: { systemInstruction, temperature: 0 },
    });
    return response.text || '';
  } catch (error) {
    console.error("Prescription generation error:", error);
    return 'Error generating prescription.';
  }
};

// FIX: Unified single-shot generation for speed and consistency
export const generateClinicalNote = async (
  transcript: string,
  doctorProfile: DoctorProfile,
  language: string
): Promise<PrescriptionData | null> => {
  const dictionaryContext = JSON.stringify(prescriptionDictionary);
  const protocolsContext = JSON.stringify(CLINICAL_PROTOCOLS);

  const systemInstruction = `
    You are an expert Medical Scribe and Clinical Pharmacologist.
    
    TASK: Analyze the raw clinical transcript and generate a structured clinical note (SOAP + Prescription) in a SINGLE pass.
    
    INPUT CONTEXT:
    - Raw Transcript of Doctor-Patient conversation.
    - Doctor Profile: ${JSON.stringify(doctorProfile)}
    
    REFERENCE DATA:
    - Drug Dictionary: ${dictionaryContext}
    - Clinical Protocols: ${protocolsContext}
    
    LANGUAGE RULE:
    ${language === 'Auto-detect' ? 'Detect the primary language used by the doctor. Write the output in that language (using native script if applicable, e.g., Devanagari for Hindi).' : `Write the output strictly in ${language} (using native script where applicable).`}
    
    GENERATION RULES:
    1. **Cleanup First**: Internally clean the transcript to remove fillers and correct medical terms before extraction.
    2. **Subjective**: Summarize patient's complaints/symptoms.
    3. **Objective**: Summarize physical findings.
    4. **Assessment**: Leave as empty string "".
    5. **Differential Diagnosis**: Primary Diagnosis followed by other potential diagnoses considered.
    6. **Lab Results**: Any tests, vitals, or investigations mentioned.
    7. **Advice**: Diet, lifestyle, follow-up instructions (excluding medicines).
    
    PRESCRIPTION RULES (Critical):
    1. EXTRAPOLATE NOTHING. Only extract drugs explicitly mentioned.
    2. VALIDATE drug names against the provided Dictionary. Fix spellings if close match found.
    3. EXTRACT 4 fields per drug: Name, Dosage, Frequency, Route.
    4. If a field is missing, use "Not specified" or infer strictly from context (e.g. "popping pills" -> Route: Oral).
    
    OUTPUT FORMAT:
    Return strictly JSON matching the schema. NO Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Clinical Transcript:\n${transcript}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjective: { type: Type.STRING },
            objective: { type: Type.STRING },
            assessment: { type: Type.STRING },
            differentialDiagnosis: { type: Type.STRING },
            labResults: { type: Type.STRING },
            advice: { type: Type.STRING },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  route: { type: Type.STRING },
                },
                required: ['name', 'dosage', 'frequency', 'route'],
              },
            },
          },
          required: ['subjective', 'objective', 'assessment', 'medicines', 'advice'],
        },
      },
    });

    return JSON.parse(response.text || 'null') as PrescriptionData;
  } catch (error) {
    console.error("Unified clinical note generation error:", error);
    return null;
  }
};

// FIX: Implemented generateCaseSummary using gemini-2.0-flash
export const generateCaseSummary = async (messages: Message[], language: string, doctorProfile: DoctorProfile): Promise<string> => {
  const systemInstruction = `You are an expert clinical documentalist. Summarize the following doctor-patient conversation into a concise case summary for a medical record. Use ${language}.`;
  const transcript = messages.map(m => `${m.sender}: ${m.text}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: transcript,
      config: { systemInstruction }
    });
    return response.text || "Summary not available.";
  } catch (e) {
    console.error("Summary generation error:", e);
    return "Error generating summary.";
  }
};

// FIX: Implemented getPromptInsights using structured JSON response
export const getPromptInsights = async (prompt: string, doctorProfile: DoctorProfile, language: string): Promise<PromptInsight | null> => {
  const systemInstruction = `Analyze the clinician's prompt and provide 3 key clinical terms, 3 suggestions to refine the prompt for better AI accuracy, and 3 high-value follow-up questions to ask the patient. Output in JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            followUps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['keyTerms', 'suggestions', 'followUps']
        }
      }
    });
    return JSON.parse(response.text || '{}') as PromptInsight;
  } catch (e) {
    console.error("Insights generation error:", e);
    return null;
  }
};

// FIX: Updated streamChatResponse to use the runNexusWorkflow generator and accept parameters
export async function* streamChatResponse(params: {
  message: string;
  history: Message[];
  userRole: UserRole;
  language: string;
  activeGpt?: PreCodedGpt;
  isDoctorVerified: boolean;
  doctorProfile: DoctorProfile;
  knowledgeBaseProtocols: ClinicalProtocol[];
}) {
  yield* runNexusWorkflow({
    message: params.message,
    history: params.history,
    doctorProfile: params.doctorProfile,
    language: params.language,
    activeGpt: params.activeGpt,
    isDoctorVerified: params.isDoctorVerified,
    knowledgeBase: params.knowledgeBaseProtocols,
  });
}
// Enhanced voice edit with natural language understanding
export const processVoiceEdit = async (
  currentData: PrescriptionData,
  command: string,
  doctorProfile: DoctorProfile,
  language: string
): Promise<PrescriptionData | null> => {
  const dictionaryContext = JSON.stringify(prescriptionDictionary);

  const systemInstruction = `
    You are an intelligent Medical Scribe Editor with advanced natural language understanding.
    
    TASK: Interpret the doctor's voice command and update the prescription data accordingly.
    
    CURRENT PRESCRIPTION DATA:
    ${JSON.stringify(currentData, null, 2)}
    
    DOCTOR PROFILE:
    ${JSON.stringify(doctorProfile)}
    
    DICTIONARY REFERENCE:
    ${dictionaryContext}
    
    DOCTOR'S COMMAND:
    "${command}"
    
    CRITICAL FIELD MAPPING RULES:
    
    **FIELD IDENTIFICATION** - Pay close attention to these keywords:
    
    1. **subjective** (Chief Complaint) - Update when command mentions:
       - "symptoms", "complaint", "complaining of", "patient says", "patient has"
       - Examples: "add fever", "patient has headache", "complaining of pain"
    
    2. **objective** (Clinical Findings) - Update when command mentions:
       - "clinical findings", "examination", "vitals", "BP", "pulse", "temperature"
       - "on examination", "findings show", "observed", "physical exam"
       - Examples: "edit clinical findings that patient was having some issue"
                   "BP is 120/80", "on examination abdomen is soft"
    
    3. **differentialDiagnosis** - Update when command mentions:
       - "diagnosis", "condition", "disease", "diagnosed with"
       - Examples: "change diagnosis to diabetes", "diagnosed with hypertension"
    
    4. **labResults** - Update when command mentions:
       - "lab", "test", "investigation", "results", "CBC", "blood test"
       - Examples: "add CBC results", "HbA1c is 7.2"
    
    5. **medicines** - Update when command mentions:
       - "medicine", "drug", "tablet", "prescription", "give", "prescribe"
       - "dosage", "frequency", "route"
       - Examples: "add paracetamol", "make it 500mg", "twice daily"
    
    6. **advice** - Update when command mentions:
       - "advice", "instructions", "follow-up", "diet", "lifestyle"
       - Examples: "advise bed rest", "follow up in 1 week"
    
    INTELLIGENT INTERPRETATION RULES:
    
    1. **Explicit Field Mentions**: If the command explicitly mentions a field name, update THAT field.
       - "edit clinical findings X" → update 'objective' field
       - "change chief complaint to X" → update 'subjective' field
       - "update diagnosis to X" → update 'differentialDiagnosis' field
    
    2. **Infer from Context**: If no explicit field mentioned, infer from keywords:
       - "patient has fever" → 'subjective' (symptom)
       - "BP is 140/90" → 'objective' (vital sign/finding)
       - "diabetes mellitus" → 'differentialDiagnosis' (condition)
    
    3. **Natural Language Patterns**:
       - "change X to Y" → replace X with Y in appropriate field
       - "add X" / "also X" / "include X" → append X to appropriate field
       - "remove X" / "delete X" → remove X from appropriate field
       - "edit X that Y" → update field X with content Y
       - "update X" → modify field X
    
    4. **Medicine-Specific Intelligence**:
       - Validate drug names against dictionary
       - If only dosage/frequency mentioned, apply to last medicine
       - Smart defaults: route="Oral", frequency="As directed"
    
    5. **Multi-field Updates**: Commands can affect multiple fields
       - "patient has fever, BP is 140/90" → update both subjective AND objective
    
    6. **Maintain Language**: Keep output in ${language} script where applicable.
    
    7. **Return Format**: Return ONLY the updated JSON. NO explanations.
    
    EXAMPLES OF CORRECT FIELD MAPPING:
    - "edit clinical findings that patient was having some issue" → update 'objective'
    - "add fever to symptoms" → update 'subjective'
    - "change diagnosis to hypertension" → update 'differentialDiagnosis'
    - "BP is 120/80" → update 'objective'
    - "patient complains of headache" → update 'subjective'
    - "add paracetamol 500mg" → update 'medicines'
    - "advise rest for 3 days" → update 'advice'
    
    BE PRECISE: Match the command to the correct field based on medical context and keywords.
  `;

  try {
    console.log('[Voice Edit] Processing command:', command);
    console.log('[Voice Edit] Current data:', currentData);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Apply this edit command: ${command}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1, // Slightly higher for better natural language understanding
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjective: { type: Type.STRING },
            objective: { type: Type.STRING },
            assessment: { type: Type.STRING },
            differentialDiagnosis: { type: Type.STRING },
            labResults: { type: Type.STRING },
            advice: { type: Type.STRING },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  route: { type: Type.STRING },
                },
                required: ['name', 'dosage', 'frequency', 'route'],
              },
            },
          },
          required: ['subjective', 'objective', 'assessment', 'medicines', 'advice'],
        },
      },
    });

    const result = JSON.parse(response.text || 'null') as PrescriptionData;
    console.log('[Voice Edit] Result:', result);
    return result;
  } catch (error) {
    console.error("Voice edit processing error:", error);
    return null;
  }
};
