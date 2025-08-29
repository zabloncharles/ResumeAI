import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Debug: Check if environment variable is loaded
console.log("Firebase API Key from env:", import.meta.env.VITE_FIREBASE_API_KEY ? "Loaded" : "Not loaded");

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_NEW_API_KEY_HERE", // Replace with your new API key
  authDomain: "resumeai-69b70.firebaseapp.com",
  projectId: "resumeai-69b70",
  storageBucket: "resumeai-69b70.appspot.com",
  messagingSenderId: "152572686486",
  appId: "1:152572686486:web:b754dc50fb8a29c51712b7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); 