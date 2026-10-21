export const TRANSCRIPT_CHUNK_CHARS = 40000;
export const TRANSCRIPT_MAX_CHUNKS = 4;
export const TRANSCRIPT_MAX_CHARS =
  TRANSCRIPT_CHUNK_CHARS * TRANSCRIPT_MAX_CHUNKS;

export function chunkTranscript(
  transcript: string,
  chunkSize = TRANSCRIPT_CHUNK_CHARS
): string[] {
  const text = transcript.trim();
  if (!text) return [];
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
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

  return chunks;
}

export function dedupeStudyCards<
  T extends { front: string; back: string }
>(cards: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const card of cards) {
    const key = card.front.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(card);
  }

  return out;
}
