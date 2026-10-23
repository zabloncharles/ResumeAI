import { useState, useEffect, useId } from "react";
import {
  HomeIcon,
  DocumentIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SignInModal from "./SignInModal";
import UserAccountMenu, {
  signOutAndClearSession,
  useUserProfile,
} from "./UserAccountMenu";
import BrandMark from "./BrandMark";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: HomeIcon },
  { path: "/study", label: "Study", icon: AcademicCapIcon },
  { path: "/resume", label: "Resume", icon: DocumentIcon },
  { path: "/cover-letter", label: "Cover Letter", icon: DocumentTextIcon },
] as const;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const mobileMenuId = useId();
  const { user } = useAuth();
  const { firstName, isAdmin } = useUserProfile();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signIn" | "register">(
    "signIn"
  );

  const openAuthModal = (mode: "signIn" | "register") => {
    setIsOpen(false);
    setAuthModalMode(mode);
    setShowSignInModal(true);
  };

  const closeAuthModal = () => {
    setShowSignInModal(false);
    setAuthModalMode("signIn");
  };
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        })
      );
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("userData");
    }
  }, [user]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      setIsOpen(false);
      await signOutAndClearSession(navigate);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => {
    if (path === "/resume") {
      return location.pathname.startsWith("/resume");
    }
    return location.pathname === path;
  };

  const closeMobileMenu = () => setIsOpen(false);

  return (
    <nav className="fixed w-full top-0 bg-white/80 dark:bg-zinc-950/90 z-50 border-b border-gray-100 dark:border-zinc-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="Brightfolio home"
            >
              <BrandMark />
            </Link>
          </div>

          <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center space-x-2 ${
                  isActive(path) ? "font-bold border-b-2 border-blue-500" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <UserAccountMenu
              onSignInClick={() => openAuthModal("signIn")}
              onRegisterClick={() => openAuthModal("register")}
            />
          </div>

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              aria-expanded={isOpen}
              aria-controls={mobileMenuId}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <span className="sr-only">
                {isOpen ? "Close main menu" : "Open main menu"}
              </span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          id={mobileMenuId}
          className="md:hidden bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={closeMobileMenu}
                className={`block px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100 ${
                  isActive(path) ? "font-bold border-l-2 border-blue-500" : ""
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </div>
              </Link>
            ))}
            <div className="pt-4 flex flex-col space-y-2 border-t border-gray-100 dark:border-zinc-800">
              {user ? (
                <>
                  <span className="text-gray-700 dark:text-zinc-200 font-medium px-3 pt-2">
                    Hi, {firstName}
                  </span>
                  {isAdmin && (
                    <Link
                      to="/dashboard"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/account"
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                  >
                    Account Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal("signIn")}
                    className="text-left text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100 px-3 py-2"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal("register")}
                    className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors mx-3"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <SignInModal
        key={showSignInModal ? authModalMode : "closed"}
        isOpen={showSignInModal}
        initialMode={authModalMode}
        onClose={closeAuthModal}
        onSuccess={closeAuthModal}
      />
    </nav>
  );
};

export default Navbar;
