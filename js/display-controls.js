// ===== DISPLAY CONTROLS =====

const displayRoot = document.getElementById("displayRoot");

let volumeClickTimer = null;
let osdTimer = null;

// ===== HELPERS =====

function getLCD() {
  return displayRoot ? displayRoot.querySelector(".lcd") : null;
}

function getVolumeButton() {
  return displayRoot ? displayRoot.querySelector('[data-role="volume-button"]') : null;
}

function getProgressBar() {
  return displayRoot ? displayRoot.querySelector(".lcdProgress") : null;
}

function getOSDRoot() {
  return displayRoot ? displayRoot.querySelector(".lcdOsd") : null;
}

function getOSDValue() {
  return displayRoot ? displayRoot.querySelector(".lcdOsdValue") : null;
}

function getOSDBars() {
  return displayRoot ? [...displayRoot.querySelectorAll(".lcdOsdBar")] : [];
}

function saveDisplayState() {
  if (typeof state === "undefined") return;

  try {
    localStorage.setItem("ipodDisplayState", JSON.stringify({
      theme: state.theme,
      preset: state.preset,
      backlight: state.backlight,
      ink: state.ink,
      volume: state.volume,
      muted: state.muted,
      eq: state.eq
    }));
  } catch (e) {
    console.warn("Failed to save display state", e);
  }
}

function mapInkColor(theme, value) {
  const v = Number(value ?? 1);

  if (theme === "blue") {
    if (v <= 0.8) return "rgba(55,105,145,1)";
    if (v >= 1.2) return "rgba(2,12,20,1)";
    return "rgba(6,31,49,1)";
  }

  if (theme === "classic") {
    if (v <= 0.8) return "rgba(150,140,100,1)";
    if (v >= 1.2) return "rgba(50,45,25,1)";
    return "rgba(126,118,88,1)";
  }

  return "rgba(0,0,0,1)";
}

function mapLineColor(theme, value) {
  const v = Number(value ?? 1);

  if (theme === "blue") {
    if (v <= 0.8) return "rgba(70,120,160,1)";
    if (v >= 1.2) return "rgba(7,37,58,1)";
    return "rgba(7,37,58,.44)";
  }

  if (theme === "classic") {
    if (v <= 0.8) return "rgba(160,150,110,1)";
    if (v >= 1.2) return "rgba(95,88,60,1)";
    return "rgba(141,133,103,1)";
  }

  return "rgba(0,0,0,1)";
}

function mapProgressFill(theme, value) {
  const v = Number(value ?? 1);

  if (theme === "blue") {
    if (v <= 0.8) return "rgba(55,105,145,1)";
    if (v >= 1.2) return "rgba(2,12,20,1)";
    return "rgba(11,36,56,1)";
  }

  if (theme === "classic") {
    if (v <= 0.8) return "rgba(150,140,100,.22)";
    if (v >= 1.2) return "rgba(90,84,58,.34)";
    return "rgba(126,118,88,.18)";
  }

  return "rgba(0,0,0,1)";
}

function clearOSDTimer() {
  if (osdTimer) {
    clearTimeout(osdTimer);
    osdTimer = null;
  }
}

function closeOSDLater(timeout = 1000) {
  clearOSDTimer();

  if (timeout === null) return;

  osdTimer = setTimeout(() => {
    state.osd = null;
    state.volumeMode = false;
    rerenderActiveScreen();
  }, timeout);
}

function getVolumeLevelForIcon() {
  return state.muted ? 0 : Math.min(6, Math.max(0, Math.round((state.volume / state.volumeMax) * 6)));
}

function updateVolumeButtonInPlace() {
  const btn = getVolumeButton();
  if (!btn || typeof state === "undefined") return false;

  btn.dataset.level = String(getVolumeLevelForIcon());
  btn.classList.toggle("is-muted", !!state.muted);

  return true;
}

