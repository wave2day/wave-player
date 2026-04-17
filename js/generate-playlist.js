const fs = require("fs");
const path = require("path");

const mediaDir = path.join(__dirname, "media");
const outputFile = path.join(__dirname, "js", "playlist-data.js");

const allowedExt = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function buildPlaylistData() {
  if (!fs.existsSync(mediaDir)) {
    throw new Error(`Media folder not found: ${mediaDir}`);
  }

  const files = fs
    .readdirSync(mediaDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => allowedExt.has(path.extname(name).toLowerCase()))
    .sort(naturalCompare);

  const tracks = files.map((fileName, index) => ({
    id: String(index + 1),
    audioUrl: `media/${fileName}`
  }));

  const content =
`const playlistData = {
  title: "Playlist",
  tracks: ${JSON.stringify(tracks, null, 2)}
};
`;

  fs.writeFileSync(outputFile, content, "utf8");

  console.log(`Generated ${tracks.length} tracks into ${outputFile}`);
}

try {
  buildPlaylistData();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}