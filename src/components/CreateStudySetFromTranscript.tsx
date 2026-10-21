import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../firebase";
import { useStudyFolders } from "../hooks/useStudyFolders";
import StudyShell from "./study/StudyShell";
import NewFolderModal from "./study/NewFolderModal";
import {
  postGenerateStudyCardsFromTranscript,
  type StudyTranscriptDepth,
} from "../utils/aiApi";
import { saveStudySetDraft } from "../utils/studySetDraftStorage";
import { resolveStudyCategoryId } from "../constants/studyCategories";
import { studyFlowAccent } from "../constants/studyFlowAccent";
import { UNCATEGORIZED_FOLDER_ID } from "../types/study";
import {
  chunkTranscript,
  TRANSCRIPT_MAX_CHARS,
} from "../utils/transcriptChunks";
import bunny1 from "../bunny1.png";

const flow = studyFlowAccent("rose");

export default function CreateStudySetFromTranscript() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFolderId = searchParams.get("folder");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const { folders, createFolder } = useStudyFolders(user?.uid);

  const [transcript, setTranscript] = useState("");
  const [depth, setDepth] = useState<StudyTranscriptDepth>("high-level");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [barPercent, setBarPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const transcriptLength = transcript.trim().length;
  const plannedChunks = chunkTranscript(transcript).length;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        navigate("/");
      }
    });
    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    if (!isGenerating) {
      setBarPercent(0);
      return;
    }

    const total = generateProgress?.total || plannedChunks || 1;
    const current = generateProgress?.current || 0;
    const completedFloor = Math.max(0, ((current - 1) / total) * 100);
    const completedCeil = (current / total) * 100;
    const target =
      current > 0
        ? completedFloor + (completedCeil - completedFloor) * 0.55
        : 6;

    setBarPercent((prev) => Math.max(prev, target));

    const timer = window.setInterval(() => {
      setBarPercent((prev) => {
        const cap = current > 0 ? completedCeil - 2 : 18;
        if (prev >= cap) return prev;
        return Math.min(cap, prev + 0.4);
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [isGenerating, generateProgress, plannedChunks]);

  const handleGenerate = async () => {
    if (!user || isGenerating) return;
    setError(null);
    setIsGenerating(true);
    setGenerateProgress(null);
    setBarPercent(4);
    try {
      const token = await user.getIdToken();
      const result = await postGenerateStudyCardsFromTranscript(
        token,
        {
          transcript,
          depth,
        },
        (current, total) => setGenerateProgress({ current, total })
      );

      const flashcards = result.cards.map((card) => ({
        front: card.front,
        back: card.back,
        category: card.category || "",
        difficulty: card.difficulty,
        mastery: 0,
        isPublic: false,
      }));

      const folderId =
        initialFolderId && initialFolderId !== UNCATEGORIZED_FOLDER_ID
          ? initialFolderId
          : null;

      saveStudySetDraft(user.uid, "new", {
        studySet: {
          title: result.title,
          description: result.description,
          categoryId: resolveStudyCategoryId({
            categoryId: result.categoryId,
          }),
          folderId,
          isPublic: false,
          cardCount: flashcards.length,
          flashcards,
        },
        folderId,
        currentCard: {
          front: "",
          back: "",
          category: "",
          difficulty: "medium",
          mastery: 0,
          isPublic: false,
        },
      });

      navigate(folderId ? `/create?folder=${folderId}` : "/create");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate study cards. Try again."
      );
    } finally {
      setIsGenerating(false);
      setGenerateProgress(null);
    }
  };

  if (!authReady || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${flow.spinner}`} />
      </div>
    );
  }

  return (
    <StudyShell
      folders={folders}
      uncategorizedCount={0}
      libraryFilter="all"
      onLibraryFilter={() => navigate("/study/library")}
      onNewFolder={() => setShowNewFolderModal(true)}
      searchQuery=""
      onSearchChange={() => {}}
      onCreateSet={() => navigate("/create")}
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      accent="rose"
      pageHeader={{
        title: "From YouTube transcript",
        description:
          "Paste a transcript, choose depth, then review the generated set before saving.",
        onBack: () => navigate("/study"),
      }}
    >
      <div className="w-full max-w-3xl">
        {isGenerating ? (
          <div className="study-round border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-12 sm:px-10">
            <div className="max-w-md mx-auto flex flex-col items-center space-y-8">
              <img
                src={bunny1}
                alt=""
                className="h-14 w-14 object-contain animate-pulse"
              />
              <div className="w-full">
                <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${flow.progress} transition-all duration-150 ease-out rounded-full`}
                    style={{ width: `${Math.min(99, barPercent)}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  {Math.min(99, Math.round(barPercent))}%
                </p>
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                  Building your study set
                </h2>
                <p className="text-gray-500 dark:text-zinc-400 text-sm">
                  {generateProgress
                    ? `Processing transcript part ${generateProgress.current} of ${generateProgress.total}…`
                    : plannedChunks > 1
                      ? `Preparing ${plannedChunks} parts…`
                      : "Turning your transcript into flashcards…"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <fieldset>
              <legend className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-3">
                Depth
              </legend>
              <div className="grid sm:grid-cols-2 gap-3">
                <label
                  className={`study-round cursor-pointer border px-4 py-4 transition-colors ${
                    depth === "high-level"
                      ? flow.selectedCard
                      : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="depth"
                    value="high-level"
                    checked={depth === "high-level"}
                    onChange={() => setDepth("high-level")}
                    className="sr-only"
                  />
                  <p className="font-semibold text-gray-900 dark:text-zinc-100">
                    High level
                  </p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                    Fewer cards focused on main themes and core ideas.
                  </p>
                </label>
                <label
                  className={`study-round cursor-pointer border px-4 py-4 transition-colors ${
                    depth === "detailed"
                      ? flow.selectedCard
                      : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="depth"
                    value="detailed"
                    checked={depth === "detailed"}
                    onChange={() => setDepth("detailed")}
                    className="sr-only"
                  />
                  <p className="font-semibold text-gray-900 dark:text-zinc-100">
                    Detailed
                  </p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                    More cards covering specific facts and finer points.
                  </p>
                </label>
              </div>
            </fieldset>

            <label className="block">
              <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                Transcript
              </span>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={10}
                placeholder="Paste the YouTube transcript here…"
                className={`study-round mt-2 w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-gray-900 dark:text-zinc-100 font-mono text-sm leading-relaxed outline-none ${flow.focusField}`}
              />
              <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-zinc-500">
                <span>Tip: YouTube → Show transcript → copy the text.</span>
                {transcriptLength > 0 && (
                  <span>
                    {transcriptLength.toLocaleString()} /{" "}
                    {TRANSCRIPT_MAX_CHARS.toLocaleString()} characters
                    {plannedChunks > 1
                      ? ` · will process in ${plannedChunks} parts`
                      : ""}
                  </span>
                )}
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={
                  transcriptLength < 80 ||
                  transcriptLength > TRANSCRIPT_MAX_CHARS
                }
                className="study-btn-rose px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate study set
              </button>
              <button
                type="button"
                onClick={() => navigate("/study")}
                className="px-5 py-3 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        onCreate={async (folderTitle, description) => {
          const id = await createFolder(folderTitle, description);
          if (id) navigate(`/study/folder/${id}`);
        }}
      />
    </StudyShell>
  );
}
