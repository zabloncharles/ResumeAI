import { Link, useLocation } from "react-router-dom";
import {
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  HomeIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import BrandLogo from "../BrandLogo";

export type ResumeWorkspaceTab = "home" | "help" | "editor" | "coverLetter";

type ResumeSidebarProps = {
  activeTab: ResumeWorkspaceTab;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export default function ResumeSidebar({
  activeTab,
  mobileOpen,
  onCloseMobile,
}: ResumeSidebarProps) {
  const location = useLocation();
  const onEditRoute = location.pathname.startsWith("/resume/edit/");

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
      active
        ? "bg-sky-50 text-sky-900 dark:bg-zinc-800 dark:text-zinc-100"
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
        <BrandLogo className="h-10 w-auto" alt="" />
        <div className="min-w-0">
          <p className="text-lg font-bold bg-gradient-to-r from-[#16aeac] to-black dark:to-white bg-clip-text text-transparent truncate">
            Brightfolio
          </p>
          <p className="text-sm text-gray-500 dark:text-zinc-500">Resume</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link
          to="/resume"
          onClick={onCloseMobile}
          className={navLinkClass(activeTab === "home" && !onEditRoute)}
        >
          <HomeIcon className="h-5 w-5 shrink-0" />
          Home
        </Link>
        <Link
          to="/cover-letter"
          onClick={onCloseMobile}
          className={navLinkClass(activeTab === "coverLetter")}
        >
          <EnvelopeIcon className="h-5 w-5 shrink-0" />
          Cover letter
        </Link>
        <Link
          to="/resume/help"
          onClick={onCloseMobile}
          className={navLinkClass(activeTab === "help")}
        >
          <QuestionMarkCircleIcon className="h-5 w-5 shrink-0" />
          Help
        </Link>
        {onEditRoute && (
          <div
            className={`${navLinkClass(activeTab === "editor")} cursor-default`}
            aria-current="page"
          >
            <DocumentTextIcon className="h-5 w-5 shrink-0" />
            Editor
          </div>
        )}
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
