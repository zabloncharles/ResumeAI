export function pcmToWavBlob(
  pcmChunks: ArrayBuffer[],
  options: {
    sampleRate?: number;
    channels?: number;
    bitDepth?: number;
  } = {}
): Blob {
  const sampleRate = options.sampleRate ?? 24000;
  const channels = options.channels ?? 1;
  const bitDepth = options.bitDepth ?? 16;

  const pcmParts = pcmChunks.map((chunk) => new Uint8Array(chunk));
  const dataSize = pcmParts.reduce((sum, part) => sum + part.length, 0);
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = headerSize;
  const bytes = new Uint8Array(buffer);
  for (const part of pcmParts) {
    bytes.set(part, offset);
    offset += part.length;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function wavDurationSecondsFromBuffer(buffer: ArrayBuffer): number {
  if (buffer.byteLength < 44) return 0;
  const view = new DataView(buffer);
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  const wave = String.fromCharCode(
    view.getUint8(8),
    view.getUint8(9),
    view.getUint8(10),
    view.getUint8(11)
  );
  if (riff !== "RIFF" || wave !== "WAVE") return 0;

  const byteRate = view.getUint32(28, true);
  const dataSize = view.getUint32(40, true);
  if (!byteRate || !dataSize) return 0;
  return dataSize / byteRate;
}

export async function wavBlobDurationSeconds(blob: Blob): Promise<number> {
  return wavDurationSecondsFromBuffer(await blob.arrayBuffer());
}
