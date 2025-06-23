// Firebase Cloud Functions service for secure OpenAI API calls

const FUNCTIONS_BASE_URL = 'https://us-central1-roadtrip-nation-challenge.cloudfunctions.net'; // Using production functions

// For local development with emulators, change to:
// const FUNCTIONS_BASE_URL = 'http://127.0.0.1:5001/roadtrip-nation-challenge/us-central1';

/**
 * Analyzes a transcript to identify question and answer segments
 * @param {string} transcript - The full interview transcript
 * @returns {Promise<Array>} - Array of identified Q&A segments
 */
export async function identifyQA(transcript) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/identifyQA`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: transcript
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.segments || [];
  } catch (error) {
    console.error("Error calling identifyQA cloud function:", error);
    throw new Error("Failed to analyze transcript. Please try again later.");
  }
}

/**
 * Generates chapter markers based on the interview content
 * @param {string} transcript - The full interview transcript
 * @param {Array} qaSegments - Previously identified Q&A segments (optional)
 * @param {Array} identifiedThemes - Previously identified themes (optional)
 * @returns {Promise<Array>} - Array of chapter markers
 */
export async function generateChapterMarkers(transcript, qaSegments = [], identifiedThemes = []) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/generateChapterMarkers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: transcript,
        qaSegments: qaSegments,
        identifiedThemes: identifiedThemes
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.chapterMarkers || [];
  } catch (error) {
    console.error("Error calling generateChapterMarkers cloud function:", error);
    throw new Error("Failed to generate chapter markers. Please try again later.");
  }
}

/**
 * Analyzes transcript summaries to identify topic distribution
 * @param {Array} transcriptSummaries - Array of transcript summary objects
 * @returns {Promise<Object>} - Object containing topic distribution and key topics
 */
export async function analyzeTopicDistribution(transcriptSummaries) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/analyzeTopicDistribution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcriptSummaries: transcriptSummaries
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling analyzeTopicDistribution cloud function:", error);
    throw new Error("Failed to analyze topic distribution. Please try again later.");
  }
}

/**
 * Categorizes chapters using AI
 * @param {Array} chaptersData - Array of chapter data objects
 * @param {Array} topicsData - Array of topic data objects
 * @returns {Promise<Object>} - Object containing categorized chapters
 */
export async function categorizeChaptersWithAI(chaptersData, topicsData) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/categorizeChaptersWithAI`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chaptersData: chaptersData,
        topicsData: topicsData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling categorizeChaptersWithAI cloud function:", error);
    throw new Error("Failed to categorize chapters. Please try again later.");
  }
}

export default {
  identifyQA,
  generateChapterMarkers,
  analyzeTopicDistribution,
  categorizeChaptersWithAI
}; 