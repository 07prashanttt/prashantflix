let hlsInstance = null;
export function stopPlayback(video) {
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
  if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
}
export async function startPlayback(video, url, onError = () => {}) {
  stopPlayback(video);
  const cleanUrl = String(url || "").trim();
  if (!/^https:\/\//i.test(cleanUrl)) {
    onError("A valid HTTPS video URL is required."); return;
  }
  try {
    if (/\.m3u8($|\?)/i.test(cleanUrl) && window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      hlsInstance.loadSource(cleanUrl);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.ERROR, (_, data) => {
        if (data.fatal) onError("This stream could not be played. Check the stream URL and CORS settings.");
      });
      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    } else {
      video.src = cleanUrl;
      video.load();
      await video.play().catch(() => {});
    }
  } catch (error) {
    onError(error.message || "Unable to start playback.");
  }
}
