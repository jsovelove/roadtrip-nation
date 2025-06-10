const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const OpenAI = require('openai');

admin.initializeApp();

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: functions.config().openai.key, // Set via: firebase functions:config:set openai.key="your-api-key"
});

// Cloud function to identify Q&A segments
exports.identifyQA = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { transcript } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing interview transcripts. Identify question and answer segments within the transcript. Your response MUST be a valid JSON object containing an array of segments."
          },
          {
            role: "user",
            content: `Analyze this interview transcript and identify all question and answer pairs. 

            Return ONLY a valid JSON object with a 'segments' array containing objects with this structure:
            {
              "segments": [
                {
                  "questionStart": "timestamp",
                  "questionEnd": "timestamp",
                  "question": "text of the question",
                  "answerStart": "timestamp",
                  "answerEnd": "timestamp",
                  "answer": "text of the answer",
                  "isJeopardyStyle": boolean (true if you generated this question, false if it's an actual question from the transcript)
                }
              ]
            }
            
            TIMESTAMP ACCURACY INSTRUCTIONS:
            1. For actual questions from the transcript, use the exact timestamps where they appear.
            2. For Jeopardy-style questions (content without clear questions):
               - Find the EXACT timestamp where the meaningful content/answer actually begins in the transcript
               - Use the timestamp of where the answer content starts, NOT an estimated or approximate time
               - The questionStart and questionEnd should match the answerStart since you're generating the question for existing answer content
               - Be precise - look for the actual moment in the transcript where this content is discussed
            
            If a segment doesn't have a clear question but is still meaningful content, generate a relevant Jeopardy-style question for it and set "isJeopardyStyle" to true. ENSURE the timestamps correspond to where that answer content actually appears in the transcript.
            
            Transcript:
            ${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      const result = JSON.parse(response.choices[0].message.content);
      return res.json({ segments: result.segments || [] });

    } catch (error) {
      console.error("Error in identifyQA:", error);
      return res.status(500).json({ error: 'Failed to analyze transcript' });
    }
  });
});

// Cloud function to generate chapter markers
exports.generateChapterMarkers = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { transcript, qaSegments = [], identifiedThemes = [] } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ error: 'Transcript is required' });
      }

      const roadtripNationThemes = [
        "Adversity",
        "Chance",
        "Change",
        "Choices",
        "Community",
        "Confidence",
        "Culture",
        "Determination & Hard Work",
        "Doubt",
        "Education",
        "Experience",
        "Exploration",
        "Failure",
        "Family",
        "Fear",
        "Fulfillment",
        "Goals",
        "Interests & Hobbies",
        "Individuality",
        "Integrity & Authenticity",
        "Inspiration",
        "Money",
        "Negativity",
        "Opportunities & Possibilities",
        "Passion",
        "Perseverance",
        "Planning",
        "Pressure",
        "Regrets",
        "Risk",
        "Self-Reflection",
        "Skills",
        "Success",
        "Support & Encouragement",
        "Trust & Hope",
        "Values",
        "Work Culture"
      ];

      // Prepare Q&A boundary guidance if available
      const qaBoundaryGuidance = qaSegments.length > 0 
        ? `\n\nQ&A SEGMENT BOUNDARIES FOR REFERENCE:
           Use these question-answer segments as natural chapter boundary guides:
           ${qaSegments.map(qa => `
           Question (${qa.questionStart} - ${qa.questionEnd}): "${qa.question.substring(0, 100)}..."
           Answer (${qa.answerStart} - ${qa.answerEnd}): "${qa.answer.substring(0, 100)}..."
           `).join('\n')}`
        : '';

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing interview content through the lens of Roadtrip Nation's philosophy of self-discovery, authentic career exploration, and finding meaningful work aligned with personal values. You excel at identifying natural chapter boundaries that align with conversation flow and thematic transitions. Your response MUST be a valid JSON object containing an array of chapter markers."
          },
          {
            role: "user",
            content: `Create chapter markers for this interview that align with Roadtrip Nation's core philosophy and themes.

            Return ONLY a valid JSON object with a 'chapterMarkers' array of objects with this structure:
            {
              "chapterMarkers": [
                {
                  "timestamp": "HH:MM:SS",
                  "title": "Engaging and descriptive chapter title that reflects Roadtrip Nation's philosophy",
                  "description": "Brief description connecting this segment to themes of self-discovery, authentic work, or breaking from conventional paths",
                  "themes": ["theme1", "theme2", "theme3"],
                  "customThemes": ["Creative Expression", "Personal Growth"],
                  "isNoiseSegment": false
                }
              ]
            }
            
            CHAPTER BOUNDARY GUIDELINES:
            1. Aim for chapters between 2-8 minutes in length
            2. Start chapters at natural conversation breaks (beginning of new topics, after summarizing statements)
            3. End chapters at logical conclusion points (end of complete thoughts, before topic shifts)
            4. When possible, align chapter boundaries with question-answer segment boundaries
            5. Ensure each chapter covers a cohesive theme or story arc
            6. Avoid cutting off speakers mid-sentence or mid-thought
            
            IMPORTANT: 
            1. For the "themes" array in each chapter, you MUST ONLY use themes from this specific list:
            ${JSON.stringify(roadtripNationThemes)}
            
            2. Select a MAXIMUM of 3 themes per chapter from the official themes list. Choose the most relevant and prominent themes for each chapter.
            
            3. In addition to the official themes, add a "customThemes" array with 1-2 additional unique themes you identify that aren't in the official list but are relevant to the content. These should be short (1-3 words) with proper spacing between words. For example: "Creative Expression", "Life Balance", "Technological Innovation", etc.
            
            4. ONE of the chapters MUST be designated as the "Noise" chapter. For this chapter:
               - Set "isNoiseSegment" to true
               - Title it something related to "Filtering Noise" or "External Influences"
               - Focus on the part of the interview where the person discusses dealing with external influences or expectations
               - Include an additional field called "contextCard" with necessary information to understand the Noise segment
               - The contextCard should be written as standalone content that can be read before watching the Noise segment
               - Be exactly 2 sentences maximum
               - DO NOT use referential language like "they just discussed" or "this follows from" or "this segment" - write the contextCard as an independent piece of information
               - The contextCard should provide essential background without referring to itself or the video in any way
               - Focus on the SETUP leading to the noise situation, NOT the resolution or outcome
               - Give context for what external influences or expectations the person was facing, without revealing how they handled it
            
            In Roadtrip Nation, "Noise" is defined as:
            "When you're trying to figure out what you're looking for in life, people might try to guide—or even push—you in a direction. The comments, advice, suggestions, and questions other people have about the direction of your life are what we call Noise. It's necessary to filter the Noise; to think about what you're hearing and whether it aligns with who you are. Filtering the Noise will help you know whether to shed it or take it as useful feedback."
            
            For the Noise chapter, focus on segments where the interviewee discusses:
            - External influences or expectations from others
            - How they filtered advice or feedback
            - Instances where they rejected or embraced guidance from others
            - Their process of determining which advice aligned with their authentic self
            
            ${identifiedThemes.length > 0 ? `Previously identified themes: ${JSON.stringify(identifiedThemes)}` : ''}
            
            Identify 5-7 major segments that highlight moments of:
            - Pivotal decisions or turning points in the interviewee's journey
            - Rejection of external expectations or "noise"
            - Discovery of authentic interests or values
            - Lessons learned through direct experience
            - Connections between passion and meaningful work
            - Navigating uncertainty or failure

            ${qaBoundaryGuidance}
            
            Transcript:
            ${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0].message.content);
      return res.json({ chapterMarkers: result.chapterMarkers || [] });

    } catch (error) {
      console.error("Error in generateChapterMarkers:", error);
      return res.status(500).json({ error: 'Failed to generate chapter markers' });
    }
  });
}); 