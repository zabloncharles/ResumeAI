export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  lastReviewed?: Date;
  mastery: number; // 0-100
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface StudySession {
  id: string;
  studySetId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  cardsReviewed: number;
  correctAnswers: number;
  xpEarned: number;
}

export interface StudyFolder {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
}

export const UNCATEGORIZED_FOLDER_ID = "__uncategorized__";

export interface StudySet {
  id: string;
  title: string;
  description: string;
  categoryId?: string;
  category: string;
  folderId?: string | null;
  cardCount: number;
  flashcards: Flashcard[];
  createdAt: Date;
  lastStudied?: Date;
  createdBy: string;
  isPublic: boolean;
  shareCode?: string;
  sharePassword?: string;
  publicCode?: string;
  publicPassword?: string;
  borrowedFrom?: string; // UID of original creator
  isBorrowed?: boolean; // True if borrowed from another user
  originalSetId?: string; // Reference to original set
  progress?: "not_started" | "started" | "completed";
  totalStudyTime: number; // in seconds
  totalSessions: number;
  totalCards: number;
  masteredCards: number;
  averageScore: number; // percentage
}

export interface UserStats {
  totalStudyTime: number; // in seconds
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: Date;
  bestContinuousStudySeconds: number;
  totalXP: number;
  level: number;
  studyHistory: StudySession[];
}

export interface StudyProgress {
  studySetId: string;
  currentCardIndex: number;
  correctAnswers: number;
  totalAnswers: number;
  startTime: Date;
  lastActivity: Date;
  mode: "flashcards" | "quiz";
}
