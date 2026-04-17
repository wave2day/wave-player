const playlistData = {
  title: "Playlist",
  tracks: []
};

const playlistSource = {
  owner: "wave2day",
  repo: "wave-player",
  branch: "main",
  mediaPath: "media"
};

async function loadPlaylistDataFromGitHub() {
  const { owner, repo, branch, mediaPath } = playlistSource;

  const url =
    `https://api.github.com/repos/${owner}/${repo}/contents/${mediaPath}?ref=${encodeURIComponent(branch)}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}`);
  }

  const items = await res.json();

  const audioExt = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);

  const tracks = items
    .filter((item) => item.type === "file")
    .filter((item) => {
      const lower = item.name.toLowerCase();
      return Array.from(audioExt).some((ext) => lower.endsWith(ext));
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
    .map((item, index) => ({
      id: String(index + 1),
      audioUrl: item.download_url || `${mediaPath}/${item.name}`
    }));

  playlistData.tracks = tracks;
  return playlistData;
}