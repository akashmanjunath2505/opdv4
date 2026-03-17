import { TranscriptEntry } from '../types';

// Minimum number of non-whitespace characters required to treat a transcript as meaningful
const MIN_MEANINGFUL_CHARS = 40;

export const hasMeaningfulTranscript = (entries: TranscriptEntry[]): boolean => {
    if (!entries || entries.length === 0) return false;
    const text = entries.map(e => e.text || '').join(' ').replace(/\s+/g, ' ').trim();
    return text.length >= MIN_MEANINGFUL_CHARS;
};

export const isTranscriptTooShortForNotes = (entries: TranscriptEntry[]): boolean => {
    return !hasMeaningfulTranscript(entries);
};

