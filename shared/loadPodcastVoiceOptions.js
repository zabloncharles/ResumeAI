import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { statSync } from "fs";

const here = dirname(fileURLToPath(import.meta.url));
const voiceOptionsPath = join(here, "podcastVoiceOptions.js");

export async function loadPodcastVoiceOptions() {
  const href = `${pathToFileURL(voiceOptionsPath).href}?t=${statSync(voiceOptionsPath).mtimeMs}`;
  return import(href);
}
