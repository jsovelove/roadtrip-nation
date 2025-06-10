import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import axios from 'axios';

/**
 * Fetches all leaders from Firestore
 * @returns {Promise<Array>} - Array of leader documents
 */
export async function getAllLeaders() {
  const leadersCollection = collection(db, 'leaders');
  const leaderSnapshot = await getDocs(leadersCollection);
  return leaderSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Fetches a specific leader by ID
 * @param {string} id - The leader document ID
 * @returns {Promise<Object>} - Leader document data
 */
export async function getLeaderById(id) {
  const leaderDoc = doc(db, 'leaders', id);
  const leaderSnapshot = await getDoc(leaderDoc);
  
  if (!leaderSnapshot.exists()) {
    throw new Error('Leader not found');
  }
  
  return {
    id: leaderSnapshot.id,
    ...leaderSnapshot.data()
  };
}

/**
 * Fetches transcript text from URL
 * @param {string} transcriptUrl - URL to the transcript file
 * @returns {Promise<string>} - The transcript text
 */
export async function getTranscriptText(transcriptUrl) {
  try {
    const response = await axios.get(transcriptUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

/**
 * Add a new analysis version to the leader document
 * @param {string} id - The leader document ID
 * @param {Object} analysisData - Data from OpenAI analysis
 * @returns {Promise<void>}
 */
export async function addAnalysisVersion(id, analysisData) {
  const leaderDoc = doc(db, 'leaders', id);
  const leaderSnapshot = await getDoc(leaderDoc);
  
  if (!leaderSnapshot.exists()) {
    throw new Error('Leader not found');
  }
  
  const leaderData = leaderSnapshot.data();
  const analysisVersions = leaderData.analysisVersions || [];
  
  // Create a new version with timestamp
  const newVersion = {
    ...analysisData,
    timestamp: new Date().toISOString(),
    versionId: `v${analysisVersions.length + 1}`
  };
  
  // Add the new version to the array
  return updateDoc(leaderDoc, { 
    analysisVersions: [...analysisVersions, newVersion],
    latestAnalysisVersion: newVersion.versionId
  });
}

/**
 * Delete an analysis version from a leader document
 * @param {string} id - The leader document ID
 * @param {number} versionIndex - The index of the version to delete
 * @returns {Promise<void>}
 */
export async function deleteAnalysisVersion(id, versionIndex) {
  const leaderDoc = doc(db, 'leaders', id);
  const leaderSnapshot = await getDoc(leaderDoc);
  
  if (!leaderSnapshot.exists()) {
    throw new Error('Leader not found');
  }
  
  const leaderData = leaderSnapshot.data();
  const analysisVersions = [...(leaderData.analysisVersions || [])];
  
  if (versionIndex < 0 || versionIndex >= analysisVersions.length) {
    throw new Error('Invalid version index');
  }
  
  // Remove the version at specified index
  analysisVersions.splice(versionIndex, 1);
  
  // Update latest version reference if needed
  let latestAnalysisVersion = leaderData.latestAnalysisVersion;
  if (analysisVersions.length > 0) {
    // If we deleted the current latest, set the last one as latest
    if (!analysisVersions.some(v => v.versionId === latestAnalysisVersion)) {
      latestAnalysisVersion = analysisVersions[analysisVersions.length - 1].versionId;
    }
  } else {
    // If we deleted the last version, clear the latest reference
    latestAnalysisVersion = null;
  }
  
  // Update the document
  return updateDoc(leaderDoc, {
    analysisVersions,
    latestAnalysisVersion
  });
}

/**
 * Set a specific analysis version as the default/latest
 * @param {string} id - The leader document ID
 * @param {number} versionIndex - The index of the version to set as default
 * @returns {Promise<void>}
 */
export async function setDefaultAnalysisVersion(id, versionIndex) {
  const leaderDoc = doc(db, 'leaders', id);
  const leaderSnapshot = await getDoc(leaderDoc);
  
  if (!leaderSnapshot.exists()) {
    throw new Error('Leader not found');
  }
  
  const leaderData = leaderSnapshot.data();
  const analysisVersions = leaderData.analysisVersions || [];
  
  if (versionIndex < 0 || versionIndex >= analysisVersions.length) {
    throw new Error('Invalid version index');
  }
  
  // Set the selected version as the latest
  const selectedVersion = analysisVersions[versionIndex];
  
  // Update the document
  return updateDoc(leaderDoc, {
    latestAnalysisVersion: selectedVersion.versionId
  });
}

export default {
  getAllLeaders,
  getLeaderById,
  getTranscriptText,
  addAnalysisVersion,
  deleteAnalysisVersion,
  setDefaultAnalysisVersion
}; 