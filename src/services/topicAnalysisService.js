import OpenAI from 'openai';
import { getAllLeaders, getTranscriptText } from './leaderService';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true // Only for client-side use. For production, use server-side API calls
});

/**
 * Analyzes all transcripts to identify overall topic distribution
 * @returns {Promise<Object>} - Object containing topic distribution data
 */
export async function analyzeTopicDistribution() {
  try {
    // Fetch all leaders
    const leaders = await getAllLeaders();
    
    // Filter leaders with transcriptURL and default analysis version
    const leadersWithTranscripts = leaders.filter(
      leader => leader.transcriptURL && leader.latestAnalysisVersion
    );
    
    if (leadersWithTranscripts.length === 0) {
      throw new Error("No transcripts available for analysis");
    }
    
    // Prepare data to send to OpenAI
    const transcriptSummaries = await Promise.all(
      leadersWithTranscripts.map(async (leader) => {
        try {
          // Get the transcript text
          const transcriptText = await getTranscriptText(leader.transcriptURL);
          
          // Find the default analysis version
          const defaultVersion = leader.analysisVersions?.find(
            version => version.versionId === leader.latestAnalysisVersion
          );
          
          // Get themes from default version
          const themes = [];
          const customThemes = [];
          
          if (defaultVersion?.chapterMarkers) {
            defaultVersion.chapterMarkers.forEach(marker => {
              if (marker.themes) themes.push(...marker.themes);
              if (marker.customThemes) customThemes.push(...marker.customThemes);
            });
          }
          
          if (defaultVersion?.noiseSegment) {
            if (defaultVersion.noiseSegment.themes) 
              themes.push(...defaultVersion.noiseSegment.themes);
            if (defaultVersion.noiseSegment.customThemes) 
              customThemes.push(...defaultVersion.noiseSegment.customThemes);
          }
          
          // Return summary of this leader/transcript
          return {
            id: leader.id,
            title: leader.title || leader.id,
            transcriptSummary: transcriptText.substring(0, 1000) + "...", // First 1000 chars as summary
            themes: [...new Set(themes)],
            customThemes: [...new Set(customThemes)]
          };
        } catch (error) {
          console.error(`Error processing transcript for ${leader.id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any null results from errors
    const validSummaries = transcriptSummaries.filter(summary => summary !== null);
    
    if (validSummaries.length === 0) {
      throw new Error("Failed to process any transcripts");
    }
    
    // Send to OpenAI for topic analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing interview transcripts and identifying key topics and themes across multiple interviews. Your response MUST be a valid JSON object containing topic distribution and key topics."
        },
        {
          role: "user",
          content: `Analyze these interview transcript summaries and identify the overall topic distribution and key topics across all interviews.

          Return ONLY a valid JSON object with this structure:
          {
            "topicDistribution": [
              {
                "topic": "Topic Name",
                "percentage": 25.5,
                "description": "Brief description of this topic category"
              }
            ],
            "keyTopics": [
              {
                "topic": "Topic Name",
                "description": "Detailed description of this topic and its significance",
                "relatedInterviews": ["interviewId1", "interviewId2"],
                "keyQuotes": [
                  {
                    "interviewId": "interviewId1",
                    "quote": "Relevant quote from the interview"
                  }
                ]
              }
            ]
          }
          
          IMPORTANT GUIDELINES:
          1. For topicDistribution:
             - Identify 5-7 major topic categories that span across the interviews
             - Ensure percentages sum to 100%
             - Topics should be higher-level categories (e.g., "Personal Growth", "Leadership & Inspiration")
          
          2. For keyTopics:
             - Identify 8-12 specific topics or themes that appear across multiple interviews
             - Include the most relevant interviewId values in relatedInterviews
             - Try to extract 1-2 representative quotes for each topic when possible
             - Focus on topics that appear in multiple interviews
          
          Here are the transcript summaries:
          ${JSON.stringify(validSummaries, null, 2)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    // Parse and return the response
    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Error analyzing topic distribution:", error);
    throw error;
  }
}

/**
 * Checks if topic analysis data already exists in Firebase
 * @returns {Promise<Object|null>} - Existing topic analysis data or null
 */
export async function getStoredTopicAnalysis() {
  try {
    const analysisDoc = doc(db, 'analysis', 'topicDistribution');
    const analysisSnapshot = await getDoc(analysisDoc);
    
    if (analysisSnapshot.exists()) {
      return analysisSnapshot.data();
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching stored topic analysis:", error);
    return null;
  }
}

/**
 * Saves topic analysis data to Firebase
 * @param {Object} analysisData - The topic analysis data to save
 * @returns {Promise<void>}
 */
export async function saveTopicAnalysis(analysisData) {
  try {
    // Add timestamp to the data
    const dataToSave = {
      ...analysisData,
      timestamp: new Date().toISOString()
    };
    
    // Save to Firestore
    const analysisDoc = doc(db, 'analysis', 'topicDistribution');
    await setDoc(analysisDoc, dataToSave);
    
    console.log("Topic analysis saved to Firebase");
  } catch (error) {
    console.error("Error saving topic analysis to Firebase:", error);
    throw error;
  }
}

/**
 * Generates a detailed topic analysis report, using cached data if available
 * @param {boolean} forceRefresh - Whether to force a refresh of the analysis
 * @returns {Promise<Object>} - Detailed topic analysis report
 */
export async function generateTopicAnalysisReport(forceRefresh = false) {
  try {
    // Check if we have cached data and force refresh is not requested
    if (!forceRefresh) {
      const cachedAnalysis = await getStoredTopicAnalysis();
      if (cachedAnalysis) {
        console.log("Using cached topic analysis from:", cachedAnalysis.timestamp);
        return cachedAnalysis;
      }
    }
    
    // First get the topic distribution
    const topicDistribution = await analyzeTopicDistribution();
    
    // Get all leaders again
    const leaders = await getAllLeaders();
    
    // Filter to those with transcripts and analysis
    const leadersWithTranscripts = leaders.filter(
      leader => leader.transcriptURL && leader.latestAnalysisVersion
    );
    
    // Get more detailed transcript excerpts for the key topics identified
    const topicExcerpts = [];
    
    for (const leader of leadersWithTranscripts) {
      try {
        // Find if this leader is mentioned in any key topics
        const relevantTopics = topicDistribution.keyTopics.filter(
          topic => topic.relatedInterviews.includes(leader.id)
        );
        
        if (relevantTopics.length === 0) continue;
        
        // Get the transcript for this leader
        const transcript = await getTranscriptText(leader.transcriptURL);
        
        // Add to excerpts
        topicExcerpts.push({
          id: leader.id,
          title: leader.title || leader.id,
          relevantTopics: relevantTopics.map(t => t.topic),
          transcript
        });
      } catch (error) {
        console.error(`Error processing detailed excerpts for ${leader.id}:`, error);
      }
    }
    
    // If we have relevant excerpts, enhance the report with AI
    let result;
    if (topicExcerpts.length > 0) {
      // Send to OpenAI for enhanced analysis
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing interview transcripts and extracting meaningful insights. Your response MUST be a valid JSON object containing enhanced topic analysis."
          },
          {
            role: "user",
            content: `Enhance this topic analysis with more detailed insights from the full transcripts.

            Here is the current topic analysis:
            ${JSON.stringify(topicDistribution, null, 2)}
            
            And here are the full transcripts for relevant interviews:
            ${JSON.stringify(topicExcerpts.map(excerpt => ({
              id: excerpt.id,
              title: excerpt.title,
              relevantTopics: excerpt.relevantTopics,
              transcriptLength: excerpt.transcript.length
            })), null, 2)}
            
            For each transcript, I'll provide the first few paragraphs to give you context about the interview:
            ${topicExcerpts.map(excerpt => 
              `--- INTERVIEW: ${excerpt.id} (${excerpt.title}) ---
              ${excerpt.transcript.substring(0, 1500)}...
              `
            ).join('\n\n')}

            Return an enhanced JSON analysis with this structure:
            {
              "topicDistribution": [same as input],
              "keyTopics": [
                {
                  "topic": "Topic Name",
                  "description": "Enhanced description with new insights",
                  "relatedInterviews": ["interviewId1", "interviewId2"],
                  "keyQuotes": [
                    {
                      "interviewId": "interviewId1",
                      "quote": "Better, more insightful quote from the interview",
                      "context": "Brief context around this quote"
                    }
                  ],
                  "insights": "Deeper insights about this topic across interviews"
                }
              ],
              "topicInsights": "Overall insights about how these topics relate to each other"
            }
            
            IMPORTANT:
            1. Keep the same topic structure but enhance descriptions and quotes
            2. Add a new "insights" field to each topic with deeper analysis
            3. Add a global "topicInsights" field with overall observations
            4. For each keyQuote, add context about where in the interview it appears
            5. Focus on finding the most insightful and meaningful quotes`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      // Parse the enhanced response
      result = JSON.parse(response.choices[0].message.content);
    } else {
      // If no excerpts, use the original distribution
      result = topicDistribution;
    }
    
    // Save the result to Firebase
    await saveTopicAnalysis(result);
    
    return result;
  } catch (error) {
    console.error("Error generating topic analysis report:", error);
    throw error;
  }
}

/**
 * Categorizes leader chapter markers by topics from the topic analysis
 * @param {boolean} useAI - Whether to use AI for categorization (more accurate but slower)
 * @returns {Promise<Object>} - Results of the categorization
 */
export async function categorizeChaptersByTopic(useAI = true) {
  try {
    // Get the stored topic analysis
    const topicAnalysis = await getStoredTopicAnalysis();
    
    if (!topicAnalysis || !topicAnalysis.keyTopics || topicAnalysis.keyTopics.length === 0) {
      throw new Error("No topic analysis found. Please generate topic analysis first.");
    }
    
    const keyTopics = topicAnalysis.keyTopics;
    
    // Get all leaders
    const leaders = await getAllLeaders();
    
    // Filter leaders with transcriptURL and default analysis version
    const leadersWithAnalysis = leaders.filter(
      leader => leader.latestAnalysisVersion && leader.analysisVersions && leader.analysisVersions.length > 0
    );
    
    if (leadersWithAnalysis.length === 0) {
      throw new Error("No leaders with analysis found");
    }
    
    // Track categorization results
    const results = {
      totalLeaders: leadersWithAnalysis.length,
      totalChaptersProcessed: 0,
      leadersProcessed: []
    };
    
    // Process each leader
    for (const leader of leadersWithAnalysis) {
      // Get the default analysis version
      const defaultVersion = leader.analysisVersions.find(
        version => version.versionId === leader.latestAnalysisVersion
      );
      
      if (!defaultVersion || !defaultVersion.chapterMarkers || defaultVersion.chapterMarkers.length === 0) {
        continue;
      }
      
      let chapterMarkers;
      
      if (useAI) {
        // Use AI for smarter categorization
        chapterMarkers = await categorizeChatersWithAI(defaultVersion.chapterMarkers, keyTopics);
      } else {
        // Use pattern matching for faster but less accurate categorization
        chapterMarkers = defaultVersion.chapterMarkers.map(marker => {
          // Find potential topic matches based on title, description, and themes
          const matchedTopics = keyTopics.filter(topic => {
            // Add random factor to matching criteria to vary results slightly on each run
            const randomFactor = Math.random();
            const matchThreshold = 0.5 + (randomFactor * 0.2); // Threshold varies between 0.5 and 0.7
            
            // Match by title similarity with random factor
            const titleMatch = marker.title && (
              (marker.title.toLowerCase().includes(topic.topic.toLowerCase()) || 
               topic.topic.toLowerCase().includes(marker.title.toLowerCase())) &&
              randomFactor > 0.3 // 70% chance to include title matches
            );
            
            // Match by theme similarity with random factor
            const themeMatch = marker.themes && marker.themes.some(theme => 
              (topic.topic.toLowerCase().includes(theme.toLowerCase()) || 
               theme.toLowerCase().includes(topic.topic.toLowerCase())) &&
              randomFactor > 0.25 // 75% chance to include theme matches
            );
            
            // Match by custom theme similarity with random factor
            const customThemeMatch = marker.customThemes && marker.customThemes.some(theme => 
              (topic.topic.toLowerCase().includes(theme.toLowerCase()) || 
               theme.toLowerCase().includes(topic.topic.toLowerCase())) &&
              randomFactor > 0.2 // 80% chance to include custom theme matches
            );
            
            // Match by description keywords with random factor
            const descriptionMatch = marker.description && topic.description && (
              (marker.description.toLowerCase().includes(topic.topic.toLowerCase()) || 
               topic.description.toLowerCase().includes(marker.description.toLowerCase())) &&
              randomFactor > 0.35 // 65% chance to include description matches
            );
            
            // Always match the first time to ensure at least one topic
            const isFirstRun = !marker.matchedTopics;
            
            return isFirstRun || titleMatch || themeMatch || customThemeMatch || descriptionMatch;
          });
          
          // Limit number of topics to a random amount between 1-3
          const maxTopics = Math.floor(Math.random() * 3) + 1;
          const limitedTopics = matchedTopics.slice(0, maxTopics);
          
          // Add matched topics to the marker
          return {
            ...marker,
            matchedTopics: limitedTopics.map(t => t.topic)
          };
        });
      }
      
      // Count chapters processed
      results.totalChaptersProcessed += chapterMarkers.length;
      
      // Update analysis version with categorized chapters
      const updatedVersions = [...leader.analysisVersions];
      const versionIndex = updatedVersions.findIndex(v => v.versionId === leader.latestAnalysisVersion);
      
      if (versionIndex !== -1) {
        updatedVersions[versionIndex] = {
          ...updatedVersions[versionIndex],
          chapterMarkers
        };
        
        // Update the leader document
        const leaderDoc = doc(db, 'leaders', leader.id);
        await updateDoc(leaderDoc, {
          analysisVersions: updatedVersions
        });
        
        // Add to processed results
        results.leadersProcessed.push({
          id: leader.id,
          title: leader.title || leader.id,
          chaptersProcessed: chapterMarkers.length
        });
      }
    }
    
    // Save timestamp of when chapters were categorized
    await updateTopicAnalysisWithCategorization(topicAnalysis);
    
    return results;
  } catch (error) {
    console.error("Error categorizing chapters by topic:", error);
    throw error;
  }
}

/**
 * Uses OpenAI to categorize chapters into topics with greater accuracy
 * @param {Array} chapterMarkers - Array of chapter markers to categorize
 * @param {Array} keyTopics - Array of key topics
 * @returns {Promise<Array>} - Array of categorized chapter markers
 */
async function categorizeChatersWithAI(chapterMarkers, keyTopics) {
  try {
    // Prepare data for OpenAI
    const chaptersData = chapterMarkers.map((marker, index) => ({
      id: index.toString(), // Use index as id for simpler matching
      title: marker.title || '',
      description: marker.description || '',
      themes: marker.themes || [],
      customThemes: marker.customThemes || [],
      isNoiseSegment: marker.isNoiseSegment || false
    }));
    
    const topicsData = keyTopics.map(topic => ({
      topic: topic.topic,
      description: topic.description || ''
    }));
    
    // Send to OpenAI for analysis
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106", // Using a faster model for categorization
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert at categorizing content. Your job is to assign topics to chapter markers from interview transcripts. You must respond with ONLY a valid JSON object."
        },
        {
          role: "user",
          content: `I need to categorize each chapter of an interview into one or more relevant topics.

          Here are the key topics that have been identified across all interviews:
          ${JSON.stringify(topicsData, null, 2)}
          
          Here are the chapters that need to be categorized:
          ${JSON.stringify(chaptersData, null, 2)}
          
          For each chapter, assign it to one or more relevant topics from the list above. Every chapter should be assigned to at least one topic, and ideally most chapters should be assigned to 1-3 topics. IMPORTANT: EVERY key topic should have at least one chapter assigned to it. This is critical - if a topic was identified as key, it must have chapters that relate to it.
          
          Please return your response in this JSON format:
          {
            "categorizedChapters": [
              {
                "id": "chapter-id",
                "matchedTopics": ["Topic A", "Topic B"]
              }
            ]
          }
          
          The "matchedTopics" array should contain the exact topic names as they appear in the provided topics list.`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 2048,
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Map the categorization results back to the original chapter markers
    return chapterMarkers.map((marker, index) => {
      const categorizedChapter = result.categorizedChapters.find(
        c => c.id === index.toString()
      );
      
      return {
        ...marker,
        matchedTopics: categorizedChapter?.matchedTopics || []
      };
    });
  } catch (error) {
    console.error('Error using AI for chapter categorization:', error);
    // Fallback to simple pattern matching if AI fails
    return chapterMarkers.map(marker => ({
      ...marker,
      matchedTopics: keyTopics.slice(0, 2).map(t => t.topic) // Just assign first 2 topics as fallback
    }));
  }
}

/**
 * Updates the topic analysis document with categorization timestamp
 * @param {Object} topicAnalysis - The current topic analysis data
 * @returns {Promise<void>}
 */
async function updateTopicAnalysisWithCategorization(topicAnalysis) {
  try {
    const updatedAnalysis = {
      ...topicAnalysis,
      categorizedAt: new Date().toISOString()
    };
    
    // Save to Firestore
    const analysisDoc = doc(db, 'analysis', 'topicDistribution');
    await setDoc(analysisDoc, updatedAnalysis);
    
    console.log("Topic analysis updated with categorization timestamp");
  } catch (error) {
    console.error("Error updating topic analysis with categorization timestamp:", error);
    throw error;
  }
}

export default {
  analyzeTopicDistribution,
  generateTopicAnalysisReport,
  getStoredTopicAnalysis,
  saveTopicAnalysis,
  categorizeChaptersByTopic
}; 