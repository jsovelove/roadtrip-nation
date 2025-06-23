// Import cloud function service instead of direct OpenAI
import { identifyQA as cloudIdentifyQA, generateChapterMarkers as cloudGenerateChapterMarkers } from './cloudFunctionService';

/**
 * Analyzes a transcript to identify question and answer segments
 * @param {string} transcript - The full interview transcript
 * @returns {Promise<Array>} - Array of identified Q&A segments
 */
export async function identifyQA(transcript) {
  // Use cloud function instead of direct OpenAI API call
  return await cloudIdentifyQA(transcript);
}

/**
 * Generates chapter markers based on the interview content
 * @param {string} transcript - The full interview transcript
 * @param {Array} qaSegments - Previously identified Q&A segments (optional)
 * @param {Array} identifiedThemes - Previously identified themes (optional)
 * @returns {Promise<Array>} - Array of chapter markers
 */
export async function generateChapterMarkers(transcript, qaSegments = [], identifiedThemes = []) {
  // Use cloud function instead of direct OpenAI API call
  return await cloudGenerateChapterMarkers(transcript, qaSegments, identifiedThemes);
}

export default {
  identifyQA,
  generateChapterMarkers
}; 