const root = document.getElementById("displayRoot");

function applyTheme() {
  if (!root) return;
  root.className = `displayRoot theme-${state.theme}`;
}

function renderPlaybackStateIcon() {
  const isPlaying =
    typeof player !== "undefined" &&
    player.audio &&
    !player.audio.paused;

  if (isPlaying) {
    return `
      <svg class="lcdGlyph" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 5v14l11-7z"></path>
      </svg>
    `;
  }

  return `
    <svg class="lcdGlyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z"></path>
    </svg>
  `;
}

function renderShuffleStateIcon() {
  if (typeof state === "undefined" || !state.shuffle) return "";

  return `
    <svg class="lcdModeGlyph" viewBox="-20 0 260 240" aria-hidden="true">
      <path d="M 88 18 H 190 A 30 30 0 0 1 220 48 V 74 A 30 30 0 0 1 190 104 H 148"
        fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 92 104 H 50 A 30 30 0 0 0 20 134 V 160 A 30 30 0 0 0 50 190 H 152"
        fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 70 71 L 70 137 L 114 104 Z" fill="currentColor"/>
      <path d="M 170 71 L 170 137 L 126 104 Z" fill="currentColor"/>
    </svg>
  `;
}

function renderRepeatStateIcon() {
  if (typeof state === "undefined" || state.repeat === "off") return "";

  const repeatBase = `
    <svg class="lcdModeGlyph" viewBox="-20 0 260 240" aria-hidden="true">
      <path d="M 50 18 H 190 A 30 30 0 0 1 220 48 V 160 A 30 30 0 0 1 190 190 H 88"
        fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 20 48 A 30 30 0 0 1 50 18"
        fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 20 48 V 132"
        fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round"/>
      <path d="M -13 132 L 20 176 L 53 132 Z" fill="currentColor"/>
    </svg>
  `;

  if (state.repeat === "all") {
    return repeatBase;
  }

  if (state.repeat === "one") {
    return `
      <div class="lcdModeOneWrap">
        ${repeatBase}
        <span class="lcdModeOne">1</span>
      </div>
    `;
  }

  return "";
}

function renderVolumeIcon() {
  const level = state.muted
    ? 0
    : Math.min(6, Math.max(0, Math.round((state.volume / state.volumeMax) * 6)));

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

function renderStateCluster() {
  return `
    <div class="lcdStateCluster">
      <div class="lcdStateIcon">
        ${renderPlaybackStateIcon()}
      </div>
      <div class="lcdModeSlot">
        ${renderShuffleStateIcon()}
      </div>
      <div class="lcdModeSlot">
        ${renderRepeatStateIcon()}
      </div>
    </div>
  `;
}

function renderPlayer() {
  if (!root) return;

  state.screen = "player";
  applyTheme();

  const metaText =
    typeof player !== "undefined" &&
    player &&
    Array.isArray(player.playlist) &&
    player.playlist.length
      ? `${player.index + 1} of ${player.playlist.length}`
      : "0 of 0";

  root.innerHTML = `
    <div class="lcd">
      <div class="lcdTopbar">
        ${renderStateCluster()}

        <div class="lcdArtistTop" data-text="${state.nowPlaying.artist}">
          ${state.nowPlaying.artist}
        </div>

        ${renderVolumeIcon()}
      </div>

      <div class="lcdMain">
        <div class="lcdMeta">${metaText}</div>

        <div class="lcdCenter">
          <div class="lcdTitle" data-text="${state.nowPlaying.title}">
            ${state.nowPlaying.title}
          </div>

          <div class="lcdArtist" data-text="${state.nowPlaying.artist}">
            ${state.nowPlaying.artist}
          </div>

          <div class="lcdAlbum" data-text="${state.nowPlaying.album}">
            ${state.nowPlaying.album}
          </div>
        </div>
      </div>

      <div class="lcdBottom">
        <div class="lcdProgressWrap">
          <div class="lcdProgress">
            <div class="lcdProgressFill" style="width: 0%"></div>
          </div>

          <div class="lcdTimes">
            <span data-text="${state.nowPlaying.time}">
              ${state.nowPlaying.time}
            </span>
            <span data-text="${state.nowPlaying.remaining}">
              ${state.nowPlaying.remaining}
            </span>
          </div>
        </div>
      </div>

      ${renderOSD()}
    </div>
  `;

  if (typeof bindDisplayUI === "function") {
    bindDisplayUI();
  }

  if (typeof applyDisplayState === "function") {
    applyDisplayState();
  }
}

function renderLibrary() {
  if (!root || typeof player === "undefined") return;

  state.screen = "library";
  applyTheme();

  const tracks = player.playlist || [];

  root.innerHTML = `
    <div class="lcd">
      <div class="lcdTopbar">
        ${renderStateCluster()}
        <div class="lcdArtistTop">Library</div>
        ${renderVolumeIcon()}
      </div>

      <div class="lcdList">
        ${tracks.map((t, i) => `
          <div class="lcdListItem ${i === player.index ? "is-active" : ""}" data-index="${i}">
            <div class="lcdListTitle">${t.title}</div>
            <div class="lcdListArtist">${t.artist}</div>
          </div>
        `).join("")}
      </div>

      ${renderOSD()}
    </div>
  `;

  bindLibraryUI();

  if (typeof bindDisplayUI === "function") {
    bindDisplayUI();
  }

  if (typeof applyDisplayState === "function") {
    applyDisplayState();
  }
}

function bindLibraryUI() {
  const items = root.querySelectorAll(".lcdListItem");

  items.forEach((el) => {
    el.addEventListener("click", () => {
      const index = Number(el.dataset.index);

      if (typeof loadTrack === "function") {
        loadTrack(index, true);
      }

      state.screen = "player";
      renderPlayer();
    });
  });
}

function renderCurrentScreen() {
  if (state.screen === "menu") {
    renderMenu();
    return;
  }

  if (state.screen === "library") {
    renderLibrary();
    return;
  }

  renderPlayer();
}

renderPlayer();
