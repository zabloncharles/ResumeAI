export function pcmToWavBuffer(
  pcmChunks,
  options = {}
) {
  const sampleRate = options.sampleRate ?? 24000;
  const channels = options.channels ?? 1;
  const bitDepth = options.bitDepth ?? 16;

  const parts = pcmChunks.map((chunk) =>
    Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
  );
  const dataSize = parts.reduce((sum, part) => sum + part.length, 0);
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE((channels * bitDepth) / 8, 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = headerSize;
  for (const part of parts) {
    part.copy(buffer, offset);
    offset += part.length;
  }

  return buffer;
}

export function wavDurationSecondsFromBuffer(buffer) {
  if (!buffer || buffer.length < 44) return 0;
  const byteRate = buffer.readUInt32LE(28);
  const dataSize = buffer.readUInt32LE(40);
  if (!byteRate || !dataSize) return 0;
  return dataSize / byteRate;
}
