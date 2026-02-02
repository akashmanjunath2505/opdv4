
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
// Enhanced voice edit with natural language understanding and robust delta updates
export const processVoiceEdit = async (
  currentData: PrescriptionData,
  command: string,
  doctorProfile: DoctorProfile,
  language: string
): Promise<PrescriptionData | null> => {
  const dictionaryContext = JSON.stringify(prescriptionDictionary);

  const systemInstruction = `
    You are an intelligent Medical Scribe Editor.
    
    TASK: Interpret the doctor's voice command and return a list of specific EDIT ACTIONS to apply to the prescription.
    
    CURRENT PRESCRIPTION DATA:
    ${JSON.stringify(currentData, null, 2)}
    
    DOCTOR'S COMMAND:
    "${command}"
    
    RETURN FORMAT:
    Return a JSON object with:
    - thought_process: A brief explanation of your reasoning.
    - actions: An array of action objects.

    Each action must have:
    - type: "UPDATE" | "APPEND" | "ADD_MEDICINE" | "REMOVE"
    - field: "subjective" | "objective" | "differentialDiagnosis" | "labResults" | "advice" | "medicines"
    - value: (string for text fields, object for medicines)
    
    RULES:
    1. **UPDATE**: Replaces the entire content of a text field. Use for "change diagnosis to X".
    2. **APPEND**: Adds text to the end of a text field. Use for "add fever" (appends "Fever").
    3. **ADD_MEDICINE**: Adds a new medicine to the 'medicines' array. Value must refer to { name, dosage, frequency, route }.
    4. **REMOVE**: Removes an item. For text fields, specifying a value usually implies removing that text, but for simplicity, use UPDATE to clear or change text. For medicines, "REMOVE" with a value (drug name) removes that drug.
    
    FIELD MAPPING:
    - "clinical findings", "examination" -> "objective"
    - "diagnosis" -> "differentialDiagnosis"
    - "symptoms", "complaints" -> "subjective"
    
    EXAMPLES:
    Command: "Add fever to symptoms"
    Output: { 
      "thought_process": "User explicitly asked to add a symptom to subjective.",
      "actions": [{ "type": "APPEND", "field": "subjective", "value": "Fever" }] 
    }
    
    Command: "Change diagnosis to Diabetes"
    Output: { 
      "thought_process": "User asked to change the diagnosis. This is an UPDATE to differentialDiagnosis.",
      "actions": [{ "type": "UPDATE", "field": "differentialDiagnosis", "value": "Diabetes Mellitus" }] 
    }
    
    Command: "Add Paracetamol 500mg twice daily"
    Output: { 
      "thought_process": "User adding a new medicine.",
      "actions": [{ "type": "ADD_MEDICINE", "field": "medicines", "value": { "name": "Paracetamol", "dosage": "500mg", "frequency": "Twice Daily", "route": "Oral" } }] 
    }
    
    Command: "Edit clinical findings that patient has mild tenderness"
    Output: { 
      "thought_process": "User wants to edit objective findings.",
      "actions": [{ "type": "UPDATE", "field": "objective", "value": "Mild tenderness present" }] 
    }
    
    Command: "Actually make it 650mg" (Context: last medicine was Paracetamol)
    Output: { 
      "thought_process": "User correcting the dosage of the last added medicine.",
      "actions": [{ "type": "UPDATE_LAST_MEDICINE", "field": "medicines", "value": { "dosage": "650mg" } }] 
    }
  `;

  try {
    console.log('[Voice Edit] Processing command:', command);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Command: ${command}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thought_process: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["UPDATE", "APPEND", "ADD_MEDICINE", "REMOVE", "UPDATE_LAST_MEDICINE"] },
                  field: { type: Type.STRING, enum: ["subjective", "objective", "assessment", "differentialDiagnosis", "labResults", "advice", "medicines"] },
                  value: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      name: { type: Type.STRING },
                      dosage: { type: Type.STRING },
                      frequency: { type: Type.STRING },
                      route: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
          required: ["thought_process", "actions"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) return null;

    const result = JSON.parse(responseText);
    console.log('[Voice Edit] AI Actions:', result);

    // Apply actions to currentData locally
    const newData = { ...currentData }; // Shallow copy
    newData.medicines = [...currentData.medicines]; // Deep copy array

    if (result.actions && Array.isArray(result.actions)) {
      for (const action of result.actions) {
        if (action.field === 'medicines') {
          if (action.type === 'ADD_MEDICINE') {
            newData.medicines.push({
              name: action.value.name || 'Unknown',
              dosage: action.value.dosage || 'As prescribed',
              frequency: action.value.frequency || 'As directed',
              route: action.value.route || 'Oral'
            });
          } else if (action.type === 'UPDATE_LAST_MEDICINE') {
            if (newData.medicines.length > 0) {
              const lastMed = newData.medicines[newData.medicines.length - 1];
              newData.medicines[newData.medicines.length - 1] = { ...lastMed, ...action.value };
            }
          } else if (action.type === 'REMOVE') {
            newData.medicines = newData.medicines.filter(m => m.name.toLowerCase() !== action.value.name?.toLowerCase());
          }
        } else {
          // Text fields
          const textValue = action.value.text || (typeof action.value === 'string' ? action.value : '');

          if (action.type === 'UPDATE') {
            (newData as any)[action.field] = textValue;
          } else if (action.type === 'APPEND') {
            const currentText = (newData as any)[action.field] || '';
            (newData as any)[action.field] = currentText ? `${currentText}, ${textValue}` : textValue;
          }
        }
      }
    }

    console.log('[Voice Edit] Updated Data:', newData);
    return newData;

  } catch (error) {
    console.error("Voice edit processing error:", error);
    return null;
  }
};
