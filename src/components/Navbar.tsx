import { useState, useEffect } from "react";
import {
  HomeIcon,
  DocumentIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import bunny1 from "../bunny1.png";
import SignInModal from "./SignInModal";
import UserAccountMenu, {
  signOutAndClearSession,
  useUserProfile,
} from "./UserAccountMenu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { firstName, isAdmin } = useUserProfile();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signIn" | "register">(
    "signIn"
  );

  const openAuthModal = (mode: "signIn" | "register") => {
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

  const handleSignOut = async () => {
    try {
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

  return (
    <nav className="fixed w-full top-0 bg-white/80 dark:bg-zinc-950/90 z-50 border-b border-gray-100 dark:border-zinc-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img src={bunny1} alt="Brightfolio Logo" className="h-8 w-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#16aeac] to-black dark:to-white bg-clip-text text-transparent">
                Brightfolio
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
            <Link
              to="/"
              className={`text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center space-x-2 ${
                isActive("/") ? "font-bold border-b-2 border-blue-500" : ""
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link
              to="/resume"
              className={`text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center space-x-2 ${
                isActive("/resume")
                  ? "font-bold border-b-2 border-blue-500"
                  : ""
              }`}
            >
              <DocumentIcon className="h-5 w-5" />
              <span>Resume</span>
            </Link>
            <Link
              to="/cover-letter"
              className={`text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center space-x-2 ${
                isActive("/cover-letter")
                  ? "font-bold border-b-2 border-blue-500"
                  : ""
              }`}
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span>Cover Letter</span>
            </Link>
            <Link
              to="/study"
              className={`text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center space-x-2 ${
                isActive("/study") ? "font-bold border-b-2 border-blue-500" : ""
              }`}
            >
              <AcademicCapIcon className="h-5 w-5" />
              <span>Study</span>
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center space-x-1">
              <span>🌐</span>
              <span>English</span>
            </button>
            <UserAccountMenu
              onSignInClick={() => openAuthModal("signIn")}
              onRegisterClick={() => openAuthModal("register")}
            />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
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

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className={`block px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100 ${
                isActive("/") ? "font-bold border-l-2 border-blue-500" : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <HomeIcon className="h-5 w-5" />
                <span>Home</span>
              </div>
            </Link>
            <Link
              to="/resume"
              className={`block px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100 ${
                isActive("/resume")
                  ? "font-bold border-l-2 border-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <DocumentIcon className="h-5 w-5" />
                <span>Resume</span>
              </div>
            </Link>
            <Link
              to="/cover-letter"
              className={`block px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100 ${
                isActive("/cover-letter")
                  ? "font-bold border-l-2 border-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5" />
                <span>Cover Letter</span>
              </div>
            </Link>
            <Link
              to="/study"
              className={`block px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-zinc-300 dark:hover:text-zinc-100 ${
                isActive("/study") ? "font-bold border-l-2 border-blue-500" : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <AcademicCapIcon className="h-5 w-5" />
                <span>Study</span>
              </div>
            </Link>
            <div className="pt-4 flex flex-col space-y-4">
              <button className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center space-x-1">
                <span>🌐</span>
                <span>English</span>
              </button>
              {user ? (
                <>
                  <span className="text-gray-700 font-medium px-3">
                    Hi, {firstName}
                  </span>
                  <div className="py-1">
                    {isAdmin && (
                      <Link
                        to="/dashboard"
                        className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link
                      to="/account"
                      className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                    >
                      Account Settings
                    </Link>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal("signIn")}
                    className="text-gray-600 hover:text-gray-900 px-3"
                  >
                    Sign In
                  </button>
                  <button
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

      {/* Sign In Modal */}
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
