import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type NewFolderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => Promise<void>;
};

export default function NewFolderModal({
  isOpen,
  onClose,
  onCreate,
}: NewFolderModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onCreate(title, description);
      setTitle("");
      setDescription("");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="study-round bg-white dark:bg-zinc-950 shadow-xl w-full max-w-md p-6 border border-transparent dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
              New folder
            </h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
              Group related study sets so you can find them faster in the sidebar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-study-accent focus:border-transparent"
              placeholder="e.g. Molecular Biology"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-study-accent focus:border-transparent resize-none"
              placeholder="Course or topic notes"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="study-btn px-5 py-2 font-medium disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
