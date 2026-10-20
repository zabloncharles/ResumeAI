import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Bars3Icon,
  PlusIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import UserAccountMenu from "../UserAccountMenu";
import bunny1 from "../../bunny1.png";
import type { ResumeWorkspaceTab } from "./ResumeSidebar";

export type ResumeShellMode = "home" | "help" | "editor";

type ResumeTopBarProps = {
  activeTab: ResumeWorkspaceTab;
  mode: ResumeShellMode;
  titleOverride?: string;
  onMenuClick: () => void;
  onPaste?: () => void;
  onSave?: () => void;
  saving?: boolean;
  saveStatus?: string | null;
  downloadAction?: ReactNode;
  onCreateResume?: () => void;
  creating?: boolean;
};

const tabTitles: Record<ResumeWorkspaceTab, string> = {
  home: "Your resumes",
  help: "Help",
  editor: "Resume editor",
};

export default function ResumeTopBar({
  activeTab,
  mode,
  titleOverride,
  onMenuClick,
  onPaste,
  onSave,
  saving = false,
  saveStatus,
  downloadAction,
  onCreateResume,
  creating = false,
}: ResumeTopBarProps) {
  const actionBtn =
    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac] dark:focus:ring-offset-zinc-950";

  const title = titleOverride?.trim() || tabTitles[activeTab];

  return (
    <header className="sticky top-0 z-30 flex h-[5.5rem] shrink-0 items-center gap-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 px-4 lg:px-6">
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 shrink-0"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <Link
          to="/"
          className="lg:hidden flex items-center gap-2 shrink-0 min-w-0 rounded-lg hover:opacity-90 transition-opacity"
          aria-label="Brightfolio home"
        >
          <img src={bunny1} alt="" className="h-9 w-9 shrink-0" />
          <span className="text-base font-bold bg-gradient-to-r from-[#16aeac] to-black dark:to-white bg-clip-text text-transparent truncate">
            Brightfolio
          </span>
        </Link>
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        {mode === "editor" && (
          <Link
            to="/resume"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 shrink-0"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Home
          </Link>
        )}
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-100 truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {mode === "home" && onCreateResume && (
          <button
            type="button"
            disabled={creating}
            onClick={onCreateResume}
            className={`inline-flex items-center gap-1.5 ${actionBtn} bg-[#16aeac] text-white border-transparent hover:opacity-90 hover:bg-[#16aeac] disabled:opacity-50`}
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">
              {creating ? "Creating…" : "New resume"}
            </span>
          </button>
        )}
        {mode === "editor" && (
          <>
            {onPaste && (
              <button
                type="button"
                onClick={onPaste}
                className={`hidden sm:inline-flex ${actionBtn}`}
              >
                Paste resume
              </button>
            )}
            {downloadAction}
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${actionBtn} ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title={saveStatus || "Save resume"}
              >
                {saving ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                )}
              </button>
            )}
          </>
        )}
        <UserAccountMenu className="hidden sm:flex shrink-0" />
      </div>
    </header>
  );
}
