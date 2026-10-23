import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/outline";
import { db } from "../../firebase";
import {
  normalizePodcastVoice,
  podcastVoiceAvatar,
  podcastVoiceLabel,
} from "../../constants/podcastVoiceOptions";

type StudyPodcastPlayerProps = {
  podcastId: string;
  cardIndex: number;
  cardTotal: number;
  onInteract?: () => void;
};

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function StudyPodcastPlayer({
  podcastId,
  cardIndex,
  cardTotal,
  onInteract,
}: StudyPodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastInteractAtRef = useRef(0);
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [voiceId, setVoiceId] = useState("Vindemiatrix");
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const bumpInteract = () => {
    const now = Date.now();
    if (now - lastInteractAtRef.current < 2000) return;
    lastInteractAtRef.current = now;
    onInteract?.();
  };

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setIsPlaying(false);
    setCurrent(0);
    setDuration(0);
    setAudioUrl("");
    setTitle("");

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "podcasts", podcastId));
        if (!snap.exists() || cancelled) {
          if (!cancelled) setLoadError(true);
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        const url = String(data.audioUrl || "");
        if (!url) {
          setLoadError(true);
          return;
        }
        setTitle(String(data.title || "Podcast"));
        setAudioUrl(url);
        setVoiceId(normalizePodcastVoice(data.voice));
        setDuration(Math.max(0, Number(data.durationSeconds) || 0));
      } catch {
        if (!cancelled) setLoadError(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, [podcastId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (audio.src !== audioUrl) {
      audio.src = audioUrl;
      audio.load();
    }
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    bumpInteract();
    if (audio.paused) {
      void audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  if (loadError || !audioUrl) return null;

  const total = Math.max(1, cardTotal);
  const currentCard = Math.min(total, Math.max(1, cardIndex + 1));
  const setPercent = Math.min(100, Math.round((currentCard / total) * 100));
  const audioPercent =
    duration > 0 ? Math.min(100, Math.round((current / duration) * 100)) : 0;
  const ringSize = 44;
  const stroke = 3.5;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - setPercent / 100);

  return (
    <div className="mb-6 study-round border border-violet-200 bg-violet-50/50 dark:border-violet-900/50 dark:bg-violet-950/30 px-4 py-3">
      <audio
        ref={audioRef}
        className="hidden"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setCurrent(el.currentTime);
          if (Number.isFinite(el.duration) && el.duration > 0) {
            setDuration(el.duration);
          }
          if (!el.paused) bumpInteract();
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          if (Number.isFinite(el.duration) && el.duration > 0) {
            setDuration(el.duration);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrent(0);
        }}
      />
      <div className="flex items-center gap-3">
        <img
          src={podcastVoiceAvatar(voiceId)}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-violet-200 dark:ring-violet-800"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-violet-600 dark:text-violet-400">
            Podcast
          </p>
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {title}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {podcastVoiceLabel(voiceId)} · play while you study
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <div
            className="relative shrink-0"
            style={{ width: ringSize, height: ringSize }}
            aria-label={`Set progress ${setPercent}%`}
          >
            <svg
              width={ringSize}
              height={ringSize}
              className="-rotate-90"
              aria-hidden
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-violet-200 dark:text-violet-900"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="text-violet-600 transition-[stroke-dashoffset] duration-300 dark:text-violet-400"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-violet-700 dark:text-violet-200">
              {setPercent}%
            </span>
          </div>
          <button
            type="button"
            onClick={togglePlay}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
              isPlaying
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-violet-200 bg-white text-violet-700 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
            }`}
            aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5 translate-x-px" />
            )}
          </button>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-200/80 dark:bg-violet-900/50">
          <div
            className="h-full rounded-full bg-violet-600 transition-[width] duration-150"
            style={{
              width: `${Math.max(audioPercent, audioPercent > 0 ? 2 : 0)}%`,
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
          <span>{formatAudioTime(current)}</span>
          <span>{duration > 0 ? formatAudioTime(duration) : "--:--"}</span>
        </div>
      </div>
    </div>
  );
}
