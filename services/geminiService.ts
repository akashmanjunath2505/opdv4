
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

// ... (existing exports)

// Helper: Transcribe a short audio command using Gemini (fallback for Web Speech API)
export const transcribeAudioCommand = async (
  base64Audio: string,
  mimeType: string,
  language: string
): Promise<string | null> => {
  // Force English model for command understanding if preferred, or use polyglot
  // Command transcription needs to be verbatim
  const systemInstruction = `
    You are a speech-to-text engine. 
    TASK: Transcribe the following audio command EXACTLY as spoken.
    
    CONTEXT: This is a medical doctor giving a command to a scribe software (e.g., "Change age to 45", "Add diabetes to diagnosis").
    
    LANGUAGE: ${language}.
    
    OUTPUT: Return ONLY the raw transcribed text. Do not add quotes, prefixes, or markdown.
  `;

  try {
    const audioPart = {
      inlineData: { data: base64Audio, mimeType },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [audioPart, { text: "Transcribe this command." }] },
      config: {
        systemInstruction,
        temperature: 0,
      },
    });

    return response.text ? response.text.trim() : null;
  } catch (error) {
    console.error("Command transcription error:", error);
    return null;
  }
};

// FIX: Updated model name to latest version according to guidelines
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

    TASK: Perform a two - pass transcription for this clinical audio segment.

      PASS 1(Phonetic Capture): Capture raw speech verbatim.Handle code - switching(e.g., Hindi + English) and regional accents naturally.
        PASS 2(Semantic & Medical Normalization): Refine the raw capture into professional clinical text.
    - Normalize regional terms(e.g., "chakkar" to "dizziness/vertigo", "bukhaar" to "fever").
    - Correct medical terms and medication names.
    - Maintain the primary language script of the speaker but ensure clinical clarity.

    DIARIZATION: Identify "Doctor" and "Patient".
      CONTEXT: Use previous dialogue for speaker consistency: "${previousContext}"
    
    LANGUAGE DETECTION & SCRIPT: 
    ${language === 'Auto-detect'
      ? 'Automatically detect the language of each speaker turn. Use native scripts (Devanagari, Tamil, etc.).'
      : `Primary Language Hint: ${language}. Preferably use the native script for ${language}, but automatically detect and handle other languages if the speaker switches.`
    }
  - Use Devanagari for Hindi / Marathi, Tamil script for Tamil, etc.
    - For English medical terms interleaved in native speech, keep them in English / Roman script if that's standard clinical practice in India.

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
  1. Remove filler words(um, ah, like, you know).
    2. Correct diarization errors if they seem obvious.
    3. CRITICAL: Correct any misspelled medical terms, symptoms, or medications using the provided dictionary as a reference.
  4. HARD RULE: Do NOT add any medications that were not explicitly mentioned in the raw transcript.Only correct spellings of mentioned ones.
    5. ${language === 'Auto-detect' ? 'Use the primary language(s) detected in the transcript.' : `Keep the output strictly in the native script of ${language}.`}
  6. Maintain the original meaning and conversational flow, but make it professional.
    
    DICTIONARY REFERENCE:
    ${dictionaryContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Raw Transcript: \n${transcript} `,
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
    4. LAB RESULTS: List any lab test values, vital signs(BP, PR, SpO2, Temp), or investigation reports mentioned.
    5. ASSESSMENT: Leave this section empty.
    6. DIFFERENTIAL DIAGNOSIS: List the Primary Diagnosis first, followed by other potential diagnoses that are being considered.
    7. DO NOT include a "Plan" or "Prescription" section here.
    8. NO markdown formatting within sections(bold / italics).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Cleaned Transcript: \n${cleanedTranscript} `,
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
    TASK: Extract and format the medication plan(Prescription) from the transcript.
    
    REFERENCE DATA:
  - Dictionary: ${dictionaryContext}
  - Clinical Protocols: ${protocolsContext}

  RULES:
  1. HEADER: Use "## Plan".
    2. HARD RULE: Only extract drugs and advice(diet, follow - up, warnings, etc.) that were EXPLICITLY mentioned in the cleaned transcript.Do NOT hallucinate, suggest, or recommend any additional drugs or advice that were not stated by the clinician.
    3. VALIDATION RULE: You MUST validate and extract four parameters for every medication:
    - Name: Validate against the Dictionary.
       - Dosage: Extract the specific dose mentioned(e.g., 500mg, 1 tablet).
       - Frequency: Extract how often(e.g., once daily, BD).
       - Route: Extract the route(e.g., Oral, IV).
    4. MEDICINE FORMAT: "- Medicine Name | Dosage | Frequency | Route".
    Example: "- Paracetamol | 500mg | Twice daily | Oral"
       If a parameter is missing, mark it as "Not specified".
  5. ADVICE: List all other clinician - stated instructions in short bullet points.
    6. ACCURACY: Cross - reference with the Dictionary and Clinical Protocols only for spelling and dosage validation of mentioned items.
    7. LANGUAGE: ${language === 'Auto-detect' ? 'Use the primary language(s) detected in the transcript.' : `Write strictly in the native script of ${language}.`}
  8. NO markdown formatting within sections(bold / italics).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Cleaned Transcript: \n${cleanedTranscript} `,
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

    TASK: Analyze the raw clinical transcript and generate a structured clinical note(SOAP + Prescription) in a SINGLE pass.
    
    INPUT CONTEXT:
  - Raw Transcript of Doctor - Patient conversation.
    - Doctor Profile: ${JSON.stringify(doctorProfile)}
    
    REFERENCE DATA:
  - Drug Dictionary: ${dictionaryContext}
  - Clinical Protocols: ${protocolsContext}
    
    LANGUAGE RULE:
    ${language === 'Auto-detect' ? 'Detect the primary language used by the doctor. Write the output in that language (using native script if applicable, e.g., Devanagari for Hindi).' : `Write the output strictly in ${language} (using native script where applicable).`}
    
    GENERATION RULES:
  1. ** Cleanup First **: Internally clean the transcript to remove fillers and correct medical terms before extraction.
    2. ** Subjective **: Summarize patient's complaints/symptoms and history. If available, structure it with short labels like:
       - "History:"
       - "Past Medical History:"
       - "Past Investigations/Records:"
       IMPORTANT: Any lab value/investigation/report mentioned as being done in the past MUST be placed under "Past Investigations/Records" (or "Past Medical History"), NOT in Objective.
    3. ** Objective (Clinical Findings/Examination) **: Only include measurements or observations from the CURRENT visit. Do NOT include past investigations. ** CRITICAL **: Always include units and symbols for all measurements:
    - Blood Pressure: "BP: 120/80 mmHg"
      - Temperature: "Temp: 98.6°F" or "37°C"
        - Heart Rate: "HR: 72 bpm" or "Pulse: 72/min"
          - Respiratory Rate: "RR: 18/min"
            - SpO2: "SpO2: 98%"
              - Weight: "Weight: 70 kg"
                - Height: "Height: 170 cm"
                  - Any other measurements with appropriate units
  4. ** Assessment **: Leave as empty string "".
    5. ** Differential Diagnosis **: Primary diagnosis followed by other potential diagnoses considered. Apply the following reasoning rules:
       - Symptom Classification: Label key symptoms as Typical or Atypical based on history details (location, radiation, exertion, associated symptoms).
       - If symptoms are atypical but risk factors are significant, use: "Atypical [symptom]; [serious etiology] to be ruled out given risk factors."
       - Avoid contradictions (e.g., do not call symptoms typical if history is atypical).
       - Preserve clinical reasoning: low red flags ≠ no risk; risk factors modify concern, not symptom type.
    6. ** Lab Results **: Only include tests/vitals/investigations performed or reported in the CURRENT visit. Past results must be in Subjective under "Past Investigations/Records".
    7. ** Advice **: Diet, lifestyle, follow - up instructions(excluding medicines).
    8. ** Default Principle **: Prioritize clinical accuracy > completeness > verbosity when unsure.
    
    PRESCRIPTION RULES(Critical):
  1. EXTRAPOLATE NOTHING.Only extract drugs explicitly mentioned.
    2. VALIDATE drug names against the provided Dictionary.Fix spellings if close match found.
    3. EXTRACT 4 fields per drug: Name, Dosage, Frequency, Route.
    4. If a field is missing, use "Not specified" or infer strictly from context(e.g. "popping pills" -> Route: Oral).
    
    OUTPUT FORMAT:
    Return strictly JSON matching the schema.NO Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Clinical Transcript: \n${transcript} `,
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
  const systemInstruction = `You are an expert clinical documentalist.Summarize the following doctor - patient conversation into a concise case summary for a medical record.Use ${language}.`;
  const transcript = messages.map(m => `${m.sender}: ${m.text} `).join('\n');

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
    You are an AI Medical Scribe Editor with expert clinical judgment.

    **GOAL**: Intelligently modify the Patient Prescription Data based on the doctor's verbal commands. You must handle natural language, messy phrasing, and implicit context with high accuracy.

    **CURRENT CONTEXT (Prescription Data)**:
    ${JSON.stringify(currentData, null, 2)}

    **COMMAND**: "${command}"

    **YOUR REASONING PROCESS**:
    1. **Analyze Intent**: Does the user want to ADD info, CHANGE info, or REMOVE info?
    2. **Identify Field**: Map the medical concept to the correct field intelligently.
       - "Patient complains of..." / "Symptoms" -> \`subjective\`
       - "On examination..." / "Found..." / "Signs" -> \`objective\`
       - "Diagnosis is..." / "It's actually..." (Medical Condition) -> \`differentialDiagnosis\`
       - "Lab shows..." / "Reports..." -> \`labResults\`
       - "Prescribe..." / "Give..." / "Add drug..." -> \`medicines\`
       - "Advice..." / "Patient should..." -> \`advice\`
    3. **Determine Action Type**:
       - \`APPEND\`: Default for adding new information to text fields. preserving existing notes.
       - \`UPDATE\`: Use ONLY when the user explicitly wants to *change*, *replace*, or *correct* a specific field (e.g., "Change diagnosis to...", "Correction, he has...").
       - \`ADD_MEDICINE\`: For new prescriptions.
       - \`UPDATE_LAST_MEDICINE\`: For corrections to the most recently added medication (e.g., "Make that 500mg").
       - \`REMOVE\`: When user says "Delete", "Remove", "No, not that".

    **CLINICAL LOGIC RULES**:
    - **Time Awareness**: Only include CURRENT visit findings in \`objective\`. Past labs/investigations belong in \`subjective\` under "Past Investigations/Records" (or "Past Medical History").
    - **Symptom vs. Diagnosis**: If the doctor says "Patient has Diabetes", that is a **Diagnosis** (\`differentialDiagnosis\`). If they say "Patient has a headache", that is a **Symptom** (\`subjective\`). Use your medical knowledge.
    - **Symptom Classification**: If a symptom is described (e.g., chest discomfort), label it as Typical or Atypical based on history details. If atypical with significant risk factors, ensure assessment uses: "Atypical [symptom]; [serious etiology] to be ruled out given risk factors."
    - **Preserve Reasoning**: Low immediate red flags ≠ no risk. Risk factors modify concern, not symptom type.
    - **Implicit Context**: If the command is "Make it 500mg", assume they are talking about the *last added medicine*.
    - **Formatting**: Ensure your \`value\` output is clean, capitalized, and professional (e.g., "diabetes" -> "Type 2 Diabetes Mellitus" if appropriate context allows, otherwise keep it faithful).
    - **Clinical Findings with Units**: When adding/updating \`objective\` field, ALWAYS include proper units:
      * BP: "120/80 mmHg", Temp: "98.6°F", HR: "72 bpm", RR: "18/min", SpO2: "98%", Weight: "70 kg", Height: "170 cm"
      * If doctor says "BP is 120 by 80", format as "BP: 120/80 mmHg"
      * If doctor says "temperature 98", format as "Temp: 98°F"

    **OUTPUT FORMAT (JSON)**:
    {
      "thought_process": "Brief explanation of why you chose this action.",
      "actions": [
        {
          "type": "UPDATE" | "APPEND" | "ADD_MEDICINE" | "REMOVE" | "UPDATE_LAST_MEDICINE",
          "field": "subjective" | "objective" | "differentialDiagnosis" | "labResults" | "medicines" | "advice",
          "value": { "text": "..." } OR { "name": "...", "dosage": "...", ... }
        }
      ]
    }

    **EXAMPLES**:

    *Input*: "Patient also has a mild fever." (Context: Subjective has text)
    *Output*: {
      "thought_process": "Adding a symptom to existing list.",
      "actions": [{ "type": "APPEND", "field": "subjective", "value": { "text": "Mild fever" } }]
    }

    *Input*: "Actually, change the diagnosis to Viral Pharyngitis."
    *Output*: {
      "thought_process": "User explicitly requested a change/replacement of the diagnosis.",
      "actions": [{ "type": "UPDATE", "field": "differentialDiagnosis", "value": { "text": "Viral Pharyngitis" } }]
    }

    *Input*: "Start Amoxicillin 500mg three times a day for 5 days."
    *Output*: {
      "thought_process": "Prescribing a new antibiotic.",
      "actions": [{ "type": "ADD_MEDICINE", "field": "medicines", "value": { "name": "Amoxicillin", "dosage": "500mg", "frequency": "TDS (3 times daily)", "route": "Oral" } }]
    }

    *Input*: "No, make that 650mg." (Context: Just added Paracetamol)
    *Output*: {
      "thought_process": "Correcting the dosage of the last medicine.",
      "actions": [{ "type": "UPDATE_LAST_MEDICINE", "field": "medicines", "value": { "dosage": "650mg" } }]
    }

    *Input*: "Remove the fever finding."
    *Output*: {
       "thought_process": "User wants to remove specific text. I will use REMOVE (or UPDATE if it's the only text, but the code handles detailed removal logic best via UPDATE often, but let's stick to Schema actions).",
       "actions": [{ "type": "REMOVE", "field": "objective", "value": { "name": "fever" } }]
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
                },
                required: ["type", "field", "value"]
              }
            }
          },
          required: ["thought_process", "actions"]
        }
      }
    });

    const responseText = response.text;
    console.log('[Voice Edit] Raw Response:', responseText);

    if (!responseText) return null;

    // Robust JSON parsing
    let cleanJson = responseText.replace(/```json\n?|```/g, '').trim();
    // If it starts with non-json, try to find the first { and last }
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    let result;
    try {
      result = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Voice Edit JSON:", e, cleanJson);
      return null;
    }

    console.log('[Voice Edit] Parsed Result:', result);

    // Apply actions to currentData locally
    const newData = { ...currentData }; // Shallow copy
    newData.medicines = [...currentData.medicines]; // Deep copy array

    if (result.actions && Array.isArray(result.actions)) {
      for (const action of result.actions) {
        console.log('[Voice Edit] Applying Action:', action);

        if (action.field === 'medicines') {
          if (action.type === 'ADD_MEDICINE') {
            const newMed = {
              name: action.value.name || 'Unknown',
              dosage: action.value.dosage || 'As prescribed',
              frequency: action.value.frequency || 'As directed',
              route: action.value.route || 'Oral'
            };
            console.log('[Voice Edit] Adding Medicine:', newMed);
            newData.medicines.push(newMed);
          } else if (action.type === 'UPDATE_LAST_MEDICINE') {
            if (newData.medicines.length > 0) {
              const lastMed = newData.medicines[newData.medicines.length - 1];
              newData.medicines[newData.medicines.length - 1] = { ...lastMed, ...action.value };
              console.log('[Voice Edit] Updated Last Medicine:', newData.medicines[newData.medicines.length - 1]);
            }
          } else if (action.type === 'REMOVE') {
            newData.medicines = newData.medicines.filter(m => m.name.toLowerCase() !== action.value.name?.toLowerCase());
            console.log('[Voice Edit] Removed Medicine:', action.value.name);
          }
        } else {
          // Text fields
          // Fix: Handle cases where value is an object or string
          let textValue = '';
          if (typeof action.value === 'string') {
            textValue = action.value;
          } else if (action.value && typeof action.value === 'object') {
            textValue = action.value.text || action.value.value || action.value.name || '';
          }

          // Ensure we have a string
          textValue = String(textValue || '');

          console.log(`[Voice Edit] Text Field Update: Field=${action.field}, Type=${action.type}, Value="${textValue}"`);

          if (!textValue && action.type !== 'REMOVE') {
            console.warn('[Voice Edit] Warning: textValue is empty for action:', action);
          }

          if (action.type === 'UPDATE') {
            (newData as any)[action.field] = textValue;
          } else if (action.type === 'APPEND') {
            let currentText = (newData as any)[action.field] || '';

            // Clean placeholders before appending
            const placeholders = ["Not specified", "Not specified.", "None identified.", "None identified", "N/A", "N/A."];
            if (placeholders.some(p => p.toLowerCase() === currentText.trim().toLowerCase())) {
              currentText = '';
            }

            const separator = currentText.endsWith('.') || currentText === '' ? ' ' : ', ';
            (newData as any)[action.field] = currentText ? `${currentText.trim()}${separator}${textValue}` : textValue;
          } else if (action.type === 'REMOVE') {
            if (textValue) {
              const currentText = (newData as any)[action.field] || '';
              // Escape regex special characters
              const escapedText = textValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(escapedText, 'gi');
              let cleaned = currentText.replace(regex, '');
              // cleanup punctuation
              cleaned = cleaned.replace(/,\s*,/g, ', ').replace(/\s\s+/g, ' ');
              cleaned = cleaned.replace(/^[\s,.]+/, '').replace(/[\s,]+$/, '');
              (newData as any)[action.field] = cleaned;
            } else {
              (newData as any)[action.field] = ''; // Clear if no value
            }
          } else {
            console.warn('[Voice Edit] Warning: Unknown action type for text field:', action.type);
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
