export const PODCAST_EMOTIONS = [
  { id: "neutral", label: "Neutral", hint: "Even, steady delivery." },
  { id: "warm", label: "Warm", hint: "Friendly and reassuring." },
  { id: "curious", label: "Curious", hint: "Intrigued, discovery energy." },
  { id: "enthusiastic", label: "Enthusiastic", hint: "Upbeat and engaged." },
  { id: "calm", label: "Calm", hint: "Soft, unhurried, grounded." },
  { id: "playful", label: "Playful", hint: "Light humor, fun tone." },
  { id: "serious", label: "Serious", hint: "Focused and earnest." },
];

export const PODCAST_MANNERISMS = [
  {
    id: "urban",
    label: "Urban",
    hint: "Uses slang, can curse, teaches like you are clueless.",
  },
  {
    id: "caveman",
    label: "Caveman",
    hint: "Keeps real terms. Explains them like you are 5.",
  },
  {
    id: "like-im-5",
    label: "Teach me like I'm 5",
    hint: "Simple words, vivid analogies.",
  },
  {
    id: "chill",
    label: "Be chill",
    hint: "Casual host energy, relaxed.",
  },
  {
    id: "friend",
    label: "Talk like a friend",
    hint: "Peer-to-peer, conversational.",
  },
  {
    id: "coach",
    label: "Coach",
    hint: "Encouraging, practical, direct.",
  },
  {
    id: "storyteller",
    label: "Storyteller",
    hint: "Narrative flow, scene-setting.",
  },
  {
    id: "professor",
    label: "Clear professor",
    hint: "Structured, precise, patient.",
  },
];

export const PODCAST_VOICES = [
  {
    id: "Vindemiatrix",
    label: "Elara",
    hint: "Gentle, clear female host.",
  },
  {
    id: "Sadachbia",
    label: "Orin",
    hint: "Lively, energetic male host.",
  },
];

export const DEFAULT_PODCAST_EMOTION = "warm";
export const DEFAULT_PODCAST_MANNERISM = "urban";
export const DEFAULT_PODCAST_VOICE = "Vindemiatrix";

const emotionIds = new Set(PODCAST_EMOTIONS.map((e) => e.id));
const mannerismIds = new Set(PODCAST_MANNERISMS.map((m) => m.id));
const voiceIds = new Set(PODCAST_VOICES.map((v) => v.id));

export function normalizePodcastEmotion(value) {
  if (typeof value !== "string") return DEFAULT_PODCAST_EMOTION;
  const id = value.trim().toLowerCase();
  return emotionIds.has(id) ? id : DEFAULT_PODCAST_EMOTION;
}

export function normalizePodcastMannerism(value) {
  if (typeof value !== "string") return DEFAULT_PODCAST_MANNERISM;
  const id = value.trim().toLowerCase();
  return mannerismIds.has(id) ? id : DEFAULT_PODCAST_MANNERISM;
}

export function normalizePodcastVoice(value) {
  if (typeof value !== "string") return DEFAULT_PODCAST_VOICE;
  const trimmed = value.trim();
  if (voiceIds.has(trimmed)) return trimmed;
  const match = PODCAST_VOICES.find(
    (v) => v.id.toLowerCase() === trimmed.toLowerCase()
  );
  return match?.id || DEFAULT_PODCAST_VOICE;
}

export function podcastEmotionLabel(id) {
  return (
    PODCAST_EMOTIONS.find((e) => e.id === id)?.label ||
    PODCAST_EMOTIONS.find((e) => e.id === DEFAULT_PODCAST_EMOTION).label
  );
}

export function podcastMannerismLabel(id) {
  return (
    PODCAST_MANNERISMS.find((m) => m.id === id)?.label ||
    PODCAST_MANNERISMS.find((m) => m.id === DEFAULT_PODCAST_MANNERISM).label
  );
}

export function podcastVoiceLabel(id) {
  const voice = normalizePodcastVoice(id);
  return (
    PODCAST_VOICES.find((v) => v.id === voice)?.label ||
    PODCAST_VOICES.find((v) => v.id === DEFAULT_PODCAST_VOICE).label
  );
}

export function podcastEmotionHint(id) {
  const emotion = normalizePodcastEmotion(id);
  return PODCAST_EMOTIONS.find((e) => e.id === emotion)?.hint || "";
}

export function podcastMannerismHint(id) {
  const mannerism = normalizePodcastMannerism(id);
  return PODCAST_MANNERISMS.find((m) => m.id === mannerism)?.hint || "";
}

export function podcastVoiceHint(id) {
  const voice = normalizePodcastVoice(id);
  return PODCAST_VOICES.find((v) => v.id === voice)?.hint || "";
}
