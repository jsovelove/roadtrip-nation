# Firebase Database Structure

This document outlines the complete Firebase Firestore database structure used by the Roadtrip Nation Interview Analysis application.

## Collections Overview

### 1. `leaders` Collection

Stores individual leader/interview data with analysis results.

**Collection Path**: `/leaders`
**Document ID**: Auto-generated clean name (e.g., "jane-smith", "john-doe")

#### Document Structure

```json
{
  "id": "jane-smith",
  "title": "CEO at Tech Innovators Inc.",
  "videoURL": "https://example.com/videos/jane-smith-interview.mp4",
  "transcriptURL": "https://example.com/transcripts/jane-smith.txt", 
  "thumbnailURL": "https://example.com/photos/jane-smith.jpg",
  "analysisVersions": [
    {
      "versionId": "v1",
      "timestamp": "2023-12-01T10:30:00.000Z",
      "qaSegments": [
        {
          "questionStart": "00:02:15",
          "questionEnd": "00:02:25",
          "question": "What inspired you to start your company?",
          "answerStart": "00:02:25",
          "answerEnd": "00:04:10",
          "answer": "Well, I always had a passion for technology...",
          "isJeopardyStyle": false
        }
      ],
      "chapterMarkers": [
        {
          "timestamp": "00:01:00",
          "title": "Finding Your Path in Technology",
          "description": "Jane discusses her journey into tech leadership",
          "themes": ["Passion", "Education", "Experience"],
          "customThemes": ["Tech Leadership", "Innovation"],
          "isNoiseSegment": false,
          "matchedTopics": ["Leadership", "Career Growth"]
        },
        {
          "timestamp": "00:15:30",
          "title": "Filtering External Expectations",
          "description": "How Jane learned to trust her instincts over others' advice",
          "themes": ["Trust & Hope", "Self-Reflection"],
          "customThemes": ["Inner Voice"],
          "isNoiseSegment": true,
          "contextCard": "Jane faced pressure from family to pursue a traditional career path. She had to decide between following their expectations or pursuing her passion for technology."
        }
      ]
    }
  ],
  "latestAnalysisVersion": "v1",
  "createdAt": "2023-12-01T09:00:00.000Z",
  "updatedAt": "2023-12-01T10:35:00.000Z"
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Clean, URL-safe version of leader's name |
| `title` | String | Yes | Professional title, role, or description |
| `videoURL` | String | Yes | Direct link to interview video file |
| `transcriptURL` | String | Yes | Direct link to transcript text file |
| `thumbnailURL` | String | No | Direct link to leader's photo |
| `analysisVersions` | Array | No | AI-generated analysis results |
| `latestAnalysisVersion` | String | No | ID of current default analysis |
| `createdAt` | String | Yes | ISO timestamp of creation |
| `updatedAt` | String | Yes | ISO timestamp of last update |

### 2. `analysis` Collection

Stores aggregated analysis data across all interviews.

**Collection Path**: `/analysis`

#### Documents

##### `topicDistribution` Document

Stores overall topic analysis across all leader interviews.

```json
{
  "topicDistribution": [
    {
      "topic": "Career Growth & Development",
      "percentage": 28.5,
      "description": "Topics related to professional advancement and skill building"
    },
    {
      "topic": "Overcoming Challenges",
      "percentage": 22.1,
      "description": "Stories of facing and conquering obstacles"
    }
  ],
  "keyTopics": [
    {
      "topic": "Finding Your Passion",
      "description": "How leaders discovered what truly motivates them",
      "relatedInterviews": ["jane-smith", "john-doe", "maria-garcia"],
      "keyQuotes": [
        {
          "interviewId": "jane-smith",
          "quote": "The moment I wrote my first line of code, I knew this was it.",
          "context": "Discussing her first programming experience in college"
        }
      ],
      "insights": "Most leaders describe a 'lightbulb moment' when they discovered their true calling"
    }
  ],
  "topicInsights": "The most common theme across all interviews is the importance of authentic self-discovery over external validation.",
  "timestamp": "2023-12-01T15:20:00.000Z",
  "categorizedAt": "2023-12-01T16:45:00.000Z"
}
```

## Data Relationships

### Leader → Analysis Versions
- Each leader can have multiple analysis versions
- Versions are created when AI re-analyzes the transcript
- `latestAnalysisVersion` points to the current default version

### Analysis Versions → Chapter Markers
- Each analysis contains chapter markers with timestamps
- One chapter per analysis is marked as a "Noise" segment
- Chapters can be categorized into topics via `matchedTopics`

### Topics → Chapters
- Topic analysis creates relationships between chapters and topics
- Used for cross-interview navigation and insights

## Security Rules

Firebase Security Rules should be configured to:
- Allow read access to all authenticated users
- Restrict write access to admin users only
- Validate data structure on writes

Example rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to leaders
    match /leaders/{leaderId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Allow read access to analysis
    match /analysis/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Adding New Leaders

### Via UI (Recommended)
1. Navigate to `/add-leader`
2. Fill out the three-step form:
   - Basic information (name, title)
   - Media links (video, transcript, photo URLs)
   - Review and save
3. System automatically creates document with clean ID

### Via Database Direct
```javascript
import { createLeader } from './services/leaderService';

const newLeader = await createLeader({
  name: "Alex Johnson",
  title: "Environmental Scientist & Climate Activist", 
  videoURL: "https://example.com/alex-interview.mp4",
  transcriptURL: "https://example.com/alex-transcript.txt",
  thumbnailURL: "https://example.com/alex-photo.jpg"
});
```

## Analysis Workflow

1. **Create Leader**: Add basic leader info and media URLs
2. **Generate Analysis**: Click "Generate New Analysis" on leader detail page
3. **AI Processing**: 
   - Fetches transcript from URL
   - Identifies Q&A segments using GPT-4
   - Generates chapter markers with themes
   - Creates one "Noise" segment per interview
4. **Save Results**: Analysis stored as new version in `analysisVersions` array
5. **Topic Analysis**: Run topic analysis to find patterns across all interviews
6. **Chapter Categorization**: AI categorizes chapters into discovered topics

## Best Practices

### URL Requirements
- **Video URLs**: Should be direct links to video files (MP4, MOV, etc.)
- **Transcript URLs**: Should be direct links to text files
- **Photo URLs**: Should be direct links to image files (JPG, PNG, etc.)
- All URLs should be publicly accessible (no authentication required)

### Naming Conventions
- Leader IDs are auto-generated from names (lowercase, hyphenated)
- Analysis version IDs follow pattern: `v1`, `v2`, `v3`, etc.
- Document timestamps use ISO 8601 format

### Data Validation
- Required fields are enforced at the service layer
- URL validation checks accessibility before saving
- Duplicate name detection prevents conflicts

## Backup & Migration

Regular backups should be performed on:
- All leader documents
- Topic analysis results
- Any custom configurations

Export can be done via Firebase Admin SDK or Firestore export tools. 