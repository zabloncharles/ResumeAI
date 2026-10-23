import type { ReactNode } from "react";
import type { StudyMode } from "../StudyWorkspaceNav";
import type { StudyFlowAccent } from "../../constants/studyFlowAccent";
import StudySessionSidebar from "./StudySessionSidebar";
import StudySessionTopBar from "./StudySessionTopBar";

type StudySessionShellProps = {
  children: ReactNode;
  setTitle: string;
  cardLabel: string;
  timerLabel: string;
  timerIdlePaused?: boolean;
  idlePauseCountdownActive?: boolean;
  idlePauseSecondsRemaining?: number;
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  onEndSession: () => void;
  sidebarOpen: boolean;
  onSidebarOpen: () => void;
  onSidebarClose: () => void;
  accent?: StudyFlowAccent;
};

export default function StudySessionShell({
  children,
  setTitle,
  cardLabel,
  timerLabel,
  timerIdlePaused = false,
  idlePauseCountdownActive = false,
  idlePauseSecondsRemaining = 60,
  studyMode,
  onStudyModeChange,
  onEndSession,
  sidebarOpen,
  onSidebarOpen,
  onSidebarClose,
  accent = "default",
}: StudySessionShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex">
      <StudySessionSidebar
        setTitle={setTitle}
        studyMode={studyMode}
        onStudyModeChange={onStudyModeChange}
        mobileOpen={sidebarOpen}
        onCloseMobile={onSidebarClose}
        accent={accent}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <StudySessionTopBar
          setTitle={setTitle}
          cardLabel={cardLabel}
          timerLabel={timerLabel}
          timerIdlePaused={timerIdlePaused}
          idlePauseCountdownActive={idlePauseCountdownActive}
          idlePauseSecondsRemaining={idlePauseSecondsRemaining}
          onMenuClick={() =>
            sidebarOpen ? onSidebarClose() : onSidebarOpen()
          }
          onBackToStudy={onEndSession}
          accent={accent}
        />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="w-full flex flex-col flex-1 min-h-0 max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
