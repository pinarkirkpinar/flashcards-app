import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDeuSi6hnzBpQzX5uEwzKbdwWphZg1Yzzs",
  authDomain: "flashcards-4ac52.firebaseapp.com",
  projectId: "flashcards-4ac52",
  storageBucket: "flashcards-4ac52.firebasestorage.app",
  messagingSenderId: "318599695718",
  appId: "1:318599695718:web:e73189cff8d96cb71ecca7"
};


let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}


let auth;
try {
  auth = getAuth(app);
} catch (error) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };
export const db = getFirestore(app);
export default app;