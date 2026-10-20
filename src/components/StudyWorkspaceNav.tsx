import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import bunny1 from "../bunny1.png";
import UserAccountMenu from "./UserAccountMenu";

export type StudyFilter = "all" | "my" | "public" | "borrowed";
export type StudyMode = "flashcards" | "quiz";

type HubProps = {
  variant: "hub";
  filter: StudyFilter;
  onFilterChange: (filter: StudyFilter) => void;
  onCreateSet: () => void;
  onImportPublic?: () => void;
  showImportPublic?: boolean;
  onSignInClick?: () => void;
  onRegisterClick?: () => void;
};

type SessionProps = {
  variant: "session";
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  onEndSession: () => void;
  onSignInClick?: () => void;
  onRegisterClick?: () => void;
};

type EditorProps = {
  variant: "editor";
  isEditMode: boolean;
  onBack: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  onStudyHub: () => void;
  onSignInClick?: () => void;
  onRegisterClick?: () => void;
};

export type StudyWorkspaceNavProps = HubProps | SessionProps | EditorProps;

const filterTabs: { id: StudyFilter; label: string }[] = [
  { id: "all", label: "All Sets" },
  { id: "my", label: "My Sets" },
  { id: "public", label: "Public" },
  { id: "borrowed", label: "Borrowed" },
];

function BrandRow({
  backTo,
  onBack,
}: {
  backTo?: string;
  onBack?: () => void;
}) {
  const backControl = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label="Back"
    >
      <BackChevron />
    </button>
  ) : (
    <Link
      to={backTo ?? "/"}
      className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label="Back"
    >
      <BackChevron />
    </Link>
  );

  return (
    <>
      {backControl}
      <img src={bunny1} alt="Brightfolio" className="h-8 w-8 mr-2" />
      <h1 className="text-xl font-bold bg-gradient-to-r from-[#16aeac] to-black dark:to-white bg-clip-text text-transparent mr-4 sm:mr-6">
        Brightfolio
      </h1>
    </>
  );
}

function BackChevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-gray-700"
    >
      <polyline points="15 6 9 12 15 18" />
    </svg>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`px-3 sm:px-4 py-2 border border-gray-200 rounded-t-md bg-white text-gray-800 font-semibold text-sm sm:text-base whitespace-nowrap ${
        active ? "border-b-0 font-bold" : "opacity-70"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function StudyWorkspaceNav(props: StudyWorkspaceNavProps) {
  const onSignInClick =
    "onSignInClick" in props ? props.onSignInClick : undefined;
  const onRegisterClick =
    "onRegisterClick" in props ? props.onRegisterClick : undefined;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 min-h-16">
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 flex-shrink items-center">
              {props.variant === "session" ? (
                <BrandRow onBack={props.onEndSession} />
              ) : props.variant === "editor" ? (
                <BrandRow onBack={props.onBack} />
              ) : (
                <BrandRow backTo="/" />
              )}

              {props.variant === "hub" && (
                <nav className="hidden md:flex space-x-1 bg-transparent overflow-x-auto">
                  {filterTabs.map((tab) => (
                    <TabButton
                      key={tab.id}
                      active={props.filter === tab.id}
                      onClick={() => props.onFilterChange(tab.id)}
                    >
                      {tab.label}
                    </TabButton>
                  ))}
                </nav>
              )}

              {props.variant === "session" && (
                <nav className="flex space-x-1 bg-transparent">
                  <TabButton
                    active={props.studyMode === "flashcards"}
                    onClick={() => props.onStudyModeChange("flashcards")}
                  >
                    Flashcards
                  </TabButton>
                  <TabButton
                    active={props.studyMode === "quiz"}
                    onClick={() => props.onStudyModeChange("quiz")}
                  >
                    Quiz
                  </TabButton>
                </nav>
              )}

              {props.variant === "editor" && (
                <nav className="hidden sm:flex space-x-1 bg-transparent">
                  <TabButton active onClick={() => {}}>
                    {props.isEditMode ? "Edit Set" : "Create Set"}
                  </TabButton>
                  <TabButton active={false} onClick={props.onStudyHub}>
                    Study Hub
                  </TabButton>
                </nav>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {props.variant === "hub" && (
              <>
                <div className="flex md:hidden">
                  <select
                    value={props.filter}
                    onChange={(e) =>
                      props.onFilterChange(e.target.value as StudyFilter)
                    }
                    className="text-sm border border-gray-300 rounded-md px-2 py-1.5 text-gray-700"
                    aria-label="Filter study sets"
                  >
                    {filterTabs.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.label}
                      </option>
                    ))}
                  </select>
                </div>
                {props.showImportPublic && props.onImportPublic && (
                  <button
                    type="button"
                    onClick={props.onImportPublic}
                    className="hidden sm:inline-flex items-center px-3 py-2 rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 text-sm"
                  >
                    Add Public Set
                  </button>
                )}
                <button
                  type="button"
                  onClick={props.onCreateSet}
                  className="study-btn inline-flex items-center gap-1 pl-2.5 pr-3 py-2 border border-study-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-study-accent text-sm font-semibold"
                  title="Create New Set"
                >
                  <PlusIcon className="w-5 h-5 shrink-0" strokeWidth={2.25} />
                  <span>Create Set</span>
                </button>
              </>
            )}

            {props.variant === "session" && (
              <button
                type="button"
                onClick={props.onEndSession}
                className="inline-flex items-center px-3 py-2 rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium"
              >
                End Session
              </button>
            )}

            {props.variant === "editor" && (
              <button
                type="button"
                onClick={props.onSave}
                disabled={props.saveDisabled}
                className="study-btn inline-flex items-center justify-center px-3 py-2 border border-study-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Save
              </button>
            )}

            <UserAccountMenu
              onSignInClick={onSignInClick}
              onRegisterClick={onRegisterClick}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
