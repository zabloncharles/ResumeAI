import Cookies from "js-cookie";

const DRAFT_PREFIX = "resumeai_study_set_draft";
const LEGACY_COOKIE_KEY = "study_set_draft";

export type StudySetDraftFlashcard = {
  id?: string;
  front: string;
  back: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  mastery: number;
  createdBy?: string;
  isPublic: boolean;
  createdAt?: Date;
  lastReviewed?: Date;
};

export type StudySetDraftStudySet = {
  id?: string;
  title: string;
  description: string;
  categoryId?: string;
  category?: string;
  folderId?: string | null;
  isPublic: boolean;
  shareCode?: string;
  sharePassword?: string;
  createdBy?: string;
  createdAt?: Date;
  lastStudied?: Date;
  cardCount: number;
  flashcards: StudySetDraftFlashcard[];
};

export type StudySetDraftSnapshot = {
  studySet: StudySetDraftStudySet;
  folderId: string | null;
  currentCard: StudySetDraftFlashcard;
  savedAt: number;
};

function draftKey(userId: string, scope: "new" | string): string {
  return `${DRAFT_PREFIX}_${userId}_${scope}`;
}

export function saveStudySetDraft(
  userId: string,
  scope: "new" | string,
  snapshot: Omit<StudySetDraftSnapshot, "savedAt">
): void {
  try {
    const payload: StudySetDraftSnapshot = {
      ...snapshot,
      savedAt: Date.now(),
    };
    localStorage.setItem(draftKey(userId, scope), JSON.stringify(payload));
  } catch (error) {
    console.error("Error saving study set draft:", error);
  }
}

export function loadStudySetDraft(
  userId: string,
  scope: "new" | string
): StudySetDraftSnapshot | null {
  try {
    const raw = localStorage.getItem(draftKey(userId, scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudySetDraftSnapshot;
    if (!parsed?.studySet) return null;
    return parsed;
  } catch (error) {
    console.error("Error loading study set draft:", error);
    return null;
  }
}

export function clearStudySetDraft(userId: string, scope: "new" | string): void {
  try {
    localStorage.removeItem(draftKey(userId, scope));
  } catch (error) {
    console.error("Error clearing study set draft:", error);
  }
}

export function migrateLegacyCookieDraftToLocalStorage(
  userId: string
): StudySetDraftSnapshot | null {
  try {
    const existing = loadStudySetDraft(userId, "new");
    if (existing) return existing;

    const saved = Cookies.get(LEGACY_COOKIE_KEY);
    if (!saved) return null;

    const studySet = JSON.parse(saved) as StudySetDraftStudySet;
    Cookies.remove(LEGACY_COOKIE_KEY);

    const snapshot: StudySetDraftSnapshot = {
      studySet,
      folderId: studySet.folderId ?? null,
      currentCard: {
        front: "",
        back: "",
        category: "",
        difficulty: "medium",
        mastery: 0,
        isPublic: false,
      },
      savedAt: Date.now(),
    };
    saveStudySetDraft(userId, "new", snapshot);
    return snapshot;
  } catch (error) {
    console.error("Error migrating legacy study set cookie:", error);
    Cookies.remove(LEGACY_COOKIE_KEY);
    return null;
  }
}
