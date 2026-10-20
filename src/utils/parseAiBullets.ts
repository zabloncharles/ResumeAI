const bulletPrefix =
  /^(\s*([-–—*•]|\d+[.)])\s+)(.+)$/;

export function parseAiBulletLines(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const fromBullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(bulletPrefix);
    if (match?.[3]) {
      fromBullets.push(match[3].trim());
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      fromBullets.push(trimmed.slice(2).trim());
    }
  }

  if (fromBullets.length >= 2) {
    return fromBullets.slice(0, 8);
  }

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 20);

  if (paragraphs.length >= 2) {
    return paragraphs.slice(0, 8);
  }

  const singles = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 15 && !/^#/.test(l));

  return singles.slice(0, 8);
}
