import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  MicrophoneIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { auth, db, storage } from "../firebase";
import { useStudyFolders } from "../hooks/useStudyFolders";
import StudyShell from "./study/StudyShell";
import StudySectionHeader from "./study/StudySectionHeader";
import NewFolderModal from "./study/NewFolderModal";
import { studyFlowAccent } from "../constants/studyFlowAccent";
import {
  getStudyCategoryLabel,
  resolveStudyCategoryId,
  studyCategoryFirestoreFields,
} from "../constants/studyCategories";
import {
  postGeneratePodcastAudio,
  postGeneratePodcastScript,
} from "../utils/aiApi";
import {
  DEFAULT_PODCAST_EMOTION,
  DEFAULT_PODCAST_MANNERISM,
  PODCAST_EMOTIONS,
  PODCAST_MANNERISMS,
  normalizePodcastEmotion,
  normalizePodcastMannerism,
  podcastEmotionLabel,
  podcastMannerismLabel,
  type PodcastEmotion,
  type PodcastMannerism,
} from "../constants/podcastVoiceOptions";
import { PODCAST_SOURCE_MAX_CHARS } from "../utils/podcastScriptChunks";
import type { Podcast } from "../types/podcast";
import { UNCATEGORIZED_FOLDER_ID } from "../types/study";
import bunny1 from "../bunny1.png";
import spaceOrb from "../spaceorb.gif";

const CREATE_FOLDER_SELECT_VALUE = "__create_folder__";
const LAST_LISTEN_KEY = "podcastLastListen";
const flow = studyFlowAccent("violet");
const selectClassName = `study-round w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-gray-900 dark:text-zinc-100 outline-none ${flow.focusField}`;

