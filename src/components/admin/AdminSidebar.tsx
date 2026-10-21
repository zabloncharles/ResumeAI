import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  ChartBarIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  HomeIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import bunny1 from "../../bunny1.png";

type AdminSidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export default function AdminSidebar({
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-[#16aeac]/10 text-[#0f766e] dark:bg-[#16aeac]/15 dark:text-[#5ececc]"
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
          <p className="text-sm text-gray-500 dark:text-zinc-500">Admin</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          Analytics
        </p>
        <Link
          to="/dashboard"
          onClick={onCloseMobile}
          className={navLinkClass(path === "/dashboard")}
        >
          <ChartBarIcon className="h-5 w-5 shrink-0" />
          Dashboard
        </Link>

        <p className="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          Product
        </p>
        <Link
          to="/resume"
          onClick={onCloseMobile}
          className={navLinkClass(path.startsWith("/resume"))}
        >
          <DocumentTextIcon className="h-5 w-5 shrink-0" />
          Resumes
        </Link>
        <Link
          to="/cover-letter"
          onClick={onCloseMobile}
          className={navLinkClass(path === "/cover-letter")}
        >
          <EnvelopeIcon className="h-5 w-5 shrink-0" />
          Cover letters
        </Link>
        <Link
          to="/study"
          onClick={onCloseMobile}
          className={navLinkClass(
            path.startsWith("/study") || path === "/podcast"
          )}
        >
          <AcademicCapIcon className="h-5 w-5 shrink-0" />
          Study
        </Link>

        <p className="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          Account
        </p>
        <Link
          to="/account"
          onClick={onCloseMobile}
          className={navLinkClass(path === "/account")}
        >
          <Cog6ToothIcon className="h-5 w-5 shrink-0" />
          Settings
        </Link>
        <Link
          to="/"
          onClick={onCloseMobile}
          className={navLinkClass(false)}
        >
          <HomeIcon className="h-5 w-5 shrink-0" />
          Marketing home
        </Link>
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
        className={`fixed lg:sticky top-0 z-[110] lg:z-auto h-full lg:h-screen w-64 shrink-0 flex flex-col bg-gray-50 dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
