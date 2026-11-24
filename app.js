import { auth, db, firebaseConfigured } from "./firebase.js";
import { register, login, loginWithGoogle, logout, getUserRole, watchAuth } from "./auth.js";
import { publishMedia, listAllMedia, removeMedia } from "./admin.js";
import { startPlayback, stopPlayback } from "./player.js";
import {
  collection, getDocs, query, where, doc, setDoc, deleteDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = id => document.getElementById(id);
const state = { user: null, role: "guest", page: "home", items: [], search: "", authMode: "login", installPrompt: null };
const dialogs = { auth: $("authDialog"), player: $("playerDialog"), profile: $("profileDialog"), admin: $("adminDialog") };
$("year").textContent = new Date().getFullYear();

function notify(message) {
  $("notice").textContent = message;
  $("notice").classList.remove("hidden");
  window.setTimeout(() => $("notice").classList.add("hidden"), 6000);
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function poster(item) {
  if (item.posterUrl) return `<img loading="lazy" src="${escapeHTML(item.posterUrl)}" alt="${escapeHTML(item.title)} poster" onerror="this.remove()">`;
  return `<div class="poster-placeholder"><div><span>PF</span><strong>${escapeHTML(item.title)}</strong></div></div>`;
}
function card(item) {
  const live = item.type === "live";
  return `<article class="media-card">
    <div class="poster" data-play="${escapeHTML(item.id)}">${poster(item)}
      ${live ? '<span class="media-badge">● LIVE</span>' : `<span class="media-badge">${item.type === "series" ? "SERIES" : "MOVIE"}</span>`}
    </div>
    <h3>${escapeHTML(item.title)}</h3>
    <p class="subline">${escapeHTML(item.genre || (live ? "Live channel" : "Entertainment"))}${item.year ? " · "+escapeHTML(item.year) : ""}</p>
    <div class="card-buttons"><button class="small-button" data-play="${escapeHTML(item.id)}">${live ? "Watch live" : "▶ Play"}</button>
    <button class="small-button" data-list="${escapeHTML(item.id)}">＋ My List</button></div>
  </article>`;
}
function section(title, list, note = "") {
  return `<section class="section"><div class="section-heading"><h2>${title}</h2><p>${note}</p></div>
    ${list.length ? `<div class="card-grid">${list.map(card).join("")}</div>` : `<div class="empty-state">Nothing here yet. Content published by the admin will appear here.</div>`}
  </section>`;
}
async function loadMedia() {
  try {
    const snap = await getDocs(query(collection(db, "media"), where("published", "==", true)));
    state.items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    state.items.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.error(error);
    notify("Could not load the catalogue. Check Firebase setup and Firestore rules.");
    state.items = [];
  }
  render();
}
async function getMyList() {
  if (!state.user) return [];
  try {
    const snap = await getDocs(collection(db, "users", state.user.uid, "watchlist"));
    return snap.docs.map(d => d.id);
  } catch { return []; }
}
async function render() {
  const q = state.search.toLowerCase();
  let list = state.items.filter(x => `${x.title} ${x.genre||""} ${x.description||""}`.toLowerCase().includes(q));
  const movies = list.filter(x => x.type === "movie");
  const series = list.filter(x => x.type === "series");
  const live = list.filter(x => x.type === "live");
  const target = $("pageContent");
  document.querySelectorAll(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.page === state.page));
  if (state.page === "home") {
    target.innerHTML = section("✨ Recently added", list.slice(0,8)) + section("🎬 Movies", movies.slice(0,8)) + section("📺 Web Series", series.slice(0,8)) + section("🔴 Live TV", live.slice(0,8));
  } else if (state.page === "movies") target.innerHTML = section("🎬 All Movies", movies);
  else if (state.page === "series") target.innerHTML = section("📺 All Web Series", series);
  else if (state.page === "live") target.innerHTML = section("🔴 Live TV Channels", live, "Authorized streams only");
  else if (state.page === "mylist") {
    const ids = await getMyList();
    target.innerHTML = section("❤️ My List", list.filter(x => ids.includes(x.id)), state.user ? "" : "Sign in to sync your list");
  }
}
async function toggleWatchlist(id) {
  if (!state.user) { dialogs.auth.showModal(); return; }
  const ref = doc(db, "users", state.user.uid, "watchlist", id);
  const snap = await getDoc(ref);
  if (snap.exists()) await deleteDoc(ref);
  else await setDoc(ref, { addedAt: serverTimestamp() });
  if (state.page === "mylist") render();
  notify(snap.exists() ? "Removed from My List." : "Added to My List.");
}
async function openPlayer(item) {
  $("playerTitle").textContent = item.title;
  $("playerType").textContent = item.type === "live" ? "LIVE CHANNEL" : item.type.toUpperCase();
  $("playerDescription").textContent = item.description || "";
  $("playerError").textContent = "";
  dialogs.player.showModal();
  await startPlayback($("videoPlayer"), item.videoUrl, message => $("playerError").textContent = message);
  if (state.user && item.type !== "live") {
    setDoc(doc(db, "users", state.user.uid, "progress", item.id), { title: item.title, updatedAt: serverTimestamp() }, { merge: true }).catch(console.warn);
  }
}
function closePlayer() { stopPlayback($("videoPlayer")); dialogs.player.close(); }

function updateAccountUI() {
  $("accountButton").textContent = state.user ? "Account" : "Sign in";
  $("profileName").textContent = state.user?.displayName || "Your profile";
  $("profileEmail").textContent = state.user?.email || "Not signed in";
  $("openAdmin").classList.toggle("hidden", state.role !== "admin");
}
function setAuthMode(mode) {
  state.authMode = mode;
  $("authHeading").textContent = mode === "login" ? "Sign in to PRASHANT FLIX" : "Create your account";
  $("authSubmit").textContent = mode === "login" ? "Sign in" : "Create account";
  $("authSwitchText").textContent = mode === "login" ? "New here?" : "Already have an account?";
  $("authSwitch").textContent = mode === "login" ? "Create account" : "Sign in";
  $("authPassword").autocomplete = mode === "login" ? "current-password" : "new-password";
}
function friendlyError(error) {
  const map = {
    "auth/invalid-credential":"Email or password is incorrect.",
    "auth/email-already-in-use":"This email already has an account.",
    "auth/weak-password":"Use a stronger password (at least 6 characters).",
    "auth/popup-blocked":"Popup blocked. Allow popups and try again.",
    "auth/unauthorized-domain":"Add this website domain to Firebase Authentication authorized domains."
  };
  return map[error.code] || error.message || "Something went wrong.";
}
$("authForm").addEventListener("submit", async e => {
  e.preventDefault(); $("authError").textContent = "";
  $("authSubmit").disabled = true;
  try {
    const email = $("authEmail").value.trim(), password = $("authPassword").value;
    if (state.authMode === "login") await login(email, password);
    else await register(email, password);
    dialogs.auth.close();
  } catch (error) { $("authError").textContent = friendlyError(error); }
  finally { $("authSubmit").disabled = false; }
});
$("googleSignIn").addEventListener("click", async () => {
  $("authError").textContent = "";
  try { await loginWithGoogle(); dialogs.auth.close(); }
  catch (error) { $("authError").textContent = friendlyError(error); }
});
$("authSwitch").addEventListener("click", () => setAuthMode(state.authMode === "login" ? "register" : "login"));
$("accountButton").addEventListener("click", () => state.user ? dialogs.profile.showModal() : dialogs.auth.showModal());
$("signOut").addEventListener("click", async () => { await logout(); dialogs.profile.close(); notify("You have signed out."); });
$("openAdmin").addEventListener("click", async () => { dialogs.profile.close(); dialogs.admin.showModal(); await renderAdminList(); });
$("playerClose").addEventListener("click", closePlayer);
dialogs.player.addEventListener("close", () => stopPlayback($("videoPlayer")));

document.addEventListener("click", async e => {
  const page = e.target.closest("[data-page]");
  if (page) { state.page = page.dataset.page; render(); window.scrollTo({top:0,behavior:"smooth"}); return; }
  const play = e.target.closest("[data-play]");
  if (play) { const item = state.items.find(x => x.id === play.dataset.play); if (item) openPlayer(item); return; }
  const save = e.target.closest("[data-list]");
  if (save) { await toggleWatchlist(save.dataset.list); return; }
});
$("searchToggle").addEventListener("click", () => $("searchBar").classList.toggle("hidden"));
$("searchInput").addEventListener("input", e => { state.search = e.target.value.trim(); render(); });
$("clearSearch").addEventListener("click", () => { $("searchInput").value = ""; state.search = ""; render(); });
$("heroExplore").addEventListener("click", () => { state.page = "movies"; render(); document.querySelector(".content-wrap").scrollIntoView({behavior:"smooth"}); });
$("heroInfo").addEventListener("click", () => notify("PRASHANT FLIX is your own streaming platform for authorized movies, series and live channels."));

async function renderAdminList() {
  const box = $("adminContentList"); box.innerHTML = "Loading...";
  try {
    const all = await listAllMedia();
    box.innerHTML = all.length ? all.map(item => `<div class="admin-row"><div><strong>${escapeHTML(item.title)}</strong><br><span>${escapeHTML(item.type)} · ${escapeHTML(item.genre||"")}</span></div><button data-delete="${escapeHTML(item.id)}">Delete</button></div>`).join("") : '<p class="muted">No content published yet.</p>';
  } catch (error) { box.textContent = friendlyError(error); }
}
$("contentForm").addEventListener("submit", async e => {
  e.preventDefault(); $("adminMessage").textContent = "";
  const button = $("saveContent"); button.disabled = true; button.textContent = "Publishing...";
  try {
    await publishMedia({
      type: $("contentType").value, title: $("contentTitle").value,
      genre: $("contentGenre").value, description: $("contentDescription").value,
      posterUrl: $("contentPosterUrl").value, videoUrl: $("contentVideo").value,
      year: $("contentYear").value
    }, $("contentPoster").files[0], state.user);
    $("contentForm").reset(); $("adminMessage").textContent = "Published successfully.";
    await loadMedia(); await renderAdminList();
  } catch (error) { $("adminMessage").textContent = friendlyError(error); }
  finally { button.disabled = false; button.textContent = "Publish content"; }
});
$("adminContentList").addEventListener("click", async e => {
  const button = e.target.closest("[data-delete]"); if (!button) return;
  if (!confirm("Delete this content item?")) return;
  try {
    const item = (await listAllMedia()).find(x => x.id === button.dataset.delete);
    if (item) await removeMedia(item);
    await loadMedia(); await renderAdminList();
  } catch (error) { $("adminMessage").textContent = friendlyError(error); }
});

$("installButton").addEventListener("click", async () => {
  if (!state.installPrompt) return;
  state.installPrompt.prompt();
  await state.installPrompt.userChoice;
  state.installPrompt = null;
  $("installButton").classList.add("hidden");
});
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); state.installPrompt = e; $("installButton").classList.remove("hidden");
});
window.addEventListener("appinstalled", () => notify("PRASHANT FLIX installed successfully."));

watchAuth(async user => {
  state.user = user;
  state.role = user ? await getUserRole(user).catch(() => "user") : "guest";
  updateAccountUI();
});
if (!firebaseConfigured) notify("Setup required: add your Firebase web configuration in firebase.js before using login or the catalogue.");
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.warn));
}
loadMedia();
