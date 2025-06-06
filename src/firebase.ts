import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB80i6Tn6JCPZQikqWJ3cefzT-q-cNfVtM",
  authDomain: "resumeai-69b70.firebaseapp.com",
  projectId: "resumeai-69b70",
  storageBucket: "resumeai-69b70.appspot.com",
  messagingSenderId: "152572686486",
  appId: "1:152572686486:web:b754dc50fb8a29c51712b7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); 