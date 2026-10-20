import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import type { ResumeListItem } from "../../types/resumeWorkspace";
import ResumeTemplateMiniPreview from "./ResumeTemplateMiniPreview";
import {
  normalizeTemplateId,
  templateDisplayName,
} from "../../constants/resumeTemplates";

type ResumeHomeViewProps = {
  resumes: ResumeListItem[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  onCreate: () => void;
  onDelete: (item: ResumeListItem) => void;
  deletingId: string | null;
  onRefresh: () => void;
};

function formatRelativeTime(iso?: string) {
  if (!iso) return "Not saved yet";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "Recently updated";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Updated just now";
  if (mins < 60) return `Updated ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `Updated ${hours}h ago`;
  return `Updated ${new Date(t).toLocaleDateString()}`;
}

function ResumeLetterCard({
  item,
  onOpen,
  onDelete,
  deleting,
}: {
  item: ResumeListItem;
  onOpen: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const name = item.title || "Untitled resume";
  const role = item.subtitle?.trim() || "No role title yet";
  const templateId = normalizeTemplateId(item.selectedTemplate ?? "");
  const templateName = templateDisplayName(item.selectedTemplate);

  return (
    <div className="flex flex-col items-center w-full max-w-[220px] mx-auto group/card">
      <div className="relative w-full transition-transform duration-200 group-hover/card:-translate-y-1">
        <button
          type="button"
          onClick={onOpen}
          disabled={deleting}
          className="w-full block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16aeac] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-zinc-950 disabled:opacity-60"
        >
          <div className="resume-preview-paper relative w-full aspect-[8.5/11] rounded-sm border border-zinc-200/90 shadow-md group-hover/card:shadow-lg overflow-hidden transition-shadow">
            <ResumeTemplateMiniPreview
              template={templateId}
              fullName={name}
              className="absolute inset-0"
            />
            <div className="pointer-events-none absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-zinc-200/50 to-transparent z-10" />
          </div>
        </button>
        <button
          type="button"
          aria-label={`Delete ${name}`}
          disabled={deleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1.5 right-1.5 z-20 p-1 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 opacity-90 sm:opacity-0 sm:group-hover/card:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-40"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onOpen}
        disabled={deleting}
        className="mt-3 w-full px-0.5 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16aeac] focus-visible:ring-offset-2 rounded-sm disabled:opacity-60"
      >
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate text-center">
          {name}
        </p>
        <p className="text-xs font-medium text-[#16aeac] dark:text-[#5ececc] truncate text-center mt-0.5">
          {templateName}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate text-center mt-0.5">
          {role} · {formatRelativeTime(item.lastUpdated)}
        </p>
      </button>
    </div>
  );
}

function NewResumeLetterCard({
  creating,
  onCreate,
}: {
  creating: boolean;
  onCreate: () => void;
}) {
  return (
    <button
      type="button"
      disabled={creating}
      onClick={onCreate}
      className="group flex flex-col items-center w-full max-w-[220px] mx-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16aeac] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-zinc-950 rounded-sm disabled:opacity-50"
    >
      <div className="relative w-full transition-transform duration-200 group-hover:-translate-y-1">
        <div className="w-full aspect-[8.5/11] rounded-sm border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-900/50 flex flex-col items-center justify-center gap-2 shadow-sm group-hover:border-[#16aeac]/60 group-hover:bg-white dark:group-hover:bg-zinc-900">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 group-hover:text-[#16aeac] group-hover:border-[#16aeac]/40 transition-colors">
            <PlusIcon className="h-6 w-6" />
          </span>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 px-4 text-center">
            {creating ? "Creating…" : "New resume"}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-transparent select-none" aria-hidden>
        placeholder
      </p>
    </button>
  );
}

export default function ResumeHomeView({
  resumes,
  loading,
  error,
  creating,
  onCreate,
  onDelete,
  deletingId,
  onRefresh,
}: ResumeHomeViewProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      <p className="mb-6 w-full max-w-2xl text-sm text-gray-600 dark:text-zinc-400">
        Create and manage multiple resumes. Open one to edit, change templates,
        and export a PDF.
      </p>

      {error && (
        <div className="mb-4 max-w-5xl w-full rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200 flex flex-wrap items-center gap-3">
          <span className="flex-1 min-w-0">{error}</span>
          <button
            type="button"
            onClick={onRefresh}
            className="text-sm font-medium underline hover:no-underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center min-h-[min(20rem,calc(100dvh-10rem))]">
          <p className="text-gray-600 dark:text-zinc-400">Loading resumes…</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="flex w-full flex-1 flex-col items-center justify-center min-h-[min(20rem,calc(100dvh-10rem))] px-4">
          <div className="w-full max-w-[240px]">
            <NewResumeLetterCard creating={creating} onCreate={onCreate} />
          </div>
          <p className="mt-6 text-sm text-gray-600 dark:text-zinc-400 text-center max-w-xs">
            Your first resume will appear here as a letter you can open and edit.
          </p>
        </div>
      ) : (
        <div className="max-w-5xl w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pb-8">
            <NewResumeLetterCard creating={creating} onCreate={onCreate} />
            {resumes.map((item) => (
              <ResumeLetterCard
                key={item.id}
                item={item}
                onOpen={() => navigate(`/resume/edit/${item.id}`)}
                onDelete={() => onDelete(item)}
                deleting={deletingId === item.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
