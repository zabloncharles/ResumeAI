export const TRANSCRIPT_CHUNK_CHARS = 40000;
export const TRANSCRIPT_MAX_CHUNKS = 4;

export function chunkTranscript(
  transcript,
  chunkSize = TRANSCRIPT_CHUNK_CHARS
) {
  const text = String(transcript || "").trim();
  if (!text) return [];
  if (text.length <= chunkSize) return [text];

  const chunks = [];
  let start = 0;

  while (start < text.length && chunks.length < TRANSCRIPT_MAX_CHUNKS) {
    let end = Math.min(start + chunkSize, text.length);
    if (end < text.length) {
      const windowStart = Math.max(start + Math.floor(chunkSize * 0.7), start);
      const slice = text.slice(windowStart, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! ")
      );
      if (breakAt > 0) {
        end = windowStart + breakAt + 1;
      }
    }
    const piece = text.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start = end;
  }

  if (start < text.length && chunks.length < TRANSCRIPT_MAX_CHUNKS) {
    const rest = text.slice(start).trim();
    if (rest) chunks.push(rest);
  }

  return chunks;
}
