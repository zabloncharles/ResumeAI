import { useEffect, useId, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { StudyFolder, StudySet } from "../../types/study";

type MoveStudySetModalProps = {
  set: StudySet;
  folders: StudyFolder[];
  onClose: () => void;
  onMove: (folderId: string | null) => void;
};

export default function MoveStudySetModal({
  set,
  folders,
  onClose,
  onMove,
}: MoveStudySetModalProps) {
  const titleId = useId();
  const [selected, setSelected] = useState(set.folderId ?? "");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-900 dark:text-zinc-100"
            >
              Move to folder
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">
              {set.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
          Folder
        </label>
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="mb-6 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">Uncategorized</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.title}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onMove(selected || null)}
            className="study-btn rounded-full px-4 py-2 text-sm font-semibold"
          >
            Move set
          </button>
        </div>
      </div>
    </div>
  );
}
