const state = {
  theme: "classic",
  screen: "player",

  preset: "normal",
  backlight: 1.0,
  ink: 1.0,
  contrast: "normal",
  font: "classic",
  overlay: "on",

  volume: 4,
  volumeMax: 8,
  muted: false,
  volumeMode: false,
  eq: "flat",

  shuffle: false,
  repeat: "off",

  osd: null,

  nowPlaying: {
    artist: "David Bowie",
    title: "Seven",
    album: "Hours",
    time: "0:00",
    remaining: "-4:04"
  }
};

// ===== LOAD SAVED DISPLAY STATE =====

(function loadDisplayState() {
  try {
    const saved = localStorage.getItem("ipodDisplayState");
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return;

    if (parsed.theme !== undefined) state.theme = parsed.theme;
    if (parsed.preset !== undefined) state.preset = parsed.preset;
    if (parsed.backlight !== undefined) state.backlight = parsed.backlight;
    if (parsed.ink !== undefined) state.ink = parsed.ink;
  } catch (e) {
    console.warn("Failed to load display state", e);
  }
})();
