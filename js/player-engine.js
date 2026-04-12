const player = {
  audio: new Audio(),
  playlist: [],
  index: 0,
  isReady: false
};

function padTime(n) {
  return String(n).padStart(2, "0");
}

function formatTime(totalSeconds) {
  const secs = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(secs / 60);
  const rest = secs % 60;
  return `${mins}:${padTime(rest)}`;
}

function syncVolumeToAudio() {
  if (!player.audio) return;

  const max = state.volumeMax || 8;
  const level = state.muted ? 0 : state.volume;
  player.audio.volume = Math.max(0, Math.min(1, level / max));
}

function syncNowPlayingTimes() {
  const track = player.playlist[player.index];
  const current = player.audio.currentTime || 0;
  const duration = player.audio.duration || track?.duration || 0;
  const remaining = Math.max(0, duration - current);

  state.nowPlaying.time = formatTime(current);
  state.nowPlaying.remaining = `-${formatTime(remaining)}`;
}

function syncNowPlayingMeta() {
  const track = player.playlist[player.index];
  if (!track) return;

  state.nowPlaying.artist = track.artist || "";
  state.nowPlaying.title = track.title || "";
  state.nowPlaying.album = track.album || "";
  syncNowPlayingTimes();
}

function updateProgressUI() {
  const fill = document.querySelector(".lcdProgressFill");
  if (!fill) return;

  const duration = player.audio.duration || 0;
  const current = player.audio.currentTime || 0;
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  fill.style.width = `${pct}%`;
}

function refreshPlayerUI() {
  syncNowPlayingMeta();

  if (typeof rerenderActiveScreen === "function") {
    rerenderActiveScreen();
  } else if (typeof renderPlayer === "function") {
    renderPlayer();
  }

  updateProgressUI();
}

function loadPlaylist(data) {
  if (!data || !Array.isArray(data.tracks) || !data.tracks.length) return;

  player.playlist = data.tracks.slice();
  player.index = 0;
  player.isReady = true;

  loadTrack(0, false);
}

function loadTrack(index, autoplay = false) {
  const track = player.playlist[index];
  if (!track) return;

  player.index = index;
  player.audio.src = track.audioUrl;
  player.audio.load();

  syncNowPlayingMeta();
  refreshPlayerUI();

  if (autoplay) {
    player.audio.play().catch(() => {});
  }
}

function togglePlayPause() {
  if (!player.isReady) return;

  if (player.audio.paused) {
    player.audio.play().catch(() => {});
  } else {
    player.audio.pause();
  }

  refreshPlayerUI();
}

function nextTrack() {
  if (!player.playlist.length) return;
  const next = (player.index + 1) % player.playlist.length;
  loadTrack(next, true);
}

function prevTrack() {
  if (!player.playlist.length) return;
  const prev = (player.index - 1 + player.playlist.length) % player.playlist.length;
  loadTrack(prev, true);
}

function seekToRatio(ratio) {
  const duration = player.audio.duration || 0;
  if (!duration) return;
  player.audio.currentTime = Math.max(0, Math.min(duration, duration * ratio));
  refreshPlayerUI();
}

player.audio.addEventListener("loadedmetadata", () => {
  refreshPlayerUI();
});

player.audio.addEventListener("timeupdate", () => {
  syncNowPlayingTimes();
  updateProgressUI();

  const times = document.querySelectorAll(".lcdTimes span");
  if (times.length >= 2) {
    times[0].textContent = state.nowPlaying.time;
    times[1].textContent = state.nowPlaying.remaining;
  }
});

player.audio.addEventListener("ended", () => {
  nextTrack();
});

document.addEventListener("DOMContentLoaded", () => {
  syncVolumeToAudio();
  loadPlaylist(playlistData);
});