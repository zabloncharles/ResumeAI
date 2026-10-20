import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { displayStudySetCategory } from "../../constants/studyCategories";
import type { StudySet } from "../../types/study";
import type { StudyFilter } from "../StudyWorkspaceNav";
import StudySectionHeader from "./StudySectionHeader";

const filterTitles: Record<StudyFilter, string> = {
  all: "Your library",
  my: "My sets",
  public: "Public sets",
  borrowed: "Borrowed sets",
};

const filterDescriptions: Record<StudyFilter, string> = {
  all: "Every set you can study—created, imported, or borrowed.",
  my: "Flashcard sets you built and own.",
  public: "Your sets marked public—discoverable without an import code.",
  borrowed: "Sets you imported from another learner.",
};

type StudyLibraryViewProps = {
  filter: StudyFilter;
  sets: StudySet[];
  onStartSet: (set: StudySet) => void;
};

export default function StudyLibraryView({
  filter,
  sets,
  onStartSet,
}: StudyLibraryViewProps) {
  const navigate = useNavigate();

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
      <div className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800 shadow-sm overflow-hidden max-w-4xl w-full">
        {
          sets.map((set) => (
            <div
              key={set.id}
              className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/80 group"
            >
              <button
                type="button"
                onClick={() => onStartSet(set)}
                className="flex flex-1 items-center gap-4 text-left min-w-0"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 text-lg">
                  📇
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-zinc-100 truncate">
                    {set.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">
                    Flashcard set · {set.cardCount} cards
                    {` · ${displayStudySetCategory(set)}`}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/edit/${set.id}`)}
                className="p-2 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100"
                title="Edit"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            </div>
          ))
        }
      </div>
      )}
    </div>
  );
}
