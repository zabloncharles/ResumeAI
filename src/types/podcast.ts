import type {
  PodcastEmotion,
  PodcastMannerism,
  PodcastVoiceId,
} from "../constants/podcastVoiceOptions";

export type { PodcastEmotion, PodcastMannerism, PodcastVoiceId };

export type Podcast = {
  id: string;
  title: string;
  emotion: PodcastEmotion;
  mannerism: PodcastMannerism;
  voice: PodcastVoiceId;
  script: string;
  audioUrl: string;
  audioPath: string;
  durationSeconds: number;
  studySetId: string | null;
  sourcePreview: string;
  categoryId: string;
  category: string;
  folderId: string | null;
  createdBy: string;
  createdAt: Date;
};
