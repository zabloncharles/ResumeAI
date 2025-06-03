import { useState, useEffect } from "react";
import {
  HomeIcon,
  DocumentIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import bunny1 from "../bunny1.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Get user's first name from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFirstName(
            userData.firstName || user.displayName?.split(" ")[0] || ""
          );
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed w-full top-0 bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <img src={bunny1} alt="Brightfolio Logo" className="h-8 w-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#16aeac] to-black bg-clip-text text-transparent">
                Brightfolio
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
            <Link
              to="/"
              className={`text-gray-600 hover:text-gray-900 flex items-center space-x-2 ${
                isActive("/") ? "font-bold border-b-2 border-blue-500" : ""
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link
              to="/resume"
              className={`text-gray-600 hover:text-gray-900 flex items-center space-x-2 ${
                isActive("/resume")
                  ? "font-bold border-b-2 border-blue-500"
                  : ""
              }`}
            >
              <DocumentIcon className="h-5 w-5" />
              <span>Resume</span>
            </Link>
            <Link
              to="/courses"
              className={`text-gray-600 hover:text-gray-900 flex items-center space-x-2 ${
                isActive("/courses")
                  ? "font-bold border-b-2 border-blue-500"
                  : ""
              }`}
            >
              <DocumentTextIcon className="h-5 w-5" />
              <span>Career Path</span>
            </Link>
            <Link
              to="/jobs"
              className={`text-gray-600 hover:text-gray-900 flex items-center space-x-2 ${
                isActive("/jobs") ? "font-bold border-b-2 border-blue-500" : ""
              }`}
            >
              <BriefcaseIcon className="h-5 w-5" />
              <span>Jobs</span>
            </Link>
            <Link
              to="/news"
              className={`text-gray-600 hover:text-gray-900 flex items-center space-x-2 ${
                isActive("/news") ? "font-bold border-b-2 border-blue-500" : ""
              }`}
            >
              <NewspaperIcon className="h-5 w-5" />
              <span>News</span>
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
              <span>🌐</span>
              <span>English</span>
            </button>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">
                  Hi, {firstName}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                      <Link
                        to="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Account Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/signin"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/signin?register=true"
                  className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
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
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className={`block px-3 py-2 text-gray-600 hover:text-gray-900 ${
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
              className={`block px-3 py-2 text-gray-600 hover:text-gray-900 ${
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
              to="/courses"
              className={`block px-3 py-2 text-gray-600 hover:text-gray-900 ${
                isActive("/courses")
                  ? "font-bold border-l-2 border-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5" />
                <span>Career Path</span>
              </div>
            </Link>
            <Link
              to="/jobs"
              className={`block px-3 py-2 text-gray-600 hover:text-gray-900 ${
                isActive("/jobs") ? "font-bold border-l-2 border-blue-500" : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <BriefcaseIcon className="h-5 w-5" />
                <span>Jobs</span>
              </div>
            </Link>
            <Link
              to="/news"
              className={`block px-3 py-2 text-gray-600 hover:text-gray-900 ${
                isActive("/news") ? "font-bold border-l-2 border-blue-500" : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <NewspaperIcon className="h-5 w-5" />
                <span>News</span>
              </div>
            </Link>
            <div className="pt-4 flex flex-col space-y-4">
              <button className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                <span>🌐</span>
                <span>English</span>
              </button>
              {user ? (
                <>
                  <span className="text-gray-700 font-medium px-3">
                    Hi, {firstName}
                  </span>
                  <Link
                    to="/account"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Account Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="text-gray-600 hover:text-gray-900 px-3"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signin?register=true"
                    className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors mx-3"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