function updateVolumeOSDInPlace() {
  if (state.osd !== "volume") return false;

  const osd = getOSDRoot();
  const valueEl = getOSDValue();
  const bars = getOSDBars();

  if (!osd || !valueEl || !bars.length) return false;

  valueEl.textContent = `${state.muted ? "0" : state.volume}/${state.volumeMax}`;

  const activeCount = state.muted ? 0 : state.volume;
  bars.forEach((bar, i) => {
    bar.classList.toggle("is-on", activeCount > i);
  });

  return true;
}

function showOSD(type, timeout = 1000) {
  if (typeof state === "undefined") return;

  const sameVolumePanelOpen = type === "volume" && state.osd === "volume";

  state.osd = type;

  if (sameVolumePanelOpen) {
    updateVolumeButtonInPlace();
    updateVolumeOSDInPlace();
    closeOSDLater(timeout);
    return;
  }

  rerenderActiveScreen();
  updateVolumeButtonInPlace();
  updateVolumeOSDInPlace();
  closeOSDLater(timeout);
}

function applyDisplayState() {
  const lcd = getLCD();
  if (!lcd || typeof state === "undefined") return;

  lcd.classList.remove("boost", "dim", "washed", "overlay-off");

  lcd.style.setProperty("--lcd-backlight", state.backlight ?? 1);
  lcd.style.setProperty("--lcd-ink-color", mapInkColor(state.theme, state.ink));
  lcd.style.setProperty("--lcd-line-color", mapLineColor(state.theme, state.ink));
  lcd.style.setProperty("--lcd-progress-fill", mapProgressFill(state.theme, state.ink));

  if (state.preset === "dim") lcd.classList.add("dim");
  if (state.preset === "boost") lcd.classList.add("boost");
  if (state.preset === "washed") lcd.classList.add("washed");
  if (state.overlay === "off") lcd.classList.add("overlay-off");
}

function rerenderActiveScreen() {
  if (typeof renderCurrentScreen === "function") {
    renderCurrentScreen();
  } else if (typeof ui !== "undefined" && ui.open && typeof renderMenu === "function") {
    renderMenu();
  } else if (typeof renderPlayer === "function") {
    renderPlayer();
  }

  applyDisplayState();
  bindDisplayUI();
}

// ===== DISPLAY =====

function setDisplayMode(mode) {
  if (!displayRoot || typeof state === "undefined") return;

  state.theme = mode;
  state.font = mode;
  saveDisplayState();
  rerenderActiveScreen();
}

function setBacklight(value) {
  if (typeof state === "undefined") return;

  state.backlight = value;
  saveDisplayState();
  rerenderActiveScreen();
}

function setInk(value) {
  if (typeof state === "undefined") return;

  state.ink = value;
  saveDisplayState();
  rerenderActiveScreen();
}

function setPreset(name) {
  if (typeof state === "undefined") return;

  state.preset = name;

  if (name === "normal") {
    state.backlight = 1;
    state.ink = 1;
  } else if (name === "dim") {
    state.backlight = 0.8;
    state.ink = 0.85;
  } else if (name === "boost") {
    state.backlight = 1.2;
    state.ink = 1.2;
  } else if (name === "washed") {
    state.backlight = 1;
    state.ink = 0.6;
  }

  saveDisplayState();
  rerenderActiveScreen();
}

// ===== SOUND =====

function setVolume(value) {
  if (typeof state === "undefined") return;

  const max = state.volumeMax ?? 8;
  const next = Math.max(0, Math.min(max, value));

  state.volume = next;
  state.muted = next === 0;
  state.volumeMode = true;

  if (typeof syncVolumeToAudio === "function") {
    syncVolumeToAudio();
  }

  saveDisplayState();
  updateVolumeButtonInPlace();
  showOSD("volume", null);
}

function stepVolume(dir) {
  if (typeof state === "undefined") return;

  const current = state.muted ? 0 : state.volume;
  const next = current + dir;

  if (next < 0) {
    setVolume(0);
    return;
  }

  if (next > state.volumeMax) {
    setVolume(state.volumeMax);
    return;
  }

  setVolume(next);
}

