# Firebase Cloud Functions Setup

Follow these steps to deploy your OpenAI functions to Firebase:

## Prerequisites

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

## Setup Steps

### 1. Initialize Firebase Project
```bash
firebase init
```
- Select "Functions" and "Hosting"
- Choose your existing Firebase project or create a new one
- Select JavaScript (not TypeScript)
- Choose "No" for ESLint
- Choose "No" for installing dependencies now

### 2. Set Your Firebase Project ID
Update the `FUNCTIONS_BASE_URL` in `src/services/cloudFunctionService.js`:
- Replace `YOUR_PROJECT_ID` with your actual Firebase project ID

### 3. Set OpenAI API Key (IMPORTANT!)
```bash
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"
```
Replace `YOUR_OPENAI_API_KEY` with your actual OpenAI API key.

### 4. Deploy Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 5. Test Local Development (Optional)
To test functions locally:
```bash
firebase emulators:start --only functions
```

### 6. Deploy Hosting (When Ready)
Build your app and deploy:
```bash
npm run build
firebase deploy --only hosting
```

## Important Notes

- **API Key Security**: The OpenAI API key is stored securely in Firebase Functions configuration and is never exposed to client-side code
- **CORS**: The functions include CORS headers to allow requests from your frontend
- **Error Handling**: Both functions include proper error handling and logging
- **Cost**: Firebase Functions have a generous free tier, but monitor usage for production apps

## Environment URLs

- **Local Development**: Functions run on `http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1`
- **Production**: Functions run on `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net`

## Troubleshooting

1. **Function not found**: Make sure you've deployed functions and updated the project ID
2. **API key errors**: Verify the OpenAI API key is set correctly with `firebase functions:config:get`
3. **CORS errors**: The functions include CORS middleware, but check browser dev tools for specific errors 