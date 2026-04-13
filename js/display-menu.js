// ===== MENU STATE =====

const ui = {
  open: false,
  stack: ["main"],
  index: 0
};

// ===== MENU DEFINICE =====

const menus = {
  main: [
    { label: "Now Playing", action: "player" },
    { label: "Library", action: "library" },
    { label: "Display", action: "display" },
    { label: "Sound", action: "sound" },
    { label: "About", action: "noop" }
  ],

  display: [
    { label: "Theme", action: "theme" },
    { label: "Preset", action: "preset" },
    { label: "Backlight", action: "backlight" },
    { label: "Ink", action: "ink" },
    { label: "‹", action: "back" }
  ],

  sound: [
    { label: "Volume", action: "volume-open" },
    { label: "Equalizer", action: "eq" },
    { label: "‹", action: "back" }
  ],

  eq: [
    { label: "Flat", action: "eq-flat" },
    { label: "Soft", action: "eq-soft" },
    { label: "Punch", action: "eq-punch" },
    { label: "Bright", action: "eq-bright" },
    { label: "‹", action: "back" }
  ],

  theme: [
    { label: "Classic", action: "theme-classic" },
    { label: "Blue", action: "theme-blue" },
    { label: "‹", action: "back" }
  ],

  preset: [
    { label: "Normal", action: "preset-normal" },
    { label: "Dim", action: "preset-dim" },
    { label: "Boost", action: "preset-boost" },
    { label: "Washed", action: "preset-washed" },
    { label: "‹", action: "back" }
  ],

  backlight: [
    { label: "0.8", action: "backlight-0.8" },
    { label: "1.0", action: "backlight-1.0" },
    { label: "1.2", action: "backlight-1.2" },
    { label: "‹", action: "back" }
  ],

  ink: [
    { label: "0.8", action: "ink-0.8" },
    { label: "1.0", action: "ink-1.0" },
    { label: "1.2", action: "ink-1.2" },
    { label: "‹", action: "back" }
  ]
};

// ===== HELPERS =====

function currentMenuKey() {
  return ui.stack[ui.stack.length - 1];
}

function currentMenu() {
  return menus[currentMenuKey()];
}

function isSubmenuAction(action) {
  return !!menus[action];
}

