import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB7CZnkQYHEqIfxn-Nny4ujaIEijJx2cHI",
  authDomain: "gsc26-dashboard-xyz.firebaseapp.com",
  projectId: "gsc26-dashboard-xyz",
  storageBucket: "gsc26-dashboard-xyz.firebasestorage.app",
  messagingSenderId: "497572973759",
  appId: "1:497572973759:web:535502933827b4eeec4a0a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