type LastListen = {
  id: string;
  current: number;
  duration: number;
};

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function readLastListen(): LastListen | null {
  try {
    const raw = localStorage.getItem(LAST_LISTEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastListen;
    if (!parsed?.id || typeof parsed.current !== "number") return null;
    return {
      id: parsed.id,
      current: Math.max(0, parsed.current),
      duration: Math.max(0, Number(parsed.duration) || 0),
    };
  } catch {
    return null;
  }
}

function writeLastListen(next: LastListen) {
  try {
    localStorage.setItem(LAST_LISTEN_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

function mapPodcastDoc(id: string, data: Record<string, unknown>): Podcast {
  const categoryId = resolveStudyCategoryId({
    categoryId:
      typeof data.categoryId === "string" ? data.categoryId : undefined,
    category: typeof data.category === "string" ? data.category : undefined,
  });
  return {
    id,
    title: String(data.title || "Podcast"),
    emotion: normalizePodcastEmotion(data.emotion),
    mannerism: normalizePodcastMannerism(data.mannerism ?? data.manner),
    script: String(data.script || ""),
    audioUrl: String(data.audioUrl || ""),
    audioPath: String(data.audioPath || ""),
    sourcePreview: String(data.sourcePreview || ""),
    categoryId,
    category: getStudyCategoryLabel(categoryId),
    folderId:
      typeof data.folderId === "string" && data.folderId
        ? data.folderId
        : null,
    createdBy: String(data.createdBy || ""),
    createdAt:
      data.createdAt &&
      typeof data.createdAt === "object" &&
      "toDate" in data.createdAt &&
      typeof (data.createdAt as { toDate: () => Date }).toDate === "function"
        ? (data.createdAt as { toDate: () => Date }).toDate()
        : new Date(),
  };
}

export default function PodcastPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFolderParam = searchParams.get("folder");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const { folders, createFolder, touchFolder } = useStudyFolders(user?.uid);

  const [showCreator, setShowCreator] = useState(false);
  const [content, setContent] = useState("");
  const [emotion, setEmotion] = useState<PodcastEmotion>(DEFAULT_PODCAST_EMOTION);
  const [mannerism, setMannerism] = useState<PodcastMannerism>(
    DEFAULT_PODCAST_MANNERISM
  );
  const [folderId, setFolderId] = useState<string | null>(() =>
    initialFolderParam && initialFolderParam !== UNCATEGORIZED_FOLDER_ID
      ? initialFolderParam
      : null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState<"script" | "audio" | "save" | null>(null);
  const [audioProgress, setAudioProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [barPercent, setBarPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playback, setPlayback] = useState({ current: 0, duration: 0 });
  const [lastListen, setLastListen] = useState<LastListen | null>(() =>
    readLastListen()
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldAutoPlayRef = useRef(false);
  const resumeSeekRef = useRef<number | null>(null);
  const lastSaveAtRef = useRef(0);

  const contentLength = content.trim().length;
  const activePodcast = useMemo(
    () => podcasts.find((p) => p.id === activeId) ?? null,
    [podcasts, activeId]
  );

  const continuePodcast = useMemo(() => {
    const withAudio = podcasts.filter((p) => p.audioUrl);
    if (!withAudio.length) return null;
    if (lastListen?.id) {
      const saved = withAudio.find((p) => p.id === lastListen.id);
      if (saved) return saved;
    }
    return withAudio[0];
  }, [podcasts, lastListen]);

  const continueProgress = useMemo(() => {
    if (!continuePodcast) return { current: 0, duration: 0, percent: 0 };
    if (activeId === continuePodcast.id && playback.duration > 0) {
      return {
        current: playback.current,
        duration: playback.duration,
        percent: Math.min(
          100,
          Math.round((playback.current / playback.duration) * 100)
        ),
      };
    }
    if (lastListen?.id === continuePodcast.id && lastListen.duration > 0) {
      return {
        current: lastListen.current,
        duration: lastListen.duration,
        percent: Math.min(
          100,
          Math.round((lastListen.current / lastListen.duration) * 100)
        ),
      };
    }
    return { current: 0, duration: 0, percent: 0 };
  }, [continuePodcast, activeId, playback, lastListen]);

  const continueIsLive =
    Boolean(continuePodcast) &&
    activeId === continuePodcast?.id &&
    isPlaying;

  const folderTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const folder of folders) map.set(folder.id, folder.title);
    return map;
  }, [folders]);

  const filteredPodcasts = useMemo(() => {
    if (!initialFolderParam) return podcasts;
    if (initialFolderParam === UNCATEGORIZED_FOLDER_ID) {
      return podcasts.filter((p) => !p.folderId);
    }
    return podcasts.filter((p) => p.folderId === initialFolderParam);
  }, [podcasts, initialFolderParam]);

  const listFolderLabel = useMemo(() => {
    if (!initialFolderParam) return null;
    if (initialFolderParam === UNCATEGORIZED_FOLDER_ID) return "Uncategorized";
    return folderTitleById.get(initialFolderParam) || "Folder";
  }, [initialFolderParam, folderTitleById]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) navigate("/");
    });
    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    if (
      initialFolderParam &&
      initialFolderParam !== UNCATEGORIZED_FOLDER_ID
    ) {
      setFolderId(initialFolderParam);
    }
  }, [initialFolderParam]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingList(true);
      try {
        const q = query(
          collection(db, "podcasts"),
          where("createdBy", "==", user.uid)
        );
        const snap = await getDocs(q);
        const rows = snap.docs
          .map((d) => mapPodcastDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setPodcasts(rows);
      } catch (err) {
        console.error("Error loading podcasts:", err);
      } finally {
        setLoadingList(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!isGenerating) {
      setBarPercent(0);
      return;
    }

    let target = 8;
    if (phase === "script") target = 28;
    if (phase === "audio" && audioProgress) {
      target = 30 + (audioProgress.current / audioProgress.total) * 55;
    }
    if (phase === "save") target = 92;

    setBarPercent((prev) => Math.max(prev, target));

    const timer = window.setInterval(() => {
      setBarPercent((prev) => {
        const cap =
          phase === "save" ? 96 : phase === "audio" ? target + 4 : target + 8;
        if (prev >= Math.min(98, cap)) return prev;
        return Math.min(98, prev + 0.35);
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [isGenerating, phase, audioProgress]);

  const handleGenerate = async () => {
    if (!user || isGenerating) return;
    setError(null);
    setIsGenerating(true);
    setPhase("script");
    setAudioProgress(null);
    setBarPercent(5);

    const savedFolderId = folderId || null;
    let createdDocId: string | null = null;
    let uploadedAudioPath: string | null = null;

    try {
      const token = await user.getIdToken();
      const {
        title,
        script,
        categoryId: detectedCategoryId,
        emotion: usedEmotion,
        mannerism: usedMannerism,
      } = await postGeneratePodcastScript(token, {
        content,
        emotion,
        mannerism,
      });
      const categoryFields = studyCategoryFirestoreFields(detectedCategoryId);

      setPhase("audio");
      const audioBlob = await postGeneratePodcastAudio(
        token,
        script,
        (current, total) => setAudioProgress({ current, total }),
        { emotion: usedEmotion, mannerism: usedMannerism }
      );

      setPhase("save");
      const podcastRef = await addDoc(collection(db, "podcasts"), {
        title,
        emotion: usedEmotion,
        mannerism: usedMannerism,
        script,
        audioUrl: "",
        audioPath: "",
        sourcePreview: content.trim().slice(0, 240),
        ...categoryFields,
        folderId: savedFolderId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      createdDocId = podcastRef.id;

      const audioPath = `podcasts/${user.uid}/${podcastRef.id}.mp3`;
      const storageRef = ref(storage, audioPath);
      await uploadBytes(storageRef, audioBlob, { contentType: "audio/mpeg" });
      uploadedAudioPath = audioPath;
      const audioUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "podcasts", podcastRef.id), {
        audioUrl,
        audioPath,
      });

      if (savedFolderId) await touchFolder(savedFolderId);

      const created: Podcast = {
        id: podcastRef.id,
        title,
        emotion: usedEmotion,
        mannerism: usedMannerism,
        script,
        audioUrl,
        audioPath,
        sourcePreview: content.trim().slice(0, 240),
        categoryId: categoryFields.categoryId,
        category: categoryFields.category,
        folderId: savedFolderId,
        createdBy: user.uid,
        createdAt: new Date(),
      };
      setPodcasts((prev) => [created, ...prev]);
      setContent("");
      setShowCreator(false);
      shouldAutoPlayRef.current = true;
      setActiveId(created.id);
      setIsPlaying(false);
      setPlayback({ current: 0, duration: 0 });
      setBarPercent(100);
    } catch (err) {
      if (uploadedAudioPath) {
        try {
          await deleteObject(ref(storage, uploadedAudioPath));
        } catch {
          // ignore cleanup failures
        }
      }
      if (createdDocId) {
        try {
          await deleteDoc(doc(db, "podcasts", createdDocId));
        } catch {
          // ignore cleanup failures
        }
      }
      setError(
        err instanceof Error
          ? err.message
          : "Could not create podcast. Try again."
      );
    } finally {
      setIsGenerating(false);
      setPhase(null);
      setAudioProgress(null);
    }
  };

  const handleDelete = async (podcast: Podcast) => {
    if (!user) return;
    if (!window.confirm(`Delete “${podcast.title}”?`)) return;
    setError(null);
    try {
      const audioPath =
        podcast.audioPath || `podcasts/${user.uid}/${podcast.id}.mp3`;
      try {
        await deleteObject(ref(storage, audioPath));
      } catch (storageErr) {
        const code =
          storageErr &&
          typeof storageErr === "object" &&
          "code" in storageErr
            ? String((storageErr as { code?: string }).code)
            : "";
        if (code !== "storage/object-not-found") {
          throw storageErr;
        }
      }

      await deleteDoc(doc(db, "podcasts", podcast.id));
      setPodcasts((prev) => prev.filter((p) => p.id !== podcast.id));
      if (lastListen?.id === podcast.id) {
        setLastListen(null);
        try {
          localStorage.removeItem(LAST_LISTEN_KEY);
        } catch {
          // ignore
        }
      }
      if (activeId === podcast.id) {
        audioRef.current?.pause();
        setActiveId(null);
        setIsPlaying(false);
        setPlayback({ current: 0, duration: 0 });
      }
    } catch (err) {
      console.error("Error deleting podcast:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete podcast. Try again."
      );
    }
  };

  const persistListen = (id: string, current: number, duration: number) => {
    const next = {
      id,
      current: Math.max(0, current),
      duration: Math.max(0, duration),
    };
    setLastListen(next);
    writeLastListen(next);
  };

  const togglePlay = async (podcast: Podcast) => {
    if (!podcast.audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (activeId === podcast.id) {
      if (audio.paused) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    resumeSeekRef.current = null;
    shouldAutoPlayRef.current = true;
    setActiveId(podcast.id);
    setIsPlaying(false);
    setPlayback({ current: 0, duration: 0 });
  };

  const continueListening = async () => {
    if (!continuePodcast?.audioUrl) return;
    const saved =
      lastListen?.id === continuePodcast.id ? lastListen.current : 0;
    const duration =
      lastListen?.id === continuePodcast.id ? lastListen.duration : 0;
    const nearEnd = duration > 0 && saved >= duration - 2;
    const seek = !nearEnd && saved > 1 ? saved : 0;

    resumeSeekRef.current = seek;
    shouldAutoPlayRef.current = true;

    if (activeId === continuePodcast.id && audioRef.current) {
      const audio = audioRef.current;
      audio.currentTime = seek;
      resumeSeekRef.current = null;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    setActiveId(continuePodcast.id);
    setIsPlaying(false);
    setPlayback({ current: seek, duration });
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activePodcast?.audioUrl) return;

    if (audio.src !== activePodcast.audioUrl) {
      audio.src = activePodcast.audioUrl;
      audio.load();
    }

    const seek = resumeSeekRef.current;
    if (seek != null) {
      const applySeek = () => {
        audio.currentTime = seek;
        resumeSeekRef.current = null;
      };
      if (audio.readyState >= 1) applySeek();
      else audio.addEventListener("loadedmetadata", applySeek, { once: true });
    }

    if (!shouldAutoPlayRef.current) return;
    shouldAutoPlayRef.current = false;
    void audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [activePodcast]);

  const statusCopy = useMemo(() => {
    if (phase === "script") return "Writing your teaching script…";
    if (phase === "audio" && audioProgress) {
      return `Generating voice part ${audioProgress.current} of ${audioProgress.total}…`;
    }
    if (phase === "audio") return "Generating voice…";
    if (phase === "save") return "Saving your podcast…";
    return "Building your podcast…";
  }, [phase, audioProgress]);

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
      onCreateSet={() => setShowCreator((open) => !open)}
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      searchPlaceholder="Search podcasts"
      accent="violet"
    >
      <div className="w-full max-w-3xl space-y-10">
        {(showCreator || isGenerating) && (
          <section className="space-y-4">
            <StudySectionHeader
              title="New podcast"
              description="Paste notes or a transcript. We’ll write a teaching episode and generate one voice."
            />
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
                      Creating your podcast
                    </h2>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">
                      {statusCopy}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2">
                    Folder
                  </label>
                  <select
                    value={folderId ?? ""}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next === CREATE_FOLDER_SELECT_VALUE) {
                        setShowNewFolderModal(true);
                        return;
                      }
                      setFolderId(next || null);
                    }}
                    className={selectClassName}
                  >
                    <option value="">Uncategorized</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title}
                      </option>
                    ))}
                    <option value={CREATE_FOLDER_SELECT_VALUE}>
                      + Create new folder…
                    </option>
                  </select>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
                    Subject is detected from your content.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2">
                      Emotion
                    </label>
                    <select
                      value={emotion}
                      onChange={(e) =>
                        setEmotion(normalizePodcastEmotion(e.target.value))
                      }
                      className={selectClassName}
                    >
                      {PODCAST_EMOTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
                      {
                        PODCAST_EMOTIONS.find((o) => o.id === emotion)?.hint
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2">
                      Mannerism
                    </label>
                    <select
                      value={mannerism}
                      onChange={(e) =>
                        setMannerism(normalizePodcastMannerism(e.target.value))
                      }
                      className={selectClassName}
                    >
                      {PODCAST_MANNERISMS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
                      {
                        PODCAST_MANNERISMS.find((o) => o.id === mannerism)
                          ?.hint
                      }
                    </p>
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                    Content to teach
                  </span>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    placeholder="Paste notes, a lesson outline, or a transcript…"
                    className={`study-round mt-2 w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-gray-900 dark:text-zinc-100 font-mono text-sm leading-relaxed outline-none ${flow.focusField}`}
                  />
                  <span className="mt-1.5 block text-xs text-gray-500 dark:text-zinc-500">
                    {contentLength > 0
                      ? `${contentLength.toLocaleString()} / ${PODCAST_SOURCE_MAX_CHARS.toLocaleString()} characters`
                      : "One host voice will teach this material out loud."}
                  </span>
                </label>

                {error && (
                  <p
                    className="text-sm text-red-600 dark:text-red-400"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={
                      contentLength < 80 ||
                      contentLength > PODCAST_SOURCE_MAX_CHARS
                    }
                    className={`study-btn-violet px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2`}
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                    Generate podcast
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreator(false)}
                    className="px-5 py-3 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {error && !showCreator && !isGenerating ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <section className="space-y-3">
          <StudySectionHeader
            title={
              continuePodcast ? "Continue listening" : "Create a podcast"
            }
            description={
              continuePodcast
                ? "Pick up the episode you were listening to most recently."
                : "Turn your notes into a teaching episode you can listen to while you study."
            }
          />
          <button
            type="button"
            onClick={() => {
              if (!continuePodcast) {
                setShowCreator(true);
                return;
              }
              if (activeId === continuePodcast.id && isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
                return;
              }
              void continueListening();
            }}
            className={`study-round group relative w-full overflow-hidden border border-violet-100 bg-violet-50/40 text-left shadow-sm transition-transform duration-300 hover:scale-[1.01] focus:outline-none focus-visible:ring-2 dark:border-zinc-800 dark:bg-[#0a0a0a] ${flow.ring} focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-zinc-950`}
          >
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
            >
              <img
                src={spaceOrb}
                alt=""
                className={`absolute -right-8 top-1/2 h-[140%] w-[55%] -translate-y-1/2 object-cover invert dark:invert-0 motion-reduce:hidden sm:w-[48%] transition-[opacity,transform] duration-500 ${
                  continueIsLive
                    ? "opacity-90 scale-110"
                    : "opacity-55 scale-100"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-50 from-[35%] via-violet-50/92 via-[58%] to-violet-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/92 dark:to-[#0a0a0a]/25" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,_rgba(139,92,246,0.18),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_20%_80%,_rgba(139,92,246,0.22),_transparent_50%)]" />
            </div>

            <div className="relative z-10 flex items-center gap-4 p-5 sm:gap-6 sm:p-7">
              <span
                className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border transition-colors sm:h-[4.5rem] sm:w-[4.5rem] ${
                  continueIsLive
                    ? flow.playActive
                    : "border-violet-200 bg-white text-violet-700 group-hover:border-violet-400 group-hover:bg-violet-100/80 dark:border-white/15 dark:bg-white/10 dark:text-white dark:group-hover:border-violet-400/60 dark:group-hover:bg-violet-500/15"
                }`}
              >
                {continuePodcast ? (
                  continueIsLive ? (
                    <PauseIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                  ) : (
                    <PlayIcon className="h-7 w-7 translate-x-0.5 sm:h-8 sm:w-8" />
                  )
                ) : (
                  <MicrophoneIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                )}
                <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-violet-200/80 dark:ring-white/10" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-medium uppercase tracking-[0.14em] ${flow.text}`}
                    >
                      {continuePodcast
                        ? continueIsLive
                          ? "Now playing"
                          : continueProgress.percent > 0 &&
                              continueProgress.percent < 98
                            ? "Resume"
                            : "Up next"
                        : "Get started"}
                    </p>
                    <h3 className="mt-1.5 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl line-clamp-2 sm:truncate">
                      {continuePodcast
                        ? continuePodcast.title
                        : "Create a podcast to help you study"}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 sm:truncate">
                      {continuePodcast
                        ? `${continuePodcast.category} · ${podcastEmotionLabel(continuePodcast.emotion)} · ${podcastMannerismLabel(continuePodcast.mannerism)}`
                        : "Paste notes, pick emotion and mannerism, and we’ll teach it out loud."}
                    </p>
                  </div>
                  {continuePodcast ? (
                    <div
                      className={`podcast-eq hidden sm:flex ${
                        continueIsLive ? "is-live" : ""
                      }`}
                      aria-hidden
                    >
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}
                </div>

                <div className="mt-5">
                  {continuePodcast ? (
                    <>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-200/70 dark:bg-white/10">
                        <div
                          className={`h-full rounded-full ${flow.progress} transition-[width] duration-300 ease-out`}
                          style={{
                            width: `${Math.max(
                              continueProgress.percent > 0
                                ? continueProgress.percent
                                : 2,
                              2
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
                        <span>
                          {continueProgress.duration > 0
                            ? formatAudioTime(continueProgress.current)
                            : "0:00"}
                        </span>
                        <span>
                          {continueProgress.percent > 0 &&
                          continueProgress.percent < 98
                            ? "Resume episode"
                            : "Start episode"}
                        </span>
                        <span>
                          {continueProgress.duration > 0
                            ? formatAudioTime(continueProgress.duration)
                            : "--:--"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-200/70 dark:bg-white/10">
                        <div className={`h-full w-[18%] rounded-full ${flow.progress} opacity-70`} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>Ready when you are</span>
                        <span className={`font-medium ${flow.text}`}>
                          Tap to create
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </button>
        </section>

        <section className="space-y-3">
          <StudySectionHeader
            title="Your podcasts"
            description={
              listFolderLabel
                ? `Episodes in ${listFolderLabel}. Use + next to your name to create one.`
                : "Episodes you’ve generated—use + next to your name to create one."
            }
          />
          <audio
            ref={audioRef}
            className="hidden"
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              const duration = Number.isFinite(el.duration) ? el.duration : 0;
              const current = el.currentTime;
              setPlayback({ current, duration });
              if (!activeId || el.paused) return;
              const now = Date.now();
              if (now - lastSaveAtRef.current < 1500) return;
              lastSaveAtRef.current = now;
              persistListen(activeId, current, duration);
            }}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              setPlayback((prev) => ({
                current: prev.current,
                duration: Number.isFinite(el.duration) ? el.duration : 0,
              }));
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => {
              setIsPlaying(false);
              if (activeId && audioRef.current) {
                persistListen(
                  activeId,
                  audioRef.current.currentTime,
                  Number.isFinite(audioRef.current.duration)
                    ? audioRef.current.duration
                    : 0
                );
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              setPlayback((prev) => ({ ...prev, current: 0 }));
              if (activeId) {
                persistListen(activeId, 0, playback.duration);
              }
            }}
          />
          {loadingList ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : filteredPodcasts.length === 0 ? (
            <div className="study-round border border-dashed border-gray-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 px-6 py-10 text-center">
              <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-900/50">
                <MicrophoneIcon className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                {listFolderLabel
                  ? `No podcasts in ${listFolderLabel}`
                  : "No podcasts yet"}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Tap + next to your name to create one. Subject is set from your notes.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredPodcasts.map((podcast) => {
                const folderLabel = podcast.folderId
                  ? folderTitleById.get(podcast.folderId) || "Folder"
                  : "Uncategorized";
                const isActive = activeId === podcast.id;
                const rowPlaying = isActive && isPlaying;

                return (
                  <li
                    key={podcast.id}
                    className={`study-round border shadow-sm transition-colors ${
                      isActive
                        ? "border-violet-300 bg-violet-50/70 dark:bg-violet-950/30 dark:border-violet-700/50"
                        : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-gray-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
                      <button
                        type="button"
                        onClick={() => void togglePlay(podcast)}
                        disabled={!podcast.audioUrl}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          rowPlaying
                            ? "bg-violet-600 border-violet-600 text-white"
                            : "bg-violet-50 dark:bg-violet-950/40 border-violet-100/80 dark:border-violet-900/50 text-violet-700 dark:text-violet-300"
                        }`}
                        aria-label={
                          rowPlaying
                            ? `Pause ${podcast.title}`
                            : `Play ${podcast.title}`
                        }
                      >
                        {rowPlaying ? (
                          <PauseIcon className="h-5 w-5" />
                        ) : (
                          <PlayIcon className="h-5 w-5 translate-x-px" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void togglePlay(podcast)}
                        disabled={!podcast.audioUrl}
                        className="min-w-0 flex-1 text-left disabled:opacity-60"
                      >
                        <p className="text-xs font-medium text-violet-600 dark:text-violet-400 truncate">
                          {podcast.category}
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate mt-0.5">
                          {podcast.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5 truncate">
                          {folderLabel} ·{" "}
                          {podcastEmotionLabel(podcast.emotion)} ·{" "}
                          {podcastMannerismLabel(podcast.mannerism)} ·{" "}
                          {podcast.createdAt.toLocaleDateString()}
                          {!podcast.audioUrl ? " · Audio unavailable" : ""}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(podcast)}
                        className="p-2 text-zinc-400 hover:text-red-600 shrink-0"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        onCreate={async (folderTitle, description) => {
          const id = await createFolder(folderTitle, description);
          if (id) setFolderId(id);
        }}
      />
    </StudyShell>
  );
}
