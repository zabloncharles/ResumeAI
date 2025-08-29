import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

const AccountSettings = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    state: "",
    zip: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [user, setUser] = useState<User | null>(null);
  const [apiUsage, setApiUsage] = useState<{
    callCount: number;
    totalTokens: number;
    lastUsed: string;
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsLoading(false);
    } else {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          localStorage.setItem("user", JSON.stringify(firebaseUser));
        } else {
          // Redirect to landing page if not authenticated
          navigate("/");
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [navigate]);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      setLoadingUsage(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserType(data.type || "free");
          setApiUsage({
            callCount: data.callCount || 0,
            totalTokens: data.totalTokens || 0,
            lastUsed: data.lastUsed || "-",
          });
          setFormData((prev) => ({
            ...prev,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            state: data.state || "",
            zip: data.zip || "",
          }));
          localStorage.setItem("userData", JSON.stringify(data));
        } else {
          setUserType("free");
          setApiUsage({ callCount: 0, totalTokens: 0, lastUsed: "-" });
        }
      } catch (e) {
        setUserType("free");
        setApiUsage({ callCount: 0, totalTokens: 0, lastUsed: "-" });
      }
      setLoadingUsage(false);
    };
    fetchUsage();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      localStorage.removeItem("userData");
      localStorage.removeItem("resume");
      // Add any other keys you use for sensitive data here
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-8 bg-gradient-to-r from-green-500 to-black text-transparent bg-clip-text">
            Account Settings
          </h1>

          {/* Personal Information Section */}
          <div className="bg-white/80 backdrop-blur-md shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Personal Information
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 h-10 pl-4"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 h-10 pl-4"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 h-10 pl-4"
                  />
                </div>
                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700"
                  >
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    id="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 h-10 pl-4"
                  />
                </div>
                <div>
                  <label
                    htmlFor="zip"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Zip
                  </label>
                  <input
                    type="text"
                    name="zip"
                    id="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 h-10 pl-4"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 h-10 pl-4"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md bg-gradient-to-r from-green-500 to-yellow-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-green-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Account Usage Section */}
          <div className="bg-white/80 backdrop-blur-md shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Usage
            </h2>
            {loadingUsage ? (
              <div className="text-gray-500">Loading usage data...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Total API Calls</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-yellow-500 text-transparent bg-clip-text">
                    {apiUsage?.callCount ?? 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Total Tokens Used</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-yellow-500 text-transparent bg-clip-text">
                    {apiUsage?.totalTokens?.toLocaleString?.() ?? 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Last Used</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-yellow-500 text-transparent bg-clip-text">
                    {apiUsage?.lastUsed ?? "-"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* App Settings Section */}
          <div className="bg-white/80 backdrop-blur-md shadow rounded-lg p-6 mb-6">
            <h2
              className="text-xl font-semibold text-gray-900 mb-4 cursor-pointer select-none flex items-center justify-between"
              onClick={() => setIsAppSettingsOpen((open) => !open)}
            >
              App Settings
              <span
                className="ml-2 transition-transform duration-200"
                style={{
                  transform: isAppSettingsOpen
                    ? "rotate(90deg)"
                    : "rotate(0deg)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </h2>
            <p className="text-sm text-gray-500 mb-4 -mt-2">
              Manage advanced features and preferences for your account.
            </p>
            {isAppSettingsOpen && (
              <div className="space-y-4">
                {/* Dashboard button for admin only */}
                {userType === "admin" && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        Dashboard
                      </h3>
                      <p className="text-sm text-gray-500">
                        Access the admin dashboard for advanced analytics and
                        management.
                      </p>
                    </div>
                    <button
                      className="inline-flex justify-center rounded-md bg-gradient-to-r from-green-500 to-yellow-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-green-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm"
                      onClick={() => navigate("/dashboard")}
                    >
                      Dashboard
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive updates about your account activity
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-yellow-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      Dark Mode
                    </h3>
                    <p className="text-sm text-gray-500">
                      Switch between light and dark theme
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-yellow-500"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Section */}
          <div className="bg-white/80 backdrop-blur-md shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sign Out
            </h2>
            <p className="text-gray-600 mb-4">
              Sign out of your account. You can sign back in at any time.
            </p>
            <button
              onClick={handleSignOut}
              className="inline-flex justify-center rounded-md bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
