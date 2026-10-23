import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import type {
  PodcastEmotion,
  PodcastMannerism,
  PodcastVoiceId,
} from "../constants/podcastVoiceOptions";

export type PodcastJobPhase =
  | "queued"
  | "script"
  | "audio_cards"
  | "save"
  | "done"
  | "error";

export type PodcastJobStatus = "queued" | "running" | "done" | "error";

export type PodcastCreateJob = {
  id: string;
  status: PodcastJobStatus;
  phase: PodcastJobPhase;
  progress: number;
  title: string;
  error: string | null;
  podcastId: string | null;
  studySetId: string | null;
  audioCurrent: number;
  audioTotal: number;
  cardsCurrent: number;
  cardsTotal: number;
  createdBy: string;
};

function createPodcastEpisodeUrl(): string {
  const base = import.meta.env.VITE_AI_FUNCTIONS_BASE?.replace(/\/$/, "");
  if (base) return `${base}/createPodcastEpisode-background`;
  return "/.netlify/functions/createPodcastEpisode-background";
}

function mapJob(
  id: string,
  data: Record<string, unknown>
): PodcastCreateJob {
  return {
    id,
    status: (data.status as PodcastJobStatus) || "queued",
    phase: (data.phase as PodcastJobPhase) || "queued",
    progress: Math.max(0, Number(data.progress) || 0),
    title: String(data.title || ""),
    error: typeof data.error === "string" ? data.error : null,
    podcastId: typeof data.podcastId === "string" ? data.podcastId : null,
    studySetId: typeof data.studySetId === "string" ? data.studySetId : null,
    audioCurrent: Math.max(0, Number(data.audioCurrent) || 0),
    audioTotal: Math.max(0, Number(data.audioTotal) || 0),
    cardsCurrent: Math.max(0, Number(data.cardsCurrent) || 0),
    cardsTotal: Math.max(0, Number(data.cardsTotal) || 0),
    createdBy: String(data.createdBy || ""),
  };
}

export function podcastJobStatusCopy(job: PodcastCreateJob): string {
  if (job.status === "error") {
    return job.error || "Something went wrong creating your podcast.";
  }
  if (job.phase === "script") return "Writing your episode script…";
  if (job.phase === "audio_cards") {
    if (job.audioTotal > 0) {
      return `Generating voice and flashcards (${job.audioCurrent}/${job.audioTotal})…`;
    }
    return "Generating voice and flashcards…";
  }
  if (job.phase === "save") return "Saving episode and flashcards…";
  if (job.phase === "done") return "Podcast ready.";
  return "Starting podcast creation…";
}

export async function startPodcastCreateJob(input: {
  content: string;
  emotion: PodcastEmotion;
  mannerism: PodcastMannerism;
  voice: PodcastVoiceId;
  folderId: string | null;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to create a podcast.");

  const jobRef = await addDoc(collection(db, "podcastJobs"), {
    createdBy: user.uid,
    content: input.content.trim(),
    emotion: input.emotion,
    mannerism: input.mannerism,
    voice: input.voice,
    folderId: input.folderId,
    status: "queued",
    phase: "queued",
    progress: 2,
    title: "",
    error: null,
    podcastId: null,
    studySetId: null,
    audioCurrent: 0,
    audioTotal: 0,
    cardsCurrent: 0,
    cardsTotal: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const token = await user.getIdToken();
  const response = await fetch(createPodcastEpisodeUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jobId: jobRef.id }),
    keepalive: true,
  });

  if (!response.ok && response.status !== 202) {
    const raw = await response.text();
    let message = `Could not start podcast job (${response.status}).`;
    try {
      const data = raw ? JSON.parse(raw) : {};
      if (data.error) message = String(data.error);
    } catch {
      // keep default
    }
    await updateDoc(doc(db, "podcastJobs", jobRef.id), {
      status: "error",
      phase: "error",
      error: message,
    });
    throw new Error(message);
  }

  return jobRef.id;
}

export function subscribeActivePodcastJobs(
  uid: string,
  onChange: (jobs: PodcastCreateJob[]) => void
): Unsubscribe {
  const q = query(collection(db, "podcastJobs"), where("createdBy", "==", uid));
  return onSnapshot(
    q,
    (snap) => {
      const jobs = snap.docs
        .map((d) => mapJob(d.id, d.data() as Record<string, unknown>))
        .filter((job) => job.status === "queued" || job.status === "running");
      onChange(jobs);
    },
    (err) => {
      if (import.meta.env.DEV) {
        console.warn("subscribeActivePodcastJobs failed", err);
      }
      onChange([]);
    }
  );
}

export function subscribePodcastJob(
  jobId: string,
  onChange: (job: PodcastCreateJob | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "podcastJobs", jobId), (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    onChange(mapJob(snap.id, snap.data() as Record<string, unknown>));
  });
}
