import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export function useUserProfile() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      const cachedUserData = localStorage.getItem("userData");
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData);
          setFirstName(
            userData.firstName || user.displayName?.split(" ")[0] || ""
          );
          setIsAdmin(userData.role === "admin");
          return;
        } catch {
          // fall through
        }
      }

      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFirstName(
              userData.firstName || user.displayName?.split(" ")[0] || ""
            );
            setIsAdmin(userData.role === "admin");
            localStorage.setItem("userData", JSON.stringify(userData));
          } else {
            setFirstName(user.displayName?.split(" ")[0] || "");
            setIsAdmin(false);
          }
        } catch {
          setFirstName(user.displayName?.split(" ")[0] || "");
          setIsAdmin(false);
        }
      };

      fetchUserData();
    } else {
      setFirstName("");
      setIsAdmin(false);
    }
  }, [user]);

  return { user, firstName, isAdmin };
}

export async function signOutAndClearSession(
  navigate: (path: string) => void
) {
  await signOut(auth);
  localStorage.removeItem("user");
  localStorage.removeItem("userData");
  localStorage.removeItem("resume");
  navigate("/");
}

type UserAccountMenuProps = {
  onSignInClick?: () => void;
  onRegisterClick?: () => void;
  className?: string;
};

export default function UserAccountMenu({
  onSignInClick,
  onRegisterClick,
  className = "",
}: UserAccountMenuProps) {
  const { firstName, isAdmin } = useUserProfile();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSettingsOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSettingsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isSettingsOpen]);

  const handleSignOut = async () => {
    try {
      setIsSettingsOpen(false);
      await signOutAndClearSession(navigate);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    if (!onSignInClick && !onRegisterClick) {
      return null;
    }
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        {onSignInClick && (
          <button
            type="button"
            onClick={onSignInClick}
            className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Sign In
          </button>
        )}
        {onRegisterClick && (
          <button
            type="button"
            onClick={onRegisterClick}
            className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            Register
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-gray-700 dark:text-zinc-300 font-medium whitespace-nowrap text-sm">
        Hi, {firstName}
      </span>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
          aria-expanded={isSettingsOpen}
          aria-label="Account menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {isSettingsOpen && (
          <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-zinc-900 rounded-md shadow-lg py-1 ring-1 ring-black/5 dark:ring-white/10 z-50">
            <div className="py-1">
              {isAdmin && (
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/account"
                className="block px-3 py-2 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                onClick={() => setIsSettingsOpen(false)}
              >
                Account Settings
              </Link>
              <button
                type="button"
                onClick={() => toggleTheme()}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <span className="inline-flex items-center gap-2">
                  {theme === "dark" ? (
                    <SunIcon className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <MoonIcon className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                  {theme === "dark" ? "On" : "Off"}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 border-t border-gray-100 dark:border-zinc-800"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
