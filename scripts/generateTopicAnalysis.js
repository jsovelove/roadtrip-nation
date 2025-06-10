import { generateTopicAnalysisReport } from '../src/services/topicAnalysisService.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Script to generate a topic analysis report of all interview transcripts
 * and save the results to a JSON file.
 * 
 * Usage:
 *   node scripts/generateTopicAnalysis.js [--force]
 * 
 * Options:
 *   --force  Force regeneration of analysis (ignore cached data)
 */
async function main() {
  // Check if force refresh is requested
  const forceRefresh = process.argv.includes('--force');
  
  console.log(`Starting topic analysis of all transcripts...${forceRefresh ? ' (Forced refresh)' : ''}`);
  
  try {
    // Generate the topic analysis report
    console.log('Analyzing transcripts. This may take a while...');
    const topicAnalysis = await generateTopicAnalysisReport(forceRefresh);
    
    // Display source of data
    if (topicAnalysis.timestamp && !forceRefresh) {
      console.log(`Using cached analysis from: ${new Date(topicAnalysis.timestamp).toLocaleString()}`);
    } else {
      console.log('Generated fresh analysis');
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.resolve('analysis-output');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    
    // Save the raw analysis data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `topic-analysis-${timestamp}.json`);
    
    await fs.writeFile(
      outputFile,
      JSON.stringify(topicAnalysis, null, 2),
      'utf8'
    );
    
    console.log(`Topic analysis complete! Results saved to: ${outputFile}`);
    
    // Generate a markdown report for easier reading
    const mdReport = generateMarkdownReport(topicAnalysis);
    const mdFile = path.join(outputDir, `topic-analysis-${timestamp}.md`);
    
    await fs.writeFile(mdFile, mdReport, 'utf8');
    console.log(`Markdown report saved to: ${mdFile}`);
    
  } catch (error) {
    console.error('Error generating topic analysis:', error);
    process.exit(1);
  }
}

/**
 * Generates a markdown report from the topic analysis data
 * @param {Object} analysis - The topic analysis data
 * @returns {string} - Markdown formatted report
 */
function generateMarkdownReport(analysis) {
  const { topicDistribution, keyTopics, topicInsights, timestamp } = analysis;
  
  let markdown = `# Interview Corpus Topic Analysis\n\n`;
  
  // Add date
  markdown += `*Generated on: ${new Date().toLocaleString()}*\n`;
  if (timestamp) {
    markdown += `*Analysis last updated: ${new Date(timestamp).toLocaleString()}*\n`;
  }
  markdown += `\n`;
  
  // Add topic distribution section
  markdown += `## Overall Topic Distribution\n\n`;
  markdown += `| Topic | Percentage | Description |\n`;
  markdown += `|-------|------------|-------------|\n`;
  
  topicDistribution.forEach(topic => {
    markdown += `| ${topic.topic} | ${topic.percentage.toFixed(1)}% | ${topic.description} |\n`;
  });
  
  // Add overall insights if available
  if (topicInsights) {
    markdown += `\n## Overall Topic Insights\n\n`;
    markdown += `${topicInsights}\n\n`;
  }
  
  // Add key topics
  markdown += `## Key Topics Analysis\n\n`;
  
  keyTopics.forEach(topic => {
    markdown += `### ${topic.topic}\n\n`;
    markdown += `**Description:** ${topic.description}\n\n`;
    
    if (topic.insights) {
      markdown += `**Insights:** ${topic.insights}\n\n`;
    }
    
    markdown += `**Related Interviews:** ${topic.relatedInterviews.join(', ')}\n\n`;
    
    if (topic.keyQuotes && topic.keyQuotes.length > 0) {
      markdown += `**Key Quotes:**\n\n`;
      
      topic.keyQuotes.forEach(quote => {
        markdown += `> "${quote.quote}"\n>\n`;
        markdown += `> — Interview: ${quote.interviewId}\n`;
        
        if (quote.context) {
          markdown += `>\n> Context: ${quote.context}\n`;
        }
        
        markdown += `\n`;
      });
    }
    
    markdown += `---\n\n`;
  });
  
  return markdown;
}

// Run the script
main(); 