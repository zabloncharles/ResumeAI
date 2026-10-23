import { useState } from "react";
import {
  ClockIcon,
  FolderIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import type { StudyFolder, StudySet } from "../../types/study";
import { UNCATEGORIZED_FOLDER_ID } from "../../types/study";
import MoveStudySetModal from "./MoveStudySetModal";
import StudySectionHeader from "./StudySectionHeader";

type StudyFolderViewProps = {
  folder: StudyFolder | null;
  isUncategorized: boolean;
  sets: StudySet[];
  folders: StudyFolder[];
  currentUserId?: string;
  onStartSet: (set: StudySet) => void;
  onCreateInFolder: () => void;
  onDeleteSet: (set: StudySet) => void;
  onMoveSet: (set: StudySet, folderId: string | null) => void;
};

function SetRow({
  set,
  canManage,
  onStart,
  onEdit,
  onMove,
  onDelete,
}: {
  set: StudySet;
  canManage: boolean;
  onStart: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-colors group">
      <button
        type="button"
        onClick={onStart}
        className="flex flex-1 items-center gap-3 sm:gap-4 text-left min-w-0"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          <RectangleStackIcon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate">
            {set.title}
          </p>
          <p className="text-sm text-gray-500 dark:text-zinc-500">
            Flashcard set · {set.cardCount} cards
          </p>
        </div>
      </button>
      {canManage ? (
        <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Edit set"
            aria-label={`Edit ${set.title}`}
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onMove}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Move to folder"
            aria-label={`Move ${set.title} to folder`}
          >
            <FolderIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            title="Delete set"
            aria-label={`Delete ${set.title}`}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function StudyFolderView({
  folder,
  isUncategorized,
  sets,
  folders,
  currentUserId,
  onStartSet,
  onCreateInFolder,
  onDeleteSet,
  onMoveSet,
}: StudyFolderViewProps) {
  const navigate = useNavigate();
  const [movingSet, setMovingSet] = useState<StudySet | null>(null);
  const title = isUncategorized
    ? "Uncategorized"
    : folder?.title ?? "Folder";
  const pageDescription = isUncategorized
    ? "Sets not assigned to a folder yet."
    : folder?.description?.trim() ||
      "Flashcard sets grouped for this topic or course.";
  const modified = folder?.updatedAt;

  return (
    <div className="w-full max-w-4xl flex flex-col flex-1 min-h-0">
      <div className="mb-8">
        <StudySectionHeader
          as="h1"
          className="mb-2"
          title={title}
          description={pageDescription}
        />
        {modified && !isUncategorized && (
          <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-500 mt-2">
            <ClockIcon className="h-4 w-4" />
            Modified {modified.toLocaleDateString()}
          </p>
        )}
      </div>

      <section className="mb-8">
        <StudySectionHeader
          className="mb-3"
          title="Materials"
          description={
            isUncategorized
              ? "Study sets that are not in a folder yet."
              : "Flashcard sets organized in this folder."
          }
        />
        <div className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800 shadow-sm overflow-hidden">
          {sets.length === 0 ? (
            <div className="flex w-full flex-1 flex-col items-center justify-center text-center min-h-[min(20rem,calc(100dvh-14rem))] px-6 py-12">
              <p className="text-gray-600 dark:text-zinc-400 mb-4">
                No study sets in this folder.
              </p>
              {!isUncategorized && (
                <button
                  type="button"
                  onClick={onCreateInFolder}
                  className="study-btn px-5 py-2.5 font-medium"
                >
                  Create a set
                </button>
              )}
            </div>
          ) : (
            sets.map((set) => (
              <SetRow
                key={set.id}
                set={set}
                canManage={Boolean(
                  currentUserId && set.createdBy === currentUserId
                )}
                onStart={() => onStartSet(set)}
                onEdit={() => navigate(`/edit/${set.id}`)}
                onMove={() => setMovingSet(set)}
                onDelete={() => onDeleteSet(set)}
              />
            ))
          )}
        </div>
      </section>

      {movingSet ? (
        <MoveStudySetModal
          set={movingSet}
          folders={folders}
          onClose={() => setMovingSet(null)}
          onMove={(nextFolderId) => {
            onMoveSet(movingSet, nextFolderId);
            setMovingSet(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function getSetsForFolderId(
  sets: StudySet[],
  folderId: string | undefined
): StudySet[] {
  if (!folderId) return [];
  if (folderId === UNCATEGORIZED_FOLDER_ID) {
    return sets.filter((s) => !s.folderId);
  }
  return sets.filter((s) => s.folderId === folderId);
}
