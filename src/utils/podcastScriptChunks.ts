export const PODCAST_TTS_CHUNK_CHARS = 3800;
export const PODCAST_SOURCE_MAX_CHARS = 48000;

export function chunkPodcastScript(
  script: string,
  chunkSize = PODCAST_TTS_CHUNK_CHARS
): string[] {
  const text = script.trim();
  if (!text) return [];
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    if (end < text.length) {
      const windowStart = Math.max(start + Math.floor(chunkSize * 0.65), start);
      const slice = text.slice(windowStart, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("\n")
      );
      if (breakAt > 0) {
        end = windowStart + breakAt + 1;
      }
    }
    const piece = text.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start = end;
  }

  return chunks;
}
