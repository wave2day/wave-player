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
  if (!player.audio || typeof state === "undefined") return;

  const max = state.volumeMax || 8;
  const level = state.muted ? 0 : state.volume;
  player.audio.volume = Math.max(0, Math.min(1, level / max));
}

function getCurrentTrack() {
  return player.playlist[player.index] || null;
}

function syncNowPlayingMeta() {
  const track = getCurrentTrack();
  if (!track || typeof state === "undefined") return;

  state.nowPlaying.artist = track.artist || "";
  state.nowPlaying.title = track.title || "";
  state.nowPlaying.album = track.album || "";
}

function syncNowPlayingTimes() {
  if (typeof state === "undefined") return;

  const track = getCurrentTrack();
  const current = player.audio.currentTime || 0;
  const duration = player.audio.duration || track?.duration || 0;
  const remaining = Math.max(0, duration - current);

  state.nowPlaying.time = formatTime(current);
  state.nowPlaying.remaining = `-${formatTime(remaining)}`;
}

function updateProgressUI() {
  const fill = document.querySelector(".lcdProgressFill");
  if (!fill) return;

  const duration = player.audio.duration || getCurrentTrack()?.duration || 0;
  const current = player.audio.currentTime || 0;
  const pct = duration > 0 ? (current / duration) * 100 : 0;

  fill.style.width = `${pct}%`;
}

function updateTimesUI() {
  const times = document.querySelectorAll(".lcdTimes span");
  if (times.length < 2 || typeof state === "undefined") return;

  times[0].textContent = state.nowPlaying.time;
  times[1].textContent = state.nowPlaying.remaining;
}

function refreshPlayerUI() {
  syncNowPlayingMeta();
  syncNowPlayingTimes();

  if (typeof rerenderActiveScreen === "function") {
    rerenderActiveScreen();
  } else if (typeof renderPlayer === "function") {
    renderPlayer();
  }

  updateProgressUI();
  updateTimesUI();
}

function loadPlaylist(data) {
  if (!data || !Array.isArray(data.tracks) || !data.tracks.length) {
    player.playlist = [];
    player.index = 0;
    player.isReady = false;
    return;
  }

  player.playlist = data.tracks.slice();
  player.index = 0;
  player.isReady = true;

  loadTrack(0, false);
}

function loadTrack(index, autoplay = false) {
  if (!player.playlist.length) return;

  const safeIndex = Math.max(0, Math.min(index, player.playlist.length - 1));
  const track = player.playlist[safeIndex];
  if (!track) return;

  player.index = safeIndex;
  player.audio.pause();
  player.audio.currentTime = 0;
  player.audio.src = track.audioUrl;
  player.audio.load();

  syncNowPlayingMeta();
  syncNowPlayingTimes();
  refreshPlayerUI();

  if (autoplay) {
    player.audio.play().catch((err) => {
      console.warn("Audio play failed", err);
    });
  }
}

function getRandomNextIndex() {
  if (player.playlist.length <= 1) return player.index;

  let next = player.index;
  while (next === player.index) {
    next = Math.floor(Math.random() * player.playlist.length);
  }
  return next;
}

function togglePlayPause() {
  if (!player.isReady) return;

  if (player.audio.paused) {
    player.audio.play().catch((err) => {
      console.warn("Audio play failed", err);
    });
  } else {
    player.audio.pause();
  }

  refreshPlayerUI();
}

function nextTrack(forceAutoplay = true) {
  if (!player.playlist.length) return;

  let next;

  if (typeof state !== "undefined" && state.shuffle) {
    next = getRandomNextIndex();
  } else {
    next = player.index + 1;

    if (next >= player.playlist.length) {
      if (typeof state !== "undefined" && state.repeat === "all") {
        next = 0;
      } else {
        player.audio.pause();
        player.audio.currentTime = 0;
        refreshPlayerUI();
        return;
      }
    }
  }

  loadTrack(next, forceAutoplay);
}

function prevTrack(forceAutoplay = true) {
  if (!player.playlist.length) return;

  let prev;

  if (typeof state !== "undefined" && state.shuffle) {
    prev = getRandomNextIndex();
  } else {
    prev = player.index - 1;

    if (prev < 0) {
      prev = player.playlist.length - 1;
    }
  }

  loadTrack(prev, forceAutoplay);
}

function seekToRatio(ratio) {
  const duration = player.audio.duration || getCurrentTrack()?.duration || 0;
  if (!duration) return;

  const safeRatio = Math.max(0, Math.min(1, ratio));
  player.audio.currentTime = duration * safeRatio;

  syncNowPlayingTimes();
  updateProgressUI();
  updateTimesUI();
}

player.audio.preload = "metadata";

player.audio.addEventListener("loadedmetadata", () => {
  syncNowPlayingTimes();
  refreshPlayerUI();
});

player.audio.addEventListener("timeupdate", () => {
  syncNowPlayingTimes();
  updateProgressUI();
  updateTimesUI();
});

player.audio.addEventListener("play", () => {
  refreshPlayerUI();
});

player.audio.addEventListener("pause", () => {
  refreshPlayerUI();
});

player.audio.addEventListener("ended", () => {
  if (typeof state !== "undefined" && state.repeat === "one") {
    loadTrack(player.index, true);
    return;
  }

  nextTrack(true);
});

document.addEventListener("DOMContentLoaded", async () => {
  syncVolumeToAudio();

  try {
    if (typeof loadPlaylistDataFromGitHub === "function") {
      await loadPlaylistDataFromGitHub();
    }

    if (typeof buildPlaylistFromMetadata === "function") {
      const readyPlaylist = await buildPlaylistFromMetadata(playlistData);
      loadPlaylist(readyPlaylist);
      return;
    }

    loadPlaylist(playlistData);
  } catch (err) {
    console.warn("Playlist init failed", err);
    loadPlaylist(playlistData);
  }
});