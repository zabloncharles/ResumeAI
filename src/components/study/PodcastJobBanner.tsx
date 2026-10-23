import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import {
  podcastJobStatusCopy,
  subscribeActivePodcastJobs,
  type PodcastCreateJob,
} from "../../utils/podcastCreateJobs";

export default function PodcastJobBanner() {
  const [jobs, setJobs] = useState<PodcastCreateJob[]>([]);

  useEffect(() => {
    let unsubJobs: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubJobs?.();
      unsubJobs = undefined;
      if (!user) {
        setJobs([]);
        return;
      }
      unsubJobs = subscribeActivePodcastJobs(user.uid, setJobs);
    });
    return () => {
      unsubAuth();
      unsubJobs?.();
    };
  }, []);

  if (jobs.length === 0) return null;

  const job = jobs[0];
  const percent = Math.min(99, Math.max(2, Math.round(job.progress || 2)));

  return (
    <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 dark:border-violet-900/50 dark:bg-violet-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
            Creating podcast
            {job.title ? `: ${job.title}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-violet-700/80 dark:text-violet-300/80">
            {podcastJobStatusCopy(job)} Keeps running if you leave this page.
          </p>
        </div>
        <Link
          to="/podcast"
          className="shrink-0 text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300"
        >
          View
        </Link>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-200/80 dark:bg-violet-900/60">
        <div
          className="h-full rounded-full bg-violet-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
