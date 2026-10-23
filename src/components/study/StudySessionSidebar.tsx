import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  RectangleStackIcon,
  QuestionMarkCircleIcon,
  Squares2X2Icon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";
import type { StudyMode } from "../StudyWorkspaceNav";
import {
  studyFlowAccent,
  type StudyFlowAccent,
} from "../../constants/studyFlowAccent";
import BrandLogo from "../BrandLogo";

type StudySessionSidebarProps = {
  setTitle: string;
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  accent?: StudyFlowAccent;
};

export default function StudySessionSidebar({
  setTitle,
  studyMode,
  onStudyModeChange,
  mobileOpen,
  onCloseMobile,
  accent = "default",
}: StudySessionSidebarProps) {
  const flow = studyFlowAccent(accent);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const activeModeClass =
    accent === "violet"
      ? "bg-violet-50 text-violet-900 dark:bg-violet-950/80 dark:text-violet-100"
      : accent === "rose"
        ? "bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-100"
        : "bg-sky-50 text-sky-900 dark:bg-sky-950/80 dark:text-sky-100";

  const modeLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
      active
        ? activeModeClass
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
        <BrandLogo accent={accent} className="h-10 w-auto shrink-0" alt="" />
        <div className="min-w-0">
          <p className={`text-lg font-bold ${flow.brandGradient} truncate`}>
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
        <button
          type="button"
          onClick={() => {
            onStudyModeChange("match");
            onCloseMobile();
          }}
          className={modeLinkClass(studyMode === "match")}
        >
          <Squares2X2Icon className="h-5 w-5 shrink-0" />
          Match
        </button>
        <button
          type="button"
          onClick={() => {
            onStudyModeChange("farm");
            onCloseMobile();
          }}
          className={modeLinkClass(studyMode === "farm")}
        >
          <HomeModernIcon className="h-5 w-5 shrink-0" />
          Farm
        </button>
      </nav>
    </>
  );

  return (
    <>
      {mobileOpen
        ? createPortal(
            <button
              type="button"
              className="fixed inset-0 z-[100] bg-black/30 lg:hidden"
              aria-label="Close menu"
              onClick={onCloseMobile}
            />,
            document.body
          )
        : null}
      <aside
        className={`fixed lg:sticky top-0 z-[110] lg:z-auto h-full lg:h-[calc(100vh-0px)] w-64 shrink-0 flex flex-col bg-gray-50 dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
