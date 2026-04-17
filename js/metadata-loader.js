function extractFileName(path) {
  return path.split("/").pop().replace(/\.[^/.]+$/, "");
}

function loadTrackMetadata(track) {
  return new Promise((resolve) => {
    if (!window.jsmediatags) {
      resolve({
        ...track,
        title: extractFileName(track.audioUrl),
        artist: "Unknown",
        album: "Unknown"
      });
      return;
    }

    new window.jsmediatags.Reader(track.audioUrl).read({
      onSuccess: function(result) {
        const tags = result.tags || {};

        resolve({
          ...track,
          title: tags.title || extractFileName(track.audioUrl),
          artist: tags.artist || "Unknown",
          album: tags.album || "Unknown"
        });
      },
      onError: function() {
        resolve({
          ...track,
          title: extractFileName(track.audioUrl),
          artist: "Unknown",
          album: "Unknown"
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