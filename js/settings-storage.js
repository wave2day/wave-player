const STORAGE_KEY = "playerSettings_v1";

function getPersistentState() {
  return {
    theme: state.theme,
    preset: state.preset,
    backlight: state.backlight,
    ink: state.ink,
    volume: state.volume,
    muted: state.muted,
    eq: state.eq
  };
}

function applyPersistentState(saved) {
  if (!saved) return;

  state.theme = saved.theme ?? state.theme;
  state.preset = saved.preset ?? state.preset;
  state.backlight = saved.backlight ?? state.backlight;
  state.ink = saved.ink ?? state.ink;
  state.volume = saved.volume ?? state.volume;
  state.muted = saved.muted ?? state.muted;
  state.eq = saved.eq ?? state.eq;
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getPersistentState()));
  } catch (e) {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    applyPersistentState(JSON.parse(raw));
  } catch (e) {}
}