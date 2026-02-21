import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBv5EYazSdbMOwcBq0zV3ctKodmwuW3AHc",
  authDomain: "logicoree77.firebaseapp.com",
  projectId: "logicoree77",
  storageBucket: "logicoree77.firebasestorage.app",
  messagingSenderId: "462441118930",
  appId: "1:462441118930:web:4e84ec14e29db89d46810b",
  measurementId: "G-YL177JJSC1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
