// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Note: Firebase client-side API keys are safe to expose publicly
// They are secured through Firebase Security Rules, not by hiding the key
const firebaseConfig = {
    apiKey: "AIzaSyBRdA9Q8YDuGTXs_EptUR544noHh4_du18",
    authDomain: "roadtrip-nation-challenge.firebaseapp.com",
    projectId: "roadtrip-nation-challenge",
    storageBucket: "roadtrip-nation-challenge.firebasestorage.app",
    messagingSenderId: "245432283347",
    appId: "1:245432283347:web:f19133354477a275f9e426",
    measurementId: "G-NJBFJS5EZH"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 