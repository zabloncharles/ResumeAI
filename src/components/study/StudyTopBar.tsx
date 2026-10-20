import { Link } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Bars3Icon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import UserAccountMenu from "../UserAccountMenu";
import bunny1 from "../../bunny1.png";

type StudyTopBarPageHeader = {
  title: string;
  description?: string;
  onBack: () => void;
};

type StudyTopBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateSet: () => void;
  onMenuClick: () => void;
  searchPlaceholder?: string;
  pageHeader?: StudyTopBarPageHeader;
};

export default function StudyTopBar({
  searchQuery,
  onSearchChange,
  onCreateSet,
  onMenuClick,
  searchPlaceholder = "Search for flashcards",
  pageHeader,
}: StudyTopBarProps) {
  const focused = Boolean(pageHeader);

  return (
    <header className="sticky top-0 z-30 flex h-[5.5rem] shrink-0 items-center gap-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 px-4 lg:px-6">
      <div className="flex items-center gap-2 min-w-0 flex-1 lg:flex-initial">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 shrink-0"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {pageHeader ? (
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={pageHeader.onBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Back to Study"
            >
              <ChevronLeftIcon className="h-6 w-6" strokeWidth={2} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-zinc-100 truncate">
                {pageHeader.title}
              </h1>
              {pageHeader.description ? (
                <p className="text-sm text-gray-600 dark:text-zinc-400 truncate">
                  {pageHeader.description}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {!focused ? (
        <div className="relative w-full min-w-[9rem] max-w-[11rem] sm:max-w-xs md:max-w-sm shrink-0">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full min-w-0 pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 border-0 rounded-full text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-study-accent"
            aria-label="Search"
          />
        </div>
      ) : null}

      {!focused ? <div className="flex-1 min-w-0" aria-hidden /> : null}

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <Link
          to="/"
          className="lg:hidden flex items-center gap-2 shrink-0 min-w-0 rounded-lg hover:opacity-90 transition-opacity"
          aria-label="Brightfolio home"
        >
          <img src={bunny1} alt="" className="h-9 w-9 shrink-0" />
          <span className="hidden sm:inline text-base font-bold bg-gradient-to-r from-[#16aeac] to-black dark:to-white bg-clip-text text-transparent truncate">
            Brightfolio
          </span>
        </Link>

        {!focused ? (
          <button
            type="button"
            onClick={onCreateSet}
            aria-label="Create set"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-study-accent hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-study-accent focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
          >
            <PlusIcon className="h-6 w-6 shrink-0" strokeWidth={2.25} />
          </button>
        ) : null}

        <UserAccountMenu className="hidden sm:flex shrink-0" />
      </div>
    </header>
  );
}