function menuTitleFromKey(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function menuValueFor(item) {
  const key = currentMenuKey();

  if (key === "display") {
    if (item.action === "theme") return state.theme;
    if (item.action === "preset") return state.preset;
    if (item.action === "backlight") return String(state.backlight);
    if (item.action === "ink") return String(state.ink);
  }

  if (key === "sound") {
    if (item.action === "volume-open") return state.muted ? "mute" : `${state.volume}/${state.volumeMax}`;
    if (item.action === "eq") return state.eq;
  }

  return "";
}

function renderVolumeIcon() {
  const level = state.muted ? 0 : Math.min(6, Math.max(0, Math.round((state.volume / state.volumeMax) * 6)));

  return `
    <button
      type="button"
      class="lcdVolumeBtn ${state.muted ? "is-muted" : ""}"
      data-role="volume-button"
      data-level="${level}"
      aria-label="Volume"
      title="Volume"
    >
      <span class="lcdVolumeBar lcdVolumeBar--1"></span>
      <span class="lcdVolumeBar lcdVolumeBar--2"></span>
      <span class="lcdVolumeBar lcdVolumeBar--3"></span>
      <span class="lcdVolumeBar lcdVolumeBar--4"></span>
      <span class="lcdVolumeBar lcdVolumeBar--5"></span>
      <span class="lcdVolumeBar lcdVolumeBar--6"></span>
    </button>
  `;
}

function renderOSD() {
  if (!state.osd) return "";

  if (state.osd === "mute") {
    return `
      <div class="lcdOsd">
        <div class="lcdOsdMute">${state.muted ? "Mute" : "Sound On"}</div>
      </div>
    `;
  }

  if (state.osd === "volume") {
    return `
      <div class="lcdOsd">
        <div class="lcdOsdTitle">Volume</div>
        <div class="lcdOsdValue">${state.muted ? "0" : state.volume}/${state.volumeMax}</div>
        <div class="lcdOsdBars">
          ${Array.from({ length: state.volumeMax }).map((_, i) => `
            <span class="lcdOsdBar ${(state.muted ? 0 : state.volume) > i ? "is-on" : ""}"></span>
          `).join("")}
        </div>
      </div>
    `;
  }

  return "";
}

function ensureMenuSelectionVisible() {
  const body = document.querySelector(".lcdMenuBody");
  const active = document.querySelector(".lcdMenuItem.is-active");

  if (!body || !active) return;

  active.scrollIntoView({
    block: "nearest",
    inline: "nearest"
  });
}

function bindMenuClicks() {
  document.querySelectorAll(".lcdMenuItem").forEach((item, i) => {
    item.addEventListener("click", () => {
      ui.index = i;
      menuSelect();
    });
  });
}

// ===== RENDER =====

function renderMenu() {
  const root = document.getElementById("displayRoot");
  const key = currentMenuKey();
  const menu = currentMenu();

  if (!root) return;

  root.className = `displayRoot theme-${state.theme}`;
  if (typeof state !== "undefined") state.screen = "menu";

  root.innerHTML = `
    <div class="lcd">
      <div class="lcdTopbar">
        <div></div>
        <div class="lcdArtistTop">${key === "main" ? "Menu" : menuTitleFromKey(key)}</div>
        ${renderVolumeIcon()}
      </div>

      <div class="lcdMenuBody">
        ${menu.map((item, i) => `
          <button type="button" class="lcdMenuItem ${i === ui.index ? "is-active" : ""} ${item.action === "back" ? "is-back" : ""}">
            <span class="lcdMenuLabel">${item.label}</span>
            <span class="lcdMenuSide">
              <span class="lcdMenuValue">${menuValueFor(item)}</span>
              <span class="lcdMenuArrow">${isSubmenuAction(item.action) ? "›" : ""}</span>
            </span>
          </button>
        `).join("")}
      </div>

      ${renderOSD()}
    </div>
  `;

  bindMenuClicks();
  ensureMenuSelectionVisible();

  if (typeof bindDisplayUI === "function") {
    bindDisplayUI();
  }

  if (typeof applyDisplayState === "function") {
    applyDisplayState();
  }
}

// ===== OPEN / CLOSE =====

function openMenu() {
  ui.open = true;
  ui.stack = ["main"];
  ui.index = 0;
  if (typeof state !== "undefined") state.screen = "menu";
  renderMenu();
}

function closeMenu() {
  ui.open = false;
  if (typeof state !== "undefined") state.screen = "player";
  if (typeof renderPlayer === "function") {
    renderPlayer();
  }
}

function toggleMenu() {
  if (ui.open) {
    closeMenu();
  } else {
    openMenu();
  }
}

// ===== NAVIGACE =====

function menuUp() {
  const menu = currentMenu();
  ui.index = (ui.index - 1 + menu.length) % menu.length;
  renderMenu();
}

function menuDown() {
  const menu = currentMenu();
  ui.index = (ui.index + 1) % menu.length;
  renderMenu();
}

function menuBack() {
  if (!ui.open) return;

  if (ui.stack.length > 1) {
    ui.stack.pop();
    ui.index = 0;
    renderMenu();
    return;
  }

  closeMenu();
}

// ===== AKCE =====

function menuSelect() {
  const item = currentMenu()[ui.index];
  if (!item) return;

  if (isSubmenuAction(item.action)) {
    ui.stack.push(item.action);
    ui.index = 0;
    renderMenu();
    return;
  }

  if (item.action === "back") {
    menuBack();
    return;
  }

  if (item.action === "player") {
    closeMenu();
    return;
  }
  if (item.action === "library") {
  ui.open = false;
  if (typeof state !== "undefined") state.screen = "library";
  if (typeof renderLibrary === "function") {
    renderLibrary();
  }
  return;
}
  if (item.action === "volume-open") {
    openVolumeMode();
    return;
  }

  if (item.action === "theme-classic") {
    setDisplayMode("classic");
    return;
  }

  if (item.action === "theme-blue") {
    setDisplayMode("blue");
    return;
  }

  if (item.action.startsWith("preset-")) {
    const name = item.action.split("-")[1];
    setPreset(name);
    return;
  }

  if (item.action.startsWith("backlight-")) {
    const val = parseFloat(item.action.split("-")[1]);
    setBacklight(val);
    return;
  }

  if (item.action.startsWith("ink-")) {
    const val = parseFloat(item.action.split("-")[1]);
    setInk(val);
    return;
  }

  if (item.action === "eq-flat") {
    setEq("flat");
    return;
  }

  if (item.action === "eq-soft") {
    setEq("soft");
    return;
  }

  if (item.action === "eq-punch") {
    setEq("punch");
    return;
  }

  if (item.action === "eq-bright") {
    setEq("bright");
    return;
  }
}
