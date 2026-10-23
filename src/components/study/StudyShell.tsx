import type { ReactNode } from "react";
import type { StudyFolder } from "../../types/study";
import type { StudyFlowAccent } from "../../constants/studyFlowAccent";
import type { StudyFilter } from "../StudyWorkspaceNav";
import StudySidebar from "./StudySidebar";
import StudyTopBar from "./StudyTopBar";
import PodcastJobBanner from "./PodcastJobBanner";

type StudyShellProps = {
  children: ReactNode;
  folders: StudyFolder[];
  uncategorizedCount: number;
  libraryFilter: StudyFilter;
  onLibraryFilter: (filter: StudyFilter) => void;
  onNewFolder: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateSet: () => void;
  sidebarOpen: boolean;
  onSidebarOpen: () => void;
  onSidebarClose: () => void;
  searchPlaceholder?: string;
  accent?: StudyFlowAccent;
  pageHeader?: {
    title: string;
    description?: string;
    onBack: () => void;
  };
};

export default function StudyShell({
  children,
  folders,
  uncategorizedCount,
  libraryFilter,
  onLibraryFilter,
  onNewFolder,
  searchQuery,
  onSearchChange,
  onCreateSet,
  sidebarOpen,
  onSidebarOpen,
  onSidebarClose,
  searchPlaceholder,
  accent = "default",
  pageHeader,
}: StudyShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex">
      <StudySidebar
        folders={folders}
        uncategorizedCount={uncategorizedCount}
        libraryFilter={libraryFilter}
        onLibraryFilter={onLibraryFilter}
        onNewFolder={onNewFolder}
        mobileOpen={sidebarOpen}
        onCloseMobile={onSidebarClose}
        accent={accent}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 lg:ml-0">
        <StudyTopBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onCreateSet={onCreateSet}
          onMenuClick={() =>
            sidebarOpen ? onSidebarClose() : onSidebarOpen()
          }
          searchPlaceholder={searchPlaceholder}
          pageHeader={pageHeader}
          accent={accent}
        />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="w-full flex flex-col flex-1 min-h-0">
            <PodcastJobBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
