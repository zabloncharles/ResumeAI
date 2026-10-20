import { useCallback, useEffect, useState } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import ResumeBuilder from "../ResumeBuilder";
import ResumeShell from "./ResumeShell";
import ResumeHomeView from "./ResumeHomeView";
import DeleteResumeConfirmModal from "./DeleteResumeConfirmModal";
import {
  createUserResume,
  deleteUserResume,
  listUserResumes,
} from "../../utils/resumeFirestore";
import type { ResumeListItem } from "../../types/resumeWorkspace";
import { useNavigate } from "react-router-dom";

export default function ResumeHomeRoute() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resumePendingDelete, setResumePendingDelete] =
    useState<ResumeListItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const loadList = useCallback(async () => {
    const uid = auth.currentUser?.uid ?? user?.uid;
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const items = await listUserResumes(uid);
      setResumes(items);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not load your resumes.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!authReady || !user) return;
    void loadList();
  }, [authReady, user, loadList]);

  const requestDelete = (item: ResumeListItem) => {
    setResumePendingDelete(item);
  };

  const cancelDelete = () => {
    if (deletingId) return;
    setResumePendingDelete(null);
  };

  const confirmDelete = async () => {
    const item = resumePendingDelete;
    const uid = auth.currentUser?.uid ?? user?.uid;
    if (!item || !uid) return;

    setDeletingId(item.id);
    setError(null);
    try {
      await deleteUserResume(uid, item.id);
      setResumes((prev) => prev.filter((r) => r.id !== item.id));
      setResumePendingDelete(null);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not delete this resume.";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async () => {
    const uid = auth.currentUser?.uid ?? user?.uid;
    if (!uid) return;
    setCreating(true);
    setError(null);
    try {
      const id = createUserResume(uid);
      navigate(`/resume/edit/${id}`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not create a resume.";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <ResumeBuilder guestOnly />;
  }

  return (
    <ResumeShell
      activeTab="home"
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      mode="home"
      onCreateResume={handleCreate}
      creating={creating}
    >
      <ResumeHomeView
        resumes={resumes}
        loading={loading}
        error={error}
        creating={creating}
        onCreate={handleCreate}
        onDelete={requestDelete}
        deletingId={deletingId}
        onRefresh={() => void loadList()}
      />
      <DeleteResumeConfirmModal
        isOpen={resumePendingDelete !== null}
        resumeTitle={resumePendingDelete?.title ?? ""}
        confirming={deletingId !== null}
        onClose={cancelDelete}
        onConfirm={() => void confirmDelete()}
      />
    </ResumeShell>
  );
}
