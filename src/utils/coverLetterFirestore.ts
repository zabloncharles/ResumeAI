import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import type { CoverLetter } from "../types/coverLetter";
import { recordAnalyticsEvent } from "./analyticsEvents";

function coverLettersCol(userId: string) {
  return collection(db, "users", userId, "coverLetters");
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function mapCoverLetter(id: string, data: DocumentData): CoverLetter {
  return {
    id,
    company: String(data.company || "").trim(),
    jobTitle: String(data.jobTitle || "").trim(),
    hiringManager: String(data.hiringManager || "").trim(),
    content: String(data.content || ""),
    resumeId: String(data.resumeId || ""),
    resumeTitle: String(data.resumeTitle || "Resume"),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt ?? data.createdAt),
  };
}

export async function listUserCoverLetters(
  userId: string
): Promise<CoverLetter[]> {
  const q = query(coverLettersCol(userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCoverLetter(d.id, d.data()));
}

export async function createUserCoverLetter(
  userId: string,
  input: {
    company: string;
    jobTitle: string;
    hiringManager?: string;
    content: string;
    resumeId: string;
    resumeTitle: string;
  }
): Promise<CoverLetter> {
  const now = new Date();
  const ref = await addDoc(coverLettersCol(userId), {
    company: input.company.trim(),
    jobTitle: input.jobTitle.trim(),
    hiringManager: (input.hiringManager || "").trim(),
    content: input.content,
    resumeId: input.resumeId,
    resumeTitle: input.resumeTitle.trim() || "Resume",
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  void recordAnalyticsEvent("coverLetterCreated");

  return {
    id: ref.id,
    company: input.company.trim(),
    jobTitle: input.jobTitle.trim(),
    hiringManager: (input.hiringManager || "").trim(),
    content: input.content,
    resumeId: input.resumeId,
    resumeTitle: input.resumeTitle.trim() || "Resume",
    createdAt: now,
    updatedAt: now,
  };
}

export async function deleteUserCoverLetter(
  userId: string,
  coverLetterId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "coverLetters", coverLetterId));
}

export function coverLetterTitle(letter: CoverLetter): string {
  if (letter.jobTitle && letter.company) {
    return `${letter.jobTitle} at ${letter.company}`;
  }
  return letter.jobTitle || letter.company || "Cover letter";
}
