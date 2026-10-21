import type { ReactNode } from "react";
import ResumeSidebar, { type ResumeWorkspaceTab } from "./ResumeSidebar";
import ResumeTopBar, { type ResumeShellMode } from "./ResumeTopBar";

type ResumeShellProps = {
  children: ReactNode;
  activeTab: ResumeWorkspaceTab;
  sidebarOpen: boolean;
  onSidebarOpen: () => void;
  onSidebarClose: () => void;
  mode: ResumeShellMode;
  titleOverride?: string;
  onPaste?: () => void;
  onSave?: () => void;
  saving?: boolean;
  saveStatus?: string | null;
  downloadAction?: React.ReactNode;
  onCreateResume?: () => void;
  creating?: boolean;
  onCreateCoverLetter?: () => void;
};

export default function ResumeShell({
  children,
  activeTab,
  sidebarOpen,
  onSidebarOpen,
  onSidebarClose,
  mode,
  titleOverride,
  onPaste,
  onSave,
  saving,
  saveStatus,
  downloadAction,
  onCreateResume,
  creating,
  onCreateCoverLetter,
}: ResumeShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex">
      <ResumeSidebar
        activeTab={activeTab}
        mobileOpen={sidebarOpen}
        onCloseMobile={onSidebarClose}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 lg:ml-0">
        <ResumeTopBar
          activeTab={activeTab}
          mode={mode}
          titleOverride={titleOverride}
          onMenuClick={onSidebarOpen}
          onPaste={onPaste}
          onSave={onSave}
          saving={saving}
          saveStatus={saveStatus}
          downloadAction={downloadAction}
          onCreateResume={onCreateResume}
          creating={creating}
          onCreateCoverLetter={onCreateCoverLetter}
        />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="w-full flex flex-col flex-1 min-h-0 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
