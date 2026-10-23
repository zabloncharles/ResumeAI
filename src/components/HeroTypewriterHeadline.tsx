import { useEffect, useState } from "react";

const SUFFIXES = ["Study Sets", "Resume", "Cover Letter"] as const;
const LONGEST_SUFFIX = "Cover Letter";

const TYPING_MS = 88;
const DELETING_MS = 56;
const PAUSE_MS = 1900;

export default function HeroTypewriterHeadline() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionOk(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!motionOk) {
      setText(SUFFIXES[0]);
      return;
    }

    const target = SUFFIXES[phraseIndex];

    if (!deleting && text === target) {
      const pause = window.setTimeout(() => setDeleting(true), PAUSE_MS);
      return () => window.clearTimeout(pause);
    }

    if (deleting && text === "") {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % SUFFIXES.length);
      return;
    }

    const step = window.setTimeout(
      () => {
        setText(
          deleting
            ? target.slice(0, Math.max(0, text.length - 1))
            : target.slice(0, text.length + 1)
        );
      },
      deleting ? DELETING_MS : TYPING_MS
    );

    return () => window.clearTimeout(step);
  }, [text, deleting, phraseIndex, motionOk]);

  return (
    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-8 px-2">
      <span className="block">Create Your Future,</span>
      <span className="mt-2 block">
        <span className="inline">Build Your Perfect </span>
        <span className="inline-grid align-bottom text-left whitespace-nowrap">
          <span className="invisible col-start-1 row-start-1" aria-hidden>
            {LONGEST_SUFFIX}
          </span>
          <span className="col-start-1 row-start-1">
            <span className="bg-gradient-to-r from-[#16aeac] to-green-600 dark:from-teal-300 dark:to-green-400 bg-clip-text text-transparent">
              {text}
            </span>
            {motionOk && (
              <span
                className="text-[#16aeac] dark:text-teal-300 animate-pulse"
                aria-hidden
              >
                |
              </span>
            )}
          </span>
        </span>
      </span>
    </h1>
  );
}