function toggleMute() {
  if (typeof state === "undefined") return;

  state.muted = !state.muted;

  if (!state.muted && state.volume === 0) {
    state.volume = 4;
  }

  if (typeof syncVolumeToAudio === "function") {
    syncVolumeToAudio();
  }

  saveDisplayState();
  updateVolumeButtonInPlace();
  showOSD("mute", 950);
}

function openVolumeMode() {
  if (typeof state === "undefined") return;
  state.volumeMode = true;
  showOSD("volume", null);
}

function closeVolumeMode() {
  if (typeof state === "undefined") return;
  state.volumeMode = false;
  state.osd = null;
  clearOSDTimer();
  rerenderActiveScreen();
}

function setEq(name) {
  if (typeof state === "undefined") return;
  state.eq = name;
  saveDisplayState();
  rerenderActiveScreen();
}

// ===== TOPBAR / DISPLAY UI =====

function handleVolumeButtonSingleClick() {
  openVolumeMode();
}

function handleVolumeButtonDoubleClick() {
  if (volumeClickTimer) {
    clearTimeout(volumeClickTimer);
    volumeClickTimer = null;
  }
  toggleMute();
}

function bindDisplayUI() {
  if (!displayRoot) return;

  const volumeBtn = displayRoot.querySelector('[data-role="volume-button"]');
  if (volumeBtn) {
    volumeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (volumeClickTimer) {
        clearTimeout(volumeClickTimer);
        volumeClickTimer = null;
        handleVolumeButtonDoubleClick();
        return;
      }

      volumeClickTimer = setTimeout(() => {
        volumeClickTimer = null;
        handleVolumeButtonSingleClick();
      }, 230);
    };
  }

  const progress = getProgressBar();
  if (progress) {
    progress.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = progress.getBoundingClientRect();
      if (!rect.width) return;

      const ratio = (e.clientX - rect.left) / rect.width;

      if (typeof seekToRatio === "function") {
        seekToRatio(ratio);
      }
    };
  }
}

// ===== WHEEL =====

const menuBtn = document.querySelector(".iWheelIcon--top .cardBtn");
const btnTop = document.querySelector(".iWheelZone--top");
const btnRight = document.querySelector(".iWheelZone--right");
const btnBottom = document.querySelector(".iWheelZone--bottom");
const btnCenter = document.querySelector(".iWheelCenter");
const btnLeft = document.querySelector(".iWheelZone--left");

if (menuBtn) {
  menuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof state !== "undefined" && state.volumeMode) {
      closeVolumeMode();
      return;
    }

    if (typeof toggleMenu === "function") {
      toggleMenu();
    }
  });
}

if (btnTop) {
  btnTop.addEventListener("click", () => {
    if (typeof state !== "undefined" && state.volumeMode) {
      stepVolume(1);
    }
  });
}

if (btnRight) {
  btnRight.addEventListener("click", () => {
    if (typeof state !== "undefined" && state.volumeMode) {
      stepVolume(1);
      return;
    }

    if (typeof nextTrack === "function") {
      nextTrack();
    }
  });
}

if (btnBottom) {
  btnBottom.addEventListener("click", () => {
    if (typeof state !== "undefined" && state.volumeMode) {
      stepVolume(-1);
      return;
    }

    if (typeof togglePlayPause === "function") {
      togglePlayPause();
    }
  });
}

if (btnCenter) {
  btnCenter.addEventListener("click", () => {
    if (typeof state !== "undefined" && state.volumeMode) {
      closeVolumeMode();
      return;
    }

    if (typeof ui !== "undefined" && ui.open && typeof menuSelect === "function") {
      menuSelect();
      return;
    }

    if (typeof togglePlayPause === "function") {
      togglePlayPause();
    }
  });
}

if (btnLeft) {
  btnLeft.addEventListener("click", () => {
    if (typeof state !== "undefined" && state.volumeMode) {
      stepVolume(-1);
      return;
    }

    if (typeof prevTrack === "function") {
      prevTrack();
    }
  });
}

applyDisplayState();
bindDisplayUI();
