import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

async function deleteStudySetsForUser(uid: string): Promise<void> {
  const setsSnap = await getDocs(
    query(collection(db, "studySets"), where("createdBy", "==", uid))
  );

  for (const setDoc of setsSnap.docs) {
    const cardsSnap = await getDocs(
      collection(db, "studySets", setDoc.id, "flashcards")
    );
    await Promise.all(cardsSnap.docs.map((card) => deleteDoc(card.ref)));
    await deleteDoc(setDoc.ref);
  }
}

async function deleteStudyFoldersForUser(uid: string): Promise<void> {
  const foldersSnap = await getDocs(
    query(collection(db, "studyFolders"), where("createdBy", "==", uid))
  );
  await Promise.all(foldersSnap.docs.map((folder) => deleteDoc(folder.ref)));
}

async function deleteResumesForUser(uid: string): Promise<void> {
  const resumesSnap = await getDocs(collection(db, "users", uid, "resumes"));
  await Promise.all(resumesSnap.docs.map((resume) => deleteDoc(resume.ref)));

  try {
    await deleteDoc(doc(db, "resumes", uid));
  } catch {
    // legacy doc may not exist
  }
}

async function deletePrivateSharesForUser(uid: string): Promise<void> {
  const sharesSnap = await getDocs(
    query(collection(db, "privateSetShares"), where("createdBy", "==", uid))
  );
  await Promise.all(sharesSnap.docs.map((share) => deleteDoc(share.ref)));
}

export async function deleteAllUserFirestoreData(uid: string): Promise<void> {
  await deleteStudySetsForUser(uid);
  await deleteStudyFoldersForUser(uid);
  await deleteResumesForUser(uid);
  await deletePrivateSharesForUser(uid);
  await deleteDoc(doc(db, "users", uid));
}
