# PRASHANT FLIX PRO

A Firebase-backed Android-installable PWA starter for a lawful OTT catalogue: movies, web series and authorized live streams.

## Included
- Responsive original PRASHANT FLIX UI
- Firebase Email/Password and Google sign-in
- Firestore media catalogue
- Admin publishing and deletion UI
- Firebase Storage poster upload
- Per-user watchlist
- MP4 and HLS playback
- PWA manifest and offline app-shell cache
- Firestore and Storage security rules

## 1. Create Firebase project
1. Open https://console.firebase.google.com/ and create a project.
2. Add a Web app in Project settings.
3. Copy its config into `firebase.js` (replace all `PASTE_...` values).
4. Enable Authentication -> Sign-in method -> Email/Password and Google.
5. Create Firestore Database in production mode.
6. Create Storage.
7. In Authentication -> Settings -> Authorized domains, add your GitHub Pages domain, e.g. `YOURNAME.github.io`.

## 2. Publish to GitHub Pages
1. Create a public GitHub repository named `prashant-flix-pro`.
2. Upload every project file, preserving filenames.
3. Open Settings -> Pages.
4. Select Deploy from a branch -> `main` -> `/ (root)` -> Save.
5. Wait for the published URL. Use HTTPS.

## 3. Apply security rules
Copy `firestore.rules` into Firebase Console -> Firestore Database -> Rules and Publish.
Copy `storage.rules` into Firebase Console -> Storage -> Rules and Publish.

## 4. Make your own account an admin
1. Open your published site and create your account using Email/Password.
2. In Firebase Console -> Firestore Database -> Data, open `users`.
3. Find the document whose ID equals your Firebase Authentication user UID.
4. Change its `role` field from `user` to `admin` (string).
5. Refresh the app, sign in, open Account -> Admin Studio.

Do not give admin access to anyone you do not trust. Do not expose service-account keys in frontend code.

## 5. Add content
In Admin Studio choose Movie, Web Series or Live TV. Add a title, description, genre, optional poster and an HTTPS stream URL. For HLS, use a valid `.m3u8` playlist whose host permits browser playback (CORS). Use only content you own or are licensed/authorized to distribute.

## Important limitations
- GitHub Pages hosts the PWA files; it is not a video hosting service.
- Firebase Storage poster upload is included. Large movie/video hosting is not included; use a lawful streaming/CDN provider and paste its playback URL.
- HLS playback uses hls.js where supported; native HLS is used by browsers that support it. DRM-protected services may not play in this generic player.
- Firebase free-tier quotas and availability can change. Streaming bandwidth, storage and authentication usage may incur costs after free quotas.
- This project is a working foundation, not a Netflix-scale production infrastructure. Before public launch, add abuse controls, monitoring, privacy/terms pages, rate limits and a reviewed security setup.
