import { ClockIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import type { StudyFolder, StudySet } from "../../types/study";
import { UNCATEGORIZED_FOLDER_ID } from "../../types/study";
import StudySectionHeader from "./StudySectionHeader";

type StudyFolderViewProps = {
  folder: StudyFolder | null;
  isUncategorized: boolean;
  sets: StudySet[];
  onStartSet: (set: StudySet) => void;
  onCreateInFolder: () => void;
};

function SetRow({
  set,
  onStart,
  onEdit,
}: {
  set: StudySet;
  onStart: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-colors group">
      <button
        type="button"
        onClick={onStart}
        className="flex flex-1 items-center gap-4 text-left min-w-0"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 text-lg">
          📇
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate">{set.title}</p>
          <p className="text-sm text-gray-500 dark:text-zinc-500">
            Flashcard set · {set.cardCount} cards
          </p>
        </div>
      </button>
      {set.createdBy && (
        <button
          type="button"
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit set"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default function StudyFolderView({
  folder,
  isUncategorized,
  sets,
  onStartSet,
  onCreateInFolder,
}: StudyFolderViewProps) {
  const navigate = useNavigate();
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
              <p className="text-gray-600 dark:text-zinc-400 mb-4">No study sets in this folder.</p>
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
                onStart={() => onStartSet(set)}
                onEdit={() => navigate(`/edit/${set.id}`)}
              />
            ))
          )}
        </div>
      </section>
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
