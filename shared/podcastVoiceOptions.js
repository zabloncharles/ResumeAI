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

export const DEFAULT_PODCAST_EMOTION = "warm";
export const DEFAULT_PODCAST_MANNERISM = "chill";

const emotionIds = new Set(PODCAST_EMOTIONS.map((e) => e.id));
const mannerismIds = new Set(PODCAST_MANNERISMS.map((m) => m.id));

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

export function podcastEmotionHint(id) {
  const emotion = normalizePodcastEmotion(id);
  return PODCAST_EMOTIONS.find((e) => e.id === emotion)?.hint || "";
}

export function podcastMannerismHint(id) {
  const mannerism = normalizePodcastMannerism(id);
  return PODCAST_MANNERISMS.find((m) => m.id === mannerism)?.hint || "";
}
