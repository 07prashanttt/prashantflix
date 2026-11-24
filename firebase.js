
// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// PRASHANT FLIX PRO Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBV7J8IPyCB1EjSPTDU95uZRtX7cwAz9rE",
  authDomain: "prashantflixpro.firebaseapp.com",
  projectId: "prashantflixpro",
  storageBucket: "prashantflixpro.firebasestorage.app",
  messagingSenderId: "203660886430",
  appId: "1:203660886430:web:139215ed008272689d168f"
};

// Initialize Firebase
export const firebaseConfigured = true;
export const app = initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
