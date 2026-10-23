import { Link } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/outline";
import UserAccountMenu from "../UserAccountMenu";
import BrandMark from "../BrandMark";

type AdminTopBarProps = {
  title?: string;
  description?: string;
  onMenuClick: () => void;
};

export default function AdminTopBar({
  title,
  description,
  onMenuClick,
}: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[5.5rem] shrink-0 items-center gap-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 px-4 lg:px-6">
      <div className="flex items-center gap-2 min-w-0 flex-1">
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
          className="lg:hidden flex items-center shrink-0 rounded-lg hover:opacity-90 transition-opacity"
          aria-label="Brightfolio home"
        >
          <BrandMark
            logoClassName="h-9 w-auto"
            nameClassName="text-base hidden sm:inline"
          />
        </Link>

        {title ? (
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-zinc-100 truncate">
              {title}
            </h1>
            {description ? (
              <p className="text-sm text-gray-600 dark:text-zinc-400 truncate">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <UserAccountMenu className="hidden sm:flex shrink-0" />
    </header>
  );
}
