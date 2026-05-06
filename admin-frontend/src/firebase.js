// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAP-qu4vCFeoQJv4vgiq8kPia4PqHHuDs",
  authDomain: "logitrack-6c1d0.firebaseapp.com",
  projectId: "logitrack-6c1d0",
  storageBucket: "logitrack-6c1d0.firebasestorage.app",
  messagingSenderId: "687026133962",
  appId: "1:687026133962:web:d7027eec5cc10764b94d33",
  measurementId: "G-P94KKVPHW0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
