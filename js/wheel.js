const wheelRoot = document.querySelector(".iWheel");
const wheelCenterBtn = document.querySelector(".iWheelCenter");
const wheelTopZone = document.querySelector(".iWheelZone--top");
const wheelRightZone = document.querySelector(".iWheelZone--right");
const wheelBottomZone = document.querySelector(".iWheelZone--bottom");
const wheelLeftZone = document.querySelector(".iWheelZone--left");
const menuBtn = document.querySelector(".iWheelIcon--top .cardBtn");

const wheelState = {
  tracking: false,
  pointerId: null,
  lastAngle: null,
  angleBuffer: 0,
  lastStepAt: 0
};

const WHEEL_STEP_DEG = 22;
const WHEEL_THROTTLE_MS = 22;
const PLAYER_SEEK_STEP = 10; // sekundy

/* aktivní prstenec: jen oblast mezi středem a vnějším okrajem */
const WHEEL_ACTIVE_INNER_RATIO = 0.30;
const WHEEL_ACTIVE_OUTER_RATIO = 0.50;

function normalizeAngleDelta(delta) {
  let d = delta;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

function getWheelMetrics() {
  if (!wheelRoot) return null;

  const rect = wheelRoot.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const radius = rect.width / 2;

  return { rect, cx, cy, radius };
}

function getPointerPolar(clientX, clientY) {
  const m = getWheelMetrics();
  if (!m) return null;

  const dx = clientX - m.cx;
  const dy = clientY - m.cy;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return {
    ...m,
    dx,
    dy,
    distance,
    angle
  };
}

function isInsideWheelRing(clientX, clientY) {
  const p = getPointerPolar(clientX, clientY);
  if (!p) return false;

  const minR = p.radius * WHEEL_ACTIVE_INNER_RATIO;
  const maxR = p.radius * WHEEL_ACTIVE_OUTER_RATIO;

  return p.distance >= minR && p.distance <= maxR;
}

function shouldIgnoreWheelGestureTarget(target) {
  if (!target) return true;

  return !!(
    target.closest(".iWheelCenter") ||
    target.closest(".iWheelZone") ||
    target.closest(".cardBtn")
  );
}

function canHandleWheelRotation() {
  return (
    typeof ui !== "undefined" &&
    typeof state !== "undefined" &&
    (
      ui.open ||
      state.volumeMode ||
      state.screen === "library" ||
      state.screen === "player"
    )
  );
}

function seekPlayerBy(seconds) {
  if (typeof player === "undefined" || !player.audio) return;

  const audio = player.audio;
  const duration = audio.duration || 0;
  if (!duration) return;

  const nextTime = Math.max(0, Math.min(duration, (audio.currentTime || 0) + seconds));
  audio.currentTime = nextTime;

  if (typeof syncNowPlayingTimes === "function") syncNowPlayingTimes();
  if (typeof updateProgressUI === "function") updateProgressUI();
  if (typeof updateTimesUI === "function") updateTimesUI();
}

function applyWheelStep(direction) {
  if (typeof state === "undefined") return;

  if (state.screen === "library") {
    if (direction > 0) {
      if (typeof libraryDown === "function") libraryDown();
    } else {
      if (typeof libraryUp === "function") libraryUp();
    }
    return;
  }

  if (state.screen === "player" && !state.volumeMode && !(typeof ui !== "undefined" && ui.open)) {
    if (direction > 0) {
      seekPlayerBy(PLAYER_SEEK_STEP);
    } else {
      seekPlayerBy(-PLAYER_SEEK_STEP);
    }
    return;
  }

  /* CW = dolů v menu, hlasitost +1
     CCW = nahoru v menu, hlasitost -1 */
  if (state.volumeMode) {
    if (typeof stepVolume === "function") {
      stepVolume(direction > 0 ? 1 : -1);
    }
    return;
  }

  if (typeof ui !== "undefined" && ui.open) {
    if (direction > 0) {
      if (typeof menuDown === "function") menuDown();
    } else {
      if (typeof menuUp === "function") menuUp();
    }
  }
}

function beginWheelTracking(e) {
  if (!wheelRoot) return;
  if (!canHandleWheelRotation()) return;
  if (shouldIgnoreWheelGestureTarget(e.target)) return;
  if (!isInsideWheelRing(e.clientX, e.clientY)) return;

  const p = getPointerPolar(e.clientX, e.clientY);
  if (!p) return;

  wheelState.tracking = true;
  wheelState.pointerId = e.pointerId;
  wheelState.lastAngle = p.angle;
  wheelState.angleBuffer = 0;
  wheelState.lastStepAt = 0;

  wheelRoot.setPointerCapture?.(e.pointerId);
  e.preventDefault();
  e.stopPropagation();
}

function updateWheelTracking(e) {
  if (!wheelState.tracking) return;
  if (wheelState.pointerId !== e.pointerId) return;

  const p = getPointerPolar(e.clientX, e.clientY);
  if (!p) return;

  const delta = normalizeAngleDelta(p.angle - wheelState.lastAngle);
  wheelState.lastAngle = p.angle;
  wheelState.angleBuffer += delta;

  const now = Date.now();
  if (now - wheelState.lastStepAt < WHEEL_THROTTLE_MS) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  while (Math.abs(wheelState.angleBuffer) >= WHEEL_STEP_DEG) {
    const direction = wheelState.angleBuffer > 0 ? 1 : -1;
    applyWheelStep(direction);
    wheelState.angleBuffer -= WHEEL_STEP_DEG * direction;
    wheelState.lastStepAt = now;
  }

  e.preventDefault();
  e.stopPropagation();
}

function endWheelTracking(e) {
  if (!wheelState.tracking) return;
  if (wheelState.pointerId !== e.pointerId) return;

  wheelState.tracking = false;
  wheelState.pointerId = null;
  wheelState.lastAngle = null;
  wheelState.angleBuffer = 0;

  wheelRoot.releasePointerCapture?.(e.pointerId);
}

function resetWheelTracking() {
  wheelState.tracking = false;
  wheelState.pointerId = null;
  wheelState.lastAngle = null;
  wheelState.angleBuffer = 0;
  wheelState.lastStepAt = 0;
}

function setZonePressed(zone, pressed) {
  if (!zone) return;
  zone.classList.toggle("is-pressed", pressed);
}

function pulseHaptic(ms = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

function bindZoneFeedback(zone) {
  if (!zone) return;

  zone.addEventListener("pointerdown", () => {
    setZonePressed(zone, true);
    pulseHaptic(10);
  });

  zone.addEventListener("pointerup", () => {
    setZonePressed(zone, false);
  });

  zone.addEventListener("pointercancel", () => {
    setZonePressed(zone, false);
  });

  zone.addEventListener("pointerleave", () => {
    setZonePressed(zone, false);
  });
}

if (wheelRoot) {
  wheelRoot.addEventListener("pointerdown", beginWheelTracking);
  wheelRoot.addEventListener("pointermove", updateWheelTracking);
  wheelRoot.addEventListener("pointerup", endWheelTracking);
  wheelRoot.addEventListener("pointercancel", endWheelTracking);
  wheelRoot.addEventListener("lostpointercapture", resetWheelTracking);
}

/* ===== KLIKY NA 4 KRUHY + STŘED ===== */

bindZoneFeedback(wheelTopZone);
bindZoneFeedback(wheelRightZone);
bindZoneFeedback(wheelBottomZone);
bindZoneFeedback(wheelLeftZone);

if (menuBtn) {
  menuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
}

if (wheelTopZone) {
  wheelTopZone.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof state !== "undefined" && state.volumeMode) {
      if (typeof stepVolume === "function") stepVolume(1);
      return;
    }

    if (typeof toggleMenu === "function") {
      toggleMenu();
    }
  });
}

if (wheelRightZone) {
  wheelRightZone.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof state !== "undefined" && state.volumeMode) {
      if (typeof stepVolume === "function") stepVolume(1);
      return;
    }

    if (typeof nextTrack === "function") {
      nextTrack();
    }
  });
}

if (wheelBottomZone) {
  wheelBottomZone.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof state !== "undefined" && state.volumeMode) {
      if (typeof stepVolume === "function") stepVolume(-1);
      return;
    }

    if (typeof togglePlayPause === "function") {
      togglePlayPause();
    }
  });
}

if (wheelLeftZone) {
  wheelLeftZone.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof state !== "undefined" && state.volumeMode) {
      if (typeof stepVolume === "function") stepVolume(-1);
      return;
    }

    if (typeof prevTrack === "function") {
      prevTrack();
    }
  });
}

if (wheelCenterBtn) {
  wheelCenterBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof state !== "undefined" && state.volumeMode) {
      if (typeof closeVolumeMode === "function") {
        closeVolumeMode();
      }
      return;
    }

    if (typeof state !== "undefined" && state.screen === "library") {
      if (typeof librarySelect === "function") {
        librarySelect();
      }
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