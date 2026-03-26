import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAdgMCiG3nrozNVJ4X0E5q4pDEMxo8eAl4",
  authDomain: "personalmailmanitor.firebaseapp.com",
  projectId: "personalmailmanitor",
  storageBucket: "personalmailmanitor.firebasestorage.app",
  messagingSenderId: "779739924715",
  appId: "1:779739924715:web:5244f52a1d1da0e72e96ae",
  measurementId: "G-4FYW97FQCX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Add Gmail scopes
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/user.birthday.read');
googleProvider.addScope('https://www.googleapis.com/auth/user.gender.read');
