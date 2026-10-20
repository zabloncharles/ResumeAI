import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { StudyFolder } from "../types/study";

export function useStudyFolders(userId: string | undefined) {
  const [folders, setFolders] = useState<StudyFolder[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFolders = useCallback(async () => {
    if (!userId) {
      setFolders([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "studyFolders"),
        where("createdBy", "==", userId)
      );
      const snapshot = await getDocs(q);
      const loaded: StudyFolder[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          description: data.description,
          createdBy: data.createdBy,
          color: data.color,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        };
      });
      loaded.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
      setFolders(loaded);
    } catch (error) {
      console.error("Error loading study folders:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const createFolder = async (title: string, description?: string) => {
    if (!userId || !title.trim()) return null;
    const docRef = await addDoc(collection(db, "studyFolders"), {
      title: title.trim(),
      description: description?.trim() || "",
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await loadFolders();
    return docRef.id;
  };

  const renameFolder = async (folderId: string, title: string) => {
    await updateDoc(doc(db, "studyFolders", folderId), {
      title: title.trim(),
      updatedAt: serverTimestamp(),
    });
    await loadFolders();
  };

  const deleteFolder = async (folderId: string) => {
    await deleteDoc(doc(db, "studyFolders", folderId));
    await loadFolders();
  };

  const touchFolder = async (folderId: string | null | undefined) => {
    if (!folderId) return;
    try {
      await updateDoc(doc(db, "studyFolders", folderId), {
        updatedAt: serverTimestamp(),
      });
    } catch {
      // folder may have been deleted
    }
  };

  return {
    folders,
    loading,
    loadFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    touchFolder,
  };
}
