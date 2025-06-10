# Topic Analysis Feature

This feature performs AI-powered analysis on the interview transcripts to identify overall topic distribution and key topics across all interviews.

## Features

1. **Topic Distribution Analysis**: Identifies major topic categories that span across all interviews and shows their percentage distribution in a pie chart.

2. **Key Topics Analysis**: Identifies specific topics or themes that appear across multiple interviews with descriptions, insights, and key quotes.

3. **Visualization**: Presents the topic distribution in an interactive pie chart.

4. **Detailed Reports**: For each key topic, provides related interviews, representative quotes, and context.

5. **Caching**: Automatically stores analysis results in Firebase to avoid redundant processing.

## How to Use

### Via the User Interface

1. Navigate to the application and click on "Topic Analysis" in the navigation bar.
2. The system will automatically load cached analysis if available, or generate new analysis if none exists.
3. View the pie chart showing the topic distribution.
4. Scroll down to see detailed information about each topic and key quotes.
5. Click the refresh button in the top-right corner to force a new analysis if needed.

### Via Command Line

To generate a topic analysis report:

1. Run the following command to use cached data (if available) or generate new analysis:
   ```
   npm run analyze-topics
   ```

2. To force a refresh and generate new analysis regardless of cached data:
   ```
   npm run analyze-topics-force
   ```

3. The script will:
   - Load cached analysis (unless force refresh is requested)
   - Generate a comprehensive topic analysis if needed
   - Save the results as both JSON and Markdown files in the `analysis-output` directory

## Implementation Details

The topic analysis uses OpenAI's GPT-4o model to:

1. Analyze transcript summaries from all leaders with available transcripts
2. Generate a distribution of 5-7 major topic categories
3. Identify 8-12 specific topics that appear across multiple interviews
4. Extract representative quotes for each topic
5. Provide insights on how these topics relate to each other

## Caching System

To optimize performance and reduce API costs:

1. The first time analysis is run, results are stored in Firebase
2. Subsequent requests use the cached data unless a refresh is explicitly requested
3. The UI shows when the analysis was last updated
4. A refresh button allows generating new analysis when needed

## Technical Architecture

- **Frontend Component**: `src/components/TopicAnalysis.jsx` - Displays the topic analysis results
- **Service**: `src/services/topicAnalysisService.js` - Contains the logic for analyzing transcripts and caching
- **Script**: `scripts/generateTopicAnalysis.js` - Command-line script for generating analysis reports
- **Firebase**: Stores the analysis results in the `analysis/topicDistribution` document

## Data Structure

The topic analysis generates data in the following structure:

```json
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
          "quote": "Relevant quote from the interview",
          "context": "Brief context around this quote"
        }
      ],
      "insights": "Deeper insights about this topic across interviews"
    }
  ],
  "topicInsights": "Overall insights about how these topics relate to each other",
  "timestamp": "2023-06-15T14:23:45.789Z"
}
``` 