// Script to categorize all leader chapters by topic
import { categorizeChaptersByTopic } from '../services/topicAnalysisService.js';

async function main() {
  try {
    console.log('Starting chapter categorization by topic...');
    
    const results = await categorizeChaptersByTopic();
    
    console.log('\nCategorization Results:');
    console.log('----------------------');
    console.log(`Processed ${results.totalLeaders} leaders`);
    console.log(`Categorized ${results.totalChaptersProcessed} chapters total`);
    
    console.log('\nLeaders processed:');
    results.leadersProcessed.forEach((leader, index) => {
      console.log(`${index + 1}. ${leader.title}: ${leader.chaptersProcessed} chapters categorized`);
    });
    
    console.log('\nChapter categorization completed successfully!');
  } catch (error) {
    console.error('Error categorizing chapters:', error);
    process.exit(1);
  }
}

main(); 