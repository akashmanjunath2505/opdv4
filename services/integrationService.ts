
import { PrescriptionData, Medicine, DoctorProfile, PatientDemographics } from '../types';

// Helper to generate a UUID-like string
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const convertToFhir = (
    data: PrescriptionData,
    doctorProfile: DoctorProfile,
    patient: PatientDemographics,
    encounterId: string = generateUUID()
) => {
    // Generate a consistent patient ID based on name if possible, else random
    const patientId = `patient-${patient.name.replace(/\s+/g, '-').toLowerCase()}-${generateUUID().substring(0, 4)}`;
    const practitionerId = `practitioner-doctor`;

    const timestamp = new Date().toISOString();

    // Basic FHIR Bundle
    const bundle: any = {
        resourceType: "Bundle",
        type: "document",
        timestamp: timestamp,
        identifier: {
            system: "urn:ietf:rfc:3986",
            value: `urn:uuid:${generateUUID()}`
        },
        entry: []
    };

    // 1. Composition (The Clinical Document Header)
    const composition = {
        resourceType: "Composition",
        id: generateUUID(),
        status: "final",
        type: {
            coding: [{
                system: "http://loinc.org",
                code: "11503-0",
                display: "Medical records"
            }]
        },
        subject: { reference: `Patient/${patientId}`, display: patient.name },
        date: timestamp,
        author: [{ reference: `Practitioner/${practitionerId}`, display: "Doctor" }],
        title: "Clinical Consultation Note",
        section: [] as any[]
    };

    // 2. Add Sections (Subjective, Objective, Assessment, Plan -> SOAP)

    // Subjective
    if (data.subjective) {
        composition.section.push({
            title: "Subjective",
            code: { coding: [{ system: "http://loinc.org", code: "61150-3", display: "Subjective Narrative" }] },
            text: { status: "generated", div: `<div xmlns="http://www.w3.org/1999/xhtml">${data.subjective}</div>` }
        });
    }

    // Objective
    if (data.objective) {
        composition.section.push({
            title: "Objective",
            code: { coding: [{ system: "http://loinc.org", code: "61149-5", display: "Objective Narrative" }] },
            text: { status: "generated", div: `<div xmlns="http://www.w3.org/1999/xhtml">${data.objective}</div>` }
        });
    }

    // Assessment / Differential Diagnosis
    if (data.differentialDiagnosis) {
        composition.section.push({
            title: "Assessment",
            code: { coding: [{ system: "http://loinc.org", code: "51848-0", display: "Assessment" }] },
            text: { status: "generated", div: `<div xmlns="http://www.w3.org/1999/xhtml">${data.differentialDiagnosis}</div>` }
        });
    }

    // Plan (Advice + Medicines)
    const planDiv = `
        <div xmlns="http://www.w3.org/1999/xhtml">
            <h3>Advice</h3>
            <p>${data.advice}</p>
            <h3>Medications</h3>
            <ul>
                ${data.medicines.map(m => `<li>${m.name} - ${m.dosage} - ${m.frequency} (${m.route})</li>`).join('')}
            </ul>
        </div>
    `;

    composition.section.push({
        title: "Plan",
        code: { coding: [{ system: "http://loinc.org", code: "18776-5", display: "Plan of care note" }] },
        text: { status: "generated", div: planDiv }
    });

    bundle.entry.push({ resource: composition });

    // 3. MedicationRequests (One per medicine)
    data.medicines.forEach(med => {
        const medRequest = {
            resourceType: "MedicationRequest",
            id: generateUUID(),
            status: "active",
            intent: "order",
            medicationCodeableConcept: {
                text: med.name
            },
            subject: { reference: `Patient/${patientId}` },
            encounter: { reference: `Encounter/${encounterId}` },
            dosageInstruction: [{
                text: `${med.dosage} ${med.frequency}`,
                route: { text: med.route },
                timing: {
                    code: { text: med.frequency } // Ideally mapped to SNOMED CT
                }
            }]
        };
        bundle.entry.push({ resource: medRequest });
    });

    // 4. Add Patient Resource
    bundle.entry.push({
        resource: {
            resourceType: "Patient",
            id: patientId,
            name: [{ text: patient.name }],
            gender: patient.sex.toLowerCase() === 'male' ? 'male' : patient.sex.toLowerCase() === 'female' ? 'female' : 'other',
            birthDate: "1980-01-01", // Placeholder, calculated from age usually
            telecom: [{ system: "phone", value: patient.mobile }],
            extension: [
                { url: "http://veda.com/age", valueString: patient.age },
                { url: "http://veda.com/weight", valueString: patient.weight },
                { url: "http://veda.com/height", valueString: patient.height },
                { url: "http://veda.com/bmi", valueString: patient.bmi }
            ]
        }
    });

    // 5. Add Practitioner Resource
    bundle.entry.push({
        resource: {
            resourceType: "Practitioner",
            id: practitionerId,
            name: [{ text: "Dr. Akash" }], // Hardcoded based on mockup context, or pass from prop
            qualification: [{ code: { text: doctorProfile.qualification } }]
        }
    });

    return bundle;
};

export const exportToJson = (data: PrescriptionData) => {
    return JSON.stringify(data, null, 2);
};

export const downloadData = (data: any, type: 'fhir' | 'json', filename: string) => {
    let content = "";
    let mimeType = "";

    if (type === 'fhir') {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/fhir+json";
    } else {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const sendToEmr = async (data: any, endpoint: string = 'http://localhost:3001/api/webhook') => {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`EMR Sync Failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to sync with EMR:", error);
        throw error;
    }
};
