import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  RectangleStackIcon,
  GlobeAltIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  PlusIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import type { StudyFolder } from "../../types/study";
import type { StudyFilter } from "../StudyWorkspaceNav";
import { UNCATEGORIZED_FOLDER_ID } from "../../types/study";
import bunny1 from "../../bunny1.png";

type StudySidebarProps = {
  folders: StudyFolder[];
  uncategorizedCount: number;
  libraryFilter: StudyFilter;
  onLibraryFilter: (filter: StudyFilter) => void;
  onNewFolder: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

const folderColors = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
];

function folderColorClass(index: number) {
  return folderColors[index % folderColors.length];
}

export default function StudySidebar({
  folders,
  uncategorizedCount,
  libraryFilter,
  onLibraryFilter,
  onNewFolder,
  mobileOpen,
  onCloseMobile,
}: StudySidebarProps) {
  const location = useLocation();
  const path = location.pathname;
  const pathNorm = path.replace(/\/$/, "") || "/";

  const isHome = pathNorm === "/study";
  const isLibrary = path.startsWith("/study/library");
  const isPerformance = pathNorm === "/study/performance";
  const activeFolderId = path.startsWith("/study/folder/")
    ? path.replace("/study/folder/", "").split("/")[0]
    : null;

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link
          to="/study"
          onClick={onCloseMobile}
          className={navLinkClass(isHome)}
        >
          <HomeIcon className="h-5 w-5 shrink-0" />
          Study hub
        </Link>
        <Link
          to="/study/library"
          onClick={() => {
            onLibraryFilter("all");
            onCloseMobile();
          }}
          className={navLinkClass(isLibrary && libraryFilter === "all")}
        >
          <RectangleStackIcon className="h-5 w-5 shrink-0" />
          Your library
        </Link>
        <Link
          to="/study/library?filter=public"
          onClick={() => {
            onLibraryFilter("public");
            onCloseMobile();
          }}
          className={navLinkClass(isLibrary && libraryFilter === "public")}
        >
          <GlobeAltIcon className="h-5 w-5 shrink-0" />
          Public sets
        </Link>
        <Link
          to="/study/library?filter=borrowed"
          onClick={() => {
            onLibraryFilter("borrowed");
            onCloseMobile();
          }}
          className={navLinkClass(isLibrary && libraryFilter === "borrowed")}
        >
          <ArrowDownTrayIcon className="h-5 w-5 shrink-0" />
          Borrowed
        </Link>
        <Link
          to="/study/performance"
          onClick={onCloseMobile}
          className={navLinkClass(isPerformance)}
        >
          <ChartBarIcon className="h-5 w-5 shrink-0" />
          Performance
        </Link>

        <div className="pt-4 pb-1 px-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
            Folders
          </p>
        </div>

        {folders.map((folder, index) => (
          <Link
            key={folder.id}
            to={`/study/folder/${folder.id}`}
            onClick={onCloseMobile}
            className={navLinkClass(activeFolderId === folder.id)}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${folderColorClass(index)}`}
            >
              {folder.title.slice(0, 2).toUpperCase()}
            </span>
            <span className="truncate">{folder.title}</span>
          </Link>
        ))}

        {uncategorizedCount > 0 && (
          <Link
            to={`/study/folder/${UNCATEGORIZED_FOLDER_ID}`}
            onClick={onCloseMobile}
            className={navLinkClass(activeFolderId === UNCATEGORIZED_FOLDER_ID)}
          >
            <FolderIcon className="h-5 w-5 shrink-0 text-gray-400" />
            <span className="truncate">Uncategorized</span>
            <span className="ml-auto text-xs text-gray-400">
              {uncategorizedCount}
            </span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => {
            onNewFolder();
            onCloseMobile();
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800 w-full"
        >
          <PlusIcon className="h-5 w-5" />
          New folder
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
