import { db, storage } from "./firebase.js";
import {
  collection, addDoc, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const mediaCollection = collection(db, "media");
export async function publishMedia(data, posterFile, user) {
  if (!user) throw new Error("Sign in required.");
  let posterUrl = data.posterUrl || "";
  let posterPath = "";
  if (posterFile) {
    if (!posterFile.type.startsWith("image/")) throw new Error("Poster must be an image.");
    if (posterFile.size > 5 * 1024 * 1024) throw new Error("Poster must be 5 MB or smaller.");
    const safeName = posterFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    posterPath = `posters/${user.uid}/${Date.now()}-${safeName}`;
    const fileRef = ref(storage, posterPath);
    await uploadBytes(fileRef, posterFile, { contentType: posterFile.type });
    posterUrl = await getDownloadURL(fileRef);
  }
  const videoUrl = String(data.videoUrl || "").trim();
  if (!/^https:\/\//i.test(videoUrl)) throw new Error("Use an HTTPS URL for the authorized stream.");
  return addDoc(mediaCollection, {
    type: data.type, title: data.title.trim(), genre: data.genre.trim(),
    description: data.description.trim(), posterUrl, posterPath,
    videoUrl, year: data.year ? Number(data.year) : null,
    published: true, createdBy: user.uid, createdAt: serverTimestamp()
  });
}
export async function listAllMedia() {
  const snap = await getDocs(query(mediaCollection, orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function removeMedia(item) {
  await deleteDoc(doc(db, "media", item.id));
  if (item.posterPath) {
    try { await deleteObject(ref(storage, item.posterPath)); } catch (e) { console.warn("Poster cleanup:", e); }
  }
}
