import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDeuSi6hnzBpQzX5uEwzKbdwWphZg1Yzzs",
  authDomain: "flashcards-4ac52.firebaseapp.com",
  projectId: "flashcards-4ac52",
  storageBucket: "flashcards-4ac52.firebasestorage.app",
  messagingSenderId: "318599695718",
  appId: "1:318599695718:web:e73189cff8d96cb71ecca7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);