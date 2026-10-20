import { Link } from "react-router-dom";
import {
  RectangleStackIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import type { StudyMode } from "../StudyWorkspaceNav";
import bunny1 from "../../bunny1.png";

type StudySessionSidebarProps = {
  setTitle: string;
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export default function StudySessionSidebar({
  setTitle,
  studyMode,
  onStudyModeChange,
  mobileOpen,
  onCloseMobile,
}: StudySessionSidebarProps) {
  const modeLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
      active
        ? "bg-sky-50 text-sky-900 dark:bg-sky-950/80 dark:text-sky-100"
        : "text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  const sidebarContent = (
    <>
      <Link
        to="/"
        onClick={onCloseMobile}
        className="flex h-[5.5rem] shrink-0 items-center gap-3 px-4 border-b border-gray-100 dark:border-zinc-800 min-w-0 hover:opacity-90 transition-opacity"
        aria-label="Brightfolio home"
      >
        <img src={bunny1} alt="" className="h-10 w-10 shrink-0" />
        <div className="min-w-0">
          <p className="text-lg font-bold bg-gradient-to-r from-[#16aeac] to-black dark:to-white bg-clip-text text-transparent truncate">
            Brightfolio
          </p>
          <p className="text-sm text-gray-500 dark:text-zinc-500">Study</p>
        </div>
      </Link>

      <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1">
          Studying
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 line-clamp-2">
          {setTitle}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
          Mode
        </p>
        <button
          type="button"
          onClick={() => {
            onStudyModeChange("flashcards");
            onCloseMobile();
          }}
          className={modeLinkClass(studyMode === "flashcards")}
        >
          <RectangleStackIcon className="h-5 w-5 shrink-0" />
          Flashcards
        </button>
        <button
          type="button"
          onClick={() => {
            onStudyModeChange("quiz");
            onCloseMobile();
          }}
          className={modeLinkClass(studyMode === "quiz")}
        >
          <QuestionMarkCircleIcon className="h-5 w-5 shrink-0" />
          Quiz
        </button>
      </nav>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 z-50 lg:z-auto h-full lg:h-[calc(100vh-0px)] w-64 shrink-0 flex flex-col bg-gray-50 dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
