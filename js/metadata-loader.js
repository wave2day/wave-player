function extractFileName(path) {
  const raw = (path || "").split("/").pop() || "";
  let decoded = raw;

  try {
    decoded = decodeURIComponent(raw);
  } catch (e) {}

  decoded = decoded.replace(/\+/g, " ");
  return decoded.replace(/\.[^/.]+$/, "").trim();
}

function safeMeta(value, fallback = "Unknown") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return fallback;
}

function inferMetaFromFilename(path) {
  const base = extractFileName(path);
  const parts = base.split(" - ");

  if (parts.length >= 2) {
    return {
      artist: safeMeta(parts[0], "Unknown"),
      title: safeMeta(parts.slice(1).join(" - "), base || "Unknown"),
      album: "Unknown"
    };
  }

  return {
    artist: "Unknown",
    title: safeMeta(base, "Unknown"),
    album: "Unknown"
  };
}

function pictureToDataUrl(picture) {
  if (!picture || !picture.data || !picture.format) return "";

  let binary = "";
  const bytes = picture.data;

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return `data:${picture.format};base64,${btoa(binary)}`;
}

function loadTrackMetadata(track) {
  return new Promise((resolve) => {
    const fallback = inferMetaFromFilename(track.audioUrl);

    if (!window.jsmediatags) {
      resolve({
        ...track,
        title: fallback.title,
        artist: fallback.artist,
        album: fallback.album,
        coverArt: ""
      });
      return;
    }

    new window.jsmediatags.Reader(track.audioUrl).read({
      onSuccess(result) {
        const tags = result?.tags || {};

        resolve({
          ...track,
          title: safeMeta(tags.title, fallback.title),
          artist: safeMeta(tags.artist, fallback.artist),
          album: safeMeta(tags.album, fallback.album),
          coverArt: pictureToDataUrl(tags.picture)
        });
      },
      onError() {
        resolve({
          ...track,
          title: fallback.title,
          artist: fallback.artist,
          album: fallback.album,
          coverArt: ""
        });
      }
    });
  });
}

async function buildPlaylistFromMetadata(sourcePlaylist) {
  if (!sourcePlaylist || !Array.isArray(sourcePlaylist.tracks)) {
    return {
      title: sourcePlaylist?.title || "Playlist",
      tracks: []
    };
  }

  const enrichedTracks = await Promise.all(
    sourcePlaylist.tracks.map((track) => loadTrackMetadata(track))
  );

  return {
    ...sourcePlaylist,
    tracks: enrichedTracks
  };
}