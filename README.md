# Roadtrip Nation Interview Analysis

This application analyzes interview transcripts from Roadtrip Nation leaders using OpenAI's language models to identify question/answer segments, create chapter markers, and identify noise segments for better video navigation.

## Features

- View a list of all leaders from Roadtrip Nation
- Watch leader interviews with video player
- Analyze interview transcripts with OpenAI
- View question/answer pairs, with Jeopardy-style questions for segments without clear questions
- Navigate videos with custom chapter markers that align with interview themes
- Identify noise segments with context cards

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # OpenAI API Key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Firebase Structure

The application expects a Firestore database with the following structure:

- Collection: `leaders`
  - Document: `{leaderId}`
    - Fields:
      - `name`: String - Leader's name
      - `title`: String - Leader's title/role
      - `videoURL`: String - URL to the interview video
      - `transcriptURL`: String - URL to the interview transcript
      - `analysisData`: Object (Created by the app)
        - `qaSegments`: Array - Question/answer segments
        - `chapterMarkers`: Array - Chapter markers
        - `noiseSegments`: Array - Noise segments
        - `timestamp`: String - When the analysis was performed

## Technology Stack

- React.js with Vite
- Material UI for the user interface
- Firebase Firestore for data storage
- OpenAI API for transcript analysis
- React Router for navigation
