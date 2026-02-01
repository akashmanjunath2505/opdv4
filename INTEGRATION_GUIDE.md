# Veda Assistant Integration Guide

This guide describes how to integrate the **Veda Assistant** (AI Scribe & Clinical CDSS) with third-party Electronic Medical Record (EMR) systems.

## Overview

Veda Assistant acts as an intelligent layer that captures doctor-patient conversations and converts them into structured clinical data. Integrating this data into your EMR allows you to:
1.  **Auto-fill Progress Notes**: Automatically populate Subjective, Objective, Assessment, and Plan fields.
2.  **Digitize Prescriptions**: Ingest structured medication orders directly.
3.  **Save Time**: Eliminate manual data entry for clinicians.

## Integration Standards

We support two primary export formats:

### 1. HL7 FHIR R4 (Recommended)
We adhere to the **HL7 FHIR R4** standard for interoperability.
- **Output Format**: `application/fhir+json`
- **Resource Type**: `Bundle` (type: `document`)

#### Bundle Structure
| Resource | Purpose |
| :--- | :--- |
| **Composition** | represents the clinical document header and sections (SOAP note). |
| **Patient** | (Reference) Patient demographics. |
| **Encounter** | (Reference) The visit context. |
| **MedicationRequest** | Individual entries for each prescribed drug with dosage instructions. |

### 2. Proprietary JSON Schema
A simplified JSON format is available for systems that do not support FHIR.
- **Output Format**: `application/json`

```json
{
  "subjective": "Patient complaints...",
  "objective": "Clinical findings...",
  "differentialDiagnosis": "Diagnoses...",
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "route": "Oral"
    }
  ],
  "advice": "Diet and lifestyle instructions..."
}
```

## Integration Workflows

### Method A: Manual File Import (Current)
This is the simplest way to allow connectivity without API infrastructure.

1.  **Clinician Action**:
    - Completes the session in Veda Assistant.
    - Clicks **Export FHIR** in the finalization sidebar.
    - Downloads the `.json` file.
2.  **EMR Action**:
    - Your EMR provides an "Import External Note" button.
    - Reads the uploaded JSON file.
    - **Parsing Logic**:
        - Map `Composition.section` texts to your EMR's Note fields.
        - Iterate through `entry` resources to find `MedicationRequest` items and populate your Prescription module.

### Method B: Implementation Recommendations for EMR Developers

To effectively consume our data, we recommend implementing a parser for the `Bundle` resource.

#### parsing_pseudocode.py
```python
def ingest_veda_bundle(bundle_json):
    entries = bundle_json['entry']
    
    # 1. Extract Clinical Note Sections
    composition = next(e['resource'] for e in entries if e['resource']['resourceType'] == 'Composition')
    for section in composition['section']:
        title = section['title'] # e.g., "Subjective", "Plan"
        content = section['text']['div'] # HTML content
        # TODO: Save 'content' to matching EMR field for 'title'

    # 2. Extract Medications
    med_requests = [e['resource'] for e in entries if e['resource']['resourceType'] == 'MedicationRequest']
    for med in med_requests:
        drug_name = med['medicationCodeableConcept']['text']
        dosage = med['dosageInstruction'][0]['text']
        # TODO: Add to EMR Prescription Module
```

## Future Connectivity: Webhook / API
*Note: The Veda client is architected to support direct POST requests to your endpoints.*

If you require a direct API integration:
1.  Provide us with a secure **Webhook Endpoint**.
2.  We will configure the Veda client to `POST` the FHIR Bundle directly to your URL upon session completion.
