export type PodcastEmotion =
  | "neutral"
  | "warm"
  | "curious"
  | "enthusiastic"
  | "calm"
  | "playful"
  | "serious";

export type PodcastMannerism =
  | "like-im-5"
  | "chill"
  | "friend"
  | "coach"
  | "storyteller"
  | "professor"
  | "urban"
  | "caveman";

export type PodcastVoiceId = "Vindemiatrix" | "Sadachbia";

export type PodcastVoiceOption<T extends string> = {
  id: T;
  label: string;
  hint: string;
};

export const PODCAST_EMOTIONS: PodcastVoiceOption<PodcastEmotion>[] = [
  { id: "neutral", label: "Neutral", hint: "Even, steady delivery." },
  { id: "warm", label: "Warm", hint: "Friendly and reassuring." },
  { id: "curious", label: "Curious", hint: "Intrigued, discovery energy." },
  {
    id: "enthusiastic",
    label: "Enthusiastic",
    hint: "Upbeat and engaged.",
  },
  { id: "calm", label: "Calm", hint: "Soft, unhurried, grounded." },
  { id: "playful", label: "Playful", hint: "Light humor, fun tone." },
  { id: "serious", label: "Serious", hint: "Focused and earnest." },
];

export const PODCAST_MANNERISMS: PodcastVoiceOption<PodcastMannerism>[] = [
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

export const PODCAST_VOICES: PodcastVoiceOption<PodcastVoiceId>[] = [
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

const PODCAST_VOICE_AVATARS: Record<PodcastVoiceId, string> = {
  Vindemiatrix: "/images/Elara.png",
  Sadachbia: "/images/Orin.png",
};

export const DEFAULT_PODCAST_EMOTION: PodcastEmotion = "warm";
export const DEFAULT_PODCAST_MANNERISM: PodcastMannerism = "urban";
export const DEFAULT_PODCAST_VOICE: PodcastVoiceId = "Vindemiatrix";

const emotionIds = new Set(PODCAST_EMOTIONS.map((e) => e.id));
const mannerismIds = new Set(PODCAST_MANNERISMS.map((m) => m.id));
const voiceIds = new Set(PODCAST_VOICES.map((v) => v.id));

export function normalizePodcastEmotion(value: unknown): PodcastEmotion {
  if (typeof value !== "string") return DEFAULT_PODCAST_EMOTION;
  const id = value.trim().toLowerCase();
  return emotionIds.has(id as PodcastEmotion)
    ? (id as PodcastEmotion)
    : DEFAULT_PODCAST_EMOTION;
}

export function normalizePodcastMannerism(value: unknown): PodcastMannerism {
  if (typeof value !== "string") return DEFAULT_PODCAST_MANNERISM;
  const id = value.trim().toLowerCase();
  return mannerismIds.has(id as PodcastMannerism)
    ? (id as PodcastMannerism)
    : DEFAULT_PODCAST_MANNERISM;
}

export function normalizePodcastVoice(value: unknown): PodcastVoiceId {
  if (typeof value !== "string") return DEFAULT_PODCAST_VOICE;
  const trimmed = value.trim();
  if (voiceIds.has(trimmed as PodcastVoiceId)) {
    return trimmed as PodcastVoiceId;
  }
  const match = PODCAST_VOICES.find(
    (v) => v.id.toLowerCase() === trimmed.toLowerCase()
  );
  return match?.id ?? DEFAULT_PODCAST_VOICE;
}

export function podcastEmotionLabel(id: string): string {
  const emotion = normalizePodcastEmotion(id);
  return PODCAST_EMOTIONS.find((e) => e.id === emotion)?.label ?? "Warm";
}

export function podcastMannerismLabel(id: string): string {
  const mannerism = normalizePodcastMannerism(id);
  return PODCAST_MANNERISMS.find((m) => m.id === mannerism)?.label ?? "Urban";
}

export function podcastVoiceLabel(id: string): string {
  const voice = normalizePodcastVoice(id);
  return PODCAST_VOICES.find((v) => v.id === voice)?.label ?? "Elara";
}

export function podcastVoiceAvatar(id: string): string {
  return PODCAST_VOICE_AVATARS[normalizePodcastVoice(id)];
}

export function podcastEmotionHint(id: string): string {
  const emotion = normalizePodcastEmotion(id);
  return PODCAST_EMOTIONS.find((e) => e.id === emotion)?.hint ?? "";
}

export function podcastMannerismHint(id: string): string {
  const mannerism = normalizePodcastMannerism(id);
  return PODCAST_MANNERISMS.find((m) => m.id === mannerism)?.hint ?? "";
}

export function podcastVoiceHint(id: string): string {
  const voice = normalizePodcastVoice(id);
  return PODCAST_VOICES.find((v) => v.id === voice)?.hint ?? "";
}
