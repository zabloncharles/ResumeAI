import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export function generateShareCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateSharePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

type ShareStudySetMeta = {
  title: string;
  description: string;
  category: string;
  cardCount: number;
  createdBy: string;
};

export async function markStudySetPublic(setId: string): Promise<void> {
  await updateDoc(doc(db, "studySets", setId), {
    isPublic: true,
    shareCode: deleteField(),
    sharePassword: deleteField(),
  });
}

export async function issuePrivateShareCredentials(
  setId: string,
  meta: ShareStudySetMeta
): Promise<{ shareCode: string; sharePassword: string }> {
  const shareCode = generateShareCode();
  const sharePassword = generateSharePassword();

  await updateDoc(doc(db, "studySets", setId), {
    isPublic: false,
    shareCode,
    sharePassword,
  });

  await setDoc(doc(db, "privateSetShares", shareCode), {
    setId,
    shareCode,
    sharePassword,
    createdBy: meta.createdBy,
    title: meta.title,
    description: meta.description,
    category: meta.category,
    cardCount: meta.cardCount,
    createdAt: serverTimestamp(),
    isActive: true,
  });

  return { shareCode, sharePassword };
}

export async function resolvePrivateShareImport(
  code: string,
  password: string
): Promise<string | null> {
  const normalizedCode = code.trim().toUpperCase();
  const normalizedPassword = password.trim().toUpperCase();
  if (!normalizedCode || !normalizedPassword) return null;

  const shareRef = doc(db, "privateSetShares", normalizedCode);
  const shareSnap = await getDoc(shareRef);
  if (!shareSnap.exists()) return null;

  const share = shareSnap.data();
  if (!share.isActive) return null;
  if (share.sharePassword !== normalizedPassword) return null;

  const setId = typeof share.setId === "string" ? share.setId : "";
  if (!setId) return null;

  const setSnap = await getDoc(doc(db, "studySets", setId));
  if (!setSnap.exists()) return null;
  if (setSnap.data()?.isPublic === true) return null;

  return setId;
}
