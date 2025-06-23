import { analyzeTopicDistribution as cloudAnalyzeTopicDistribution, categorizeChaptersWithAI as cloudCategorizeChaptersWithAI } from './cloudFunctionService';
import { getAllLeaders, getTranscriptText } from './leaderService';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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
    
    // Prepare data to send to cloud function
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
    
    // Use cloud function for OpenAI analysis
    const result = await cloudAnalyzeTopicDistribution(validSummaries);
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
              // For now, skip the enhanced analysis until we have a dedicated cloud function
        result = topicDistribution;
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
        const chaptersData = defaultVersion.chapterMarkers.map((marker, index) => ({
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
        
        const result = await cloudCategorizeChaptersWithAI(chaptersData, topicsData);
        
        // Map the categorization results back to the original chapter markers
        chapterMarkers = defaultVersion.chapterMarkers.map((marker, index) => {
          const categorizedChapter = result.categorizedChapters.find(
            c => c.id === index.toString()
          );
          
          return {
            ...marker,
            matchedTopics: categorizedChapter?.matchedTopics || []
          };
        });
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