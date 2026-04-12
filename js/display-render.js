const root = document.getElementById("displayRoot");

function applyTheme() {
  if (!root) return;
  root.className = `displayRoot theme-${state.theme}`;
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

function renderPlayer() {
  if (!root) return;

  state.screen = "player";
  applyTheme();

  root.innerHTML = `
    <div class="lcd">
      <div class="lcdTopbar">
        <div class="lcdPlay"></div>

        <div class="lcdArtistTop" data-text="${state.nowPlaying.artist}">
          ${state.nowPlaying.artist}
        </div>

        ${renderVolumeIcon()}
      </div>

      <div class="lcdMain">
        <div class="lcdMeta">34 of 39</div>

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
            <div class="lcdProgressFill"></div>
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

function renderCurrentScreen() {
  if (state.screen === "menu") {
    renderMenu();
    return;
  }

  renderPlayer();
}

renderPlayer();