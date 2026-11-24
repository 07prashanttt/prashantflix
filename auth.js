import { auth, db, googleProvider } from "./firebase.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export async function register(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", credential.user.uid), {
    email, displayName: credential.user.displayName || email.split("@")[0],
    role: "user", createdAt: serverTimestamp()
  }, { merge: true });
  return credential.user;
}
export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDocument(credential.user);
  return credential.user;
}
export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  await ensureUserDocument(credential.user);
  return credential.user;
}
async function ensureUserDocument(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email || "", displayName: user.displayName || "Viewer",
      role: "user", createdAt: serverTimestamp()
    });
  }
}
export async function logout() { await signOut(auth); }
export async function getUserRole(user) {
  if (!user) return "guest";
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? (snap.data().role || "user") : "user";
}
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
