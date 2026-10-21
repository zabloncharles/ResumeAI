import type { PodcastEmotion, PodcastMannerism } from "../constants/podcastVoiceOptions";

export type { PodcastEmotion, PodcastMannerism };

export type Podcast = {
  id: string;
  title: string;
  emotion: PodcastEmotion;
  mannerism: PodcastMannerism;
  script: string;
  audioUrl: string;
  audioPath: string;
  sourcePreview: string;
  categoryId: string;
  category: string;
  folderId: string | null;
  createdBy: string;
  createdAt: Date;
};
