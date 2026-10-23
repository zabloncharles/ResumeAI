import { useMemo, useState } from "react";
import {
  FolderIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import {
  displayStudySetCategory,
  getStudyCategoryLabel,
  resolveStudyCategoryId,
} from "../../constants/studyCategories";
import { getStudyCategoryIcon } from "../../constants/studyCategoryIcons";
import type { StudyFolder, StudySet } from "../../types/study";
import type { StudyFilter } from "../StudyWorkspaceNav";
import MoveStudySetModal from "./MoveStudySetModal";
import StudySectionHeader from "./StudySectionHeader";

const filterTitles: Record<StudyFilter, string> = {
  all: "Your library",
  my: "My sets",
  public: "Public sets",
  borrowed: "Borrowed sets",
};

const filterDescriptions: Record<StudyFilter, string> = {
  all: "Every set you can study—grouped by subject.",
  my: "Flashcard sets you built and own—grouped by subject.",
  public: "Your public sets—grouped by subject.",
  borrowed: "Sets you imported—grouped by subject.",
};

type StudyLibraryViewProps = {
  filter: StudyFilter;
  sets: StudySet[];
  folders: StudyFolder[];
  currentUserId?: string;
  onStartSet: (set: StudySet) => void;
  onDeleteSet: (set: StudySet) => void;
  onMoveSet: (set: StudySet, folderId: string | null) => void;
};

type SubjectGroup = {
  categoryId: string;
  subject: string;
  sets: StudySet[];
};

function folderLabel(
  folders: StudyFolder[],
  folderId: string | null | undefined
) {
  if (!folderId) return "Uncategorized";
  return folders.find((f) => f.id === folderId)?.title ?? "Folder";
}

function groupSetsBySubject(sets: StudySet[]): SubjectGroup[] {
  const byCategory = new Map<string, StudySet[]>();

  for (const set of sets) {
    const categoryId = resolveStudyCategoryId(set);
    const existing = byCategory.get(categoryId);
    if (existing) {
      existing.push(set);
    } else {
      byCategory.set(categoryId, [set]);
    }
  }

  return Array.from(byCategory.entries())
    .map(([categoryId, subjectSets]) => ({
      categoryId,
      subject: getStudyCategoryLabel(categoryId),
      sets: [...subjectSets].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      ),
    }))
    .sort((a, b) =>
      a.subject.localeCompare(b.subject, undefined, { sensitivity: "base" })
    );
}

export default function StudyLibraryView({
  filter,
  sets,
  folders,
  currentUserId,
  onStartSet,
  onDeleteSet,
  onMoveSet,
}: StudyLibraryViewProps) {
  const navigate = useNavigate();
  const [movingSet, setMovingSet] = useState<StudySet | null>(null);
  const subjectGroups = useMemo(() => groupSetsBySubject(sets), [sets]);

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      <StudySectionHeader
        as="h1"
        className="mb-6 max-w-4xl w-full"
        title={filterTitles[filter]}
        description={filterDescriptions[filter]}
      />
      {sets.length === 0 ? (
        <div className="flex w-full flex-1 flex-col items-center justify-center text-center min-h-[min(20rem,calc(100dvh-10rem))] px-4">
          <p className="text-gray-600 dark:text-zinc-400">No sets in this view.</p>
        </div>
      ) : (
        <div className="max-w-4xl w-full space-y-8">
          {subjectGroups.map((group) => {
            const SubjectIcon = getStudyCategoryIcon(group.categoryId);

            return (
              <section key={group.categoryId}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      <SubjectIcon className="h-4 w-4" aria-hidden />
                    </span>
                    {group.subject}
                  </h2>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                    {group.sets.length}{" "}
                    {group.sets.length === 1 ? "set" : "sets"}
                  </span>
                </div>
                <div className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800 shadow-sm overflow-hidden">
                  {group.sets.map((set) => {
                    const canManage = Boolean(
                      currentUserId && set.createdBy === currentUserId
                    );
                    const SetIcon = getStudyCategoryIcon(set);

                    return (
                      <div
                        key={set.id}
                        className="flex items-center gap-3 sm:gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/80 group"
                      >
                        <button
                          type="button"
                          onClick={() => onStartSet(set)}
                          className="flex flex-1 items-center gap-3 sm:gap-4 text-left min-w-0"
                        >
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                            title={displayStudySetCategory(set)}
                          >
                            <SetIcon className="h-5 w-5" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate">
                              {set.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-zinc-500 truncate">
                              {set.cardCount} cards
                              {` · ${folderLabel(folders, set.folderId)}`}
                            </p>
                          </div>
                        </button>

                        {canManage ? (
                          <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => navigate(`/edit/${set.id}`)}
                              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                              title="Edit"
                              aria-label={`Edit ${set.title}`}
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMovingSet(set)}
                              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                              title="Move to folder"
                              aria-label={`Move ${set.title} to folder`}
                            >
                              <FolderIcon className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSet(set)}
                              className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                              title="Delete"
                              aria-label={`Delete ${set.title}`}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {movingSet ? (
        <MoveStudySetModal
          set={movingSet}
          folders={folders}
          onClose={() => setMovingSet(null)}
          onMove={(folderId) => {
            onMoveSet(movingSet, folderId);
            setMovingSet(null);
          }}
        />
      ) : null}
    </div>
  );
}
