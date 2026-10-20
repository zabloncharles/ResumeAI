import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ResumeData } from "../types/ResumeData";
import type { ResumeDocument, ResumeListItem } from "../types/resumeWorkspace";
import { initialResumeData } from "../constants/resumeDefaults";
import {
  normalizeTemplateId,
  type ResumeTemplateId,
} from "../constants/resumeTemplates";
export { normalizeTemplateId } from "../constants/resumeTemplates";

const NEW_DRAFT_TEMPLATE: ResumeTemplateId = "harvard-mcs";

export function resumeEditorFingerprint(
  resumeData: ResumeData,
  selectedTemplate: string
): string {
  return JSON.stringify({
    resume: resumeData,
    selectedTemplate: normalizeTemplateId(selectedTemplate),
  });
}

export function isPristineNewResumeDraft(
  resumeData: ResumeData,
  selectedTemplate: string
): boolean {
  return (
    resumeEditorFingerprint(resumeData, selectedTemplate) ===
    resumeEditorFingerprint(initialResumeData, NEW_DRAFT_TEMPLATE)
  );
}

const LEGACY_RESUME_ID = "primary";

export function resumeDocRef(userId: string, resumeId: string) {
  return doc(db, "users", userId, "resumes", resumeId);
}

export function resumeLocalStorageKey(resumeId: string) {
  return `resume_${resumeId}`;
}

export function resumeLocalEditAtKey(resumeId: string) {
  return `resume_edit_at_${resumeId}`;
}

export function resumeTitleFromData(data: ResumeDocument): string {
  const explicit = data.title?.trim();
  if (explicit) return explicit;
  const name = data.personalInfo?.fullName?.trim();
  if (name) return name;
  return "Untitled resume";
}

export function stripResumeDocument(raw: Record<string, unknown>): {
  resume: ResumeData;
  selectedTemplate?: string;
  lastUpdated?: string;
  title?: string;
} {
  const {
    lastUpdated,
    userId: _userId,
    updatedBy: _updatedBy,
    selectedTemplate,
    title,
    ...rest
  } = raw as unknown as ResumeDocument;
  return {
    resume: rest as ResumeData,
    selectedTemplate:
      typeof selectedTemplate === "string" ? selectedTemplate : undefined,
    lastUpdated:
      typeof lastUpdated === "string" ? lastUpdated : undefined,
    title: typeof title === "string" ? title : undefined,
  };
}

async function migrateLegacyResume(userId: string): Promise<boolean> {
  const legacyRef = doc(db, "resumes", userId);
  const legacySnap = await getDoc(legacyRef);
  if (!legacySnap.exists()) return false;

  const targetRef = resumeDocRef(userId, LEGACY_RESUME_ID);
  const existing = await getDoc(targetRef);
  if (existing.exists()) return false;

  const data = legacySnap.data() as Record<string, unknown>;
  await setDoc(targetRef, {
    ...data,
    userId,
    updatedBy: userId,
    lastUpdated:
      typeof data.lastUpdated === "string"
        ? data.lastUpdated
        : new Date().toISOString(),
  });
  return true;
}

export async function listUserResumes(userId: string): Promise<ResumeListItem[]> {
  await migrateLegacyResume(userId);

  const col = collection(db, "users", userId, "resumes");
  const q = query(col, orderBy("lastUpdated", "desc"), limit(50));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as ResumeDocument;
    const title = resumeTitleFromData(data);
    const subtitle =
      data.personalInfo?.title?.trim() || "No role title yet";
    return {
      id: d.id,
      title,
      subtitle,
      lastUpdated: data.lastUpdated,
      selectedTemplate: data.selectedTemplate,
    };
  });
}

export function createUserResume(userId: string): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const payload: ResumeDocument = {
    ...initialResumeData,
    title: "Untitled resume",
    selectedTemplate: NEW_DRAFT_TEMPLATE,
    lastUpdated: now,
    userId,
    updatedBy: userId,
  };
  localStorage.setItem(resumeLocalStorageKey(id), JSON.stringify(payload));
  localStorage.removeItem(resumeLocalEditAtKey(id));
  return id;
}

export async function deleteUserResume(
  userId: string,
  resumeId: string
): Promise<void> {
  await deleteDoc(resumeDocRef(userId, resumeId));
  localStorage.removeItem(resumeLocalStorageKey(resumeId));
  localStorage.removeItem(resumeLocalEditAtKey(resumeId));
}

export async function fetchUserResume(
  userId: string,
  resumeId: string
): Promise<ResumeDocument | null> {
  await migrateLegacyResume(userId);
  const snap = await getDoc(resumeDocRef(userId, resumeId));
  if (!snap.exists()) return null;
  return snap.data() as ResumeDocument;
}

export function buildCloudPayload(
  userId: string,
  resumeData: ResumeData,
  selectedTemplate: string
): ResumeDocument {
  return {
    ...resumeData,
    title: resumeTitleFromData({ ...resumeData }),
    selectedTemplate,
    lastUpdated: new Date().toISOString(),
    userId,
    updatedBy: userId,
  };
}

