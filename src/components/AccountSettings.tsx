import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { auth, db } from "../firebase";
import {
  signOut,
  onAuthStateChanged,
  deleteUser,
  User,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { useTheme } from "../contexts/ThemeContext";
import { clearDeviceStoredData } from "../utils/accountDeviceData";
import { deleteAllUserFirestoreData } from "../utils/deleteAccountData";
import DeleteAccountConfirmModal from "./DeleteAccountConfirmModal";
import {
  reauthenticateForSensitiveAction,
  userNeedsPasswordReauth,
} from "../utils/reauthenticateUser";

function formatLastUsed(value: unknown): string {
  if (value == null || value === "") return "-";
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toLocaleString();
    }
    return value;
  }
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString();
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds: number }).seconds === "number"
  ) {
    return new Date((value as { seconds: number }).seconds * 1000).toLocaleString();
  }
  return "-";
}

function resolveApiCallCount(data: Record<string, unknown>): number {
  const fromTotal = data.totalApiCalls;
  if (typeof fromTotal === "number" && !Number.isNaN(fromTotal)) {
    return fromTotal;
  }
  const legacy = data.callCount;
  if (typeof legacy === "number" && !Number.isNaN(legacy)) {
    return legacy;
  }
  return 0;
}

const AccountSettings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
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
    totalApiCalls: number;
    totalTokens: number;
    lastUsed: string;
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [isAdvancedPrivacyOpen, setIsAdvancedPrivacyOpen] = useState(false);
  const [privacyActionError, setPrivacyActionError] = useState("");
  const [isClearingDeviceData, setIsClearingDeviceData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountModalError, setDeleteAccountModalError] = useState("");
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileBaseline, setProfileBaseline] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    state: "",
    zip: "",
  });

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
            totalApiCalls: resolveApiCallCount(data),
            totalTokens:
              typeof data.totalTokens === "number" ? data.totalTokens : 0,
            lastUsed: formatLastUsed(data.lastUsed),
          });
          const profile = {
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            state: data.state || "",
            zip: data.zip || "",
          };
          setProfileBaseline(profile);
          setFormData((prev) => ({
            ...prev,
            ...profile,
          }));
          localStorage.setItem("userData", JSON.stringify(data));
        } else {
          setUserType("free");
          setApiUsage({ totalApiCalls: 0, totalTokens: 0, lastUsed: "-" });
        }
      } catch (e) {
        setUserType("free");
        setApiUsage({ totalApiCalls: 0, totalTokens: 0, lastUsed: "-" });
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

  const handleCancelProfileEdit = () => {
    setFormData((prev) => ({
      ...prev,
      ...profileBaseline,
    }));
    setProfileSaveError("");
    setIsEditingProfile(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    setProfileSaveError("");
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        state: formData.state.trim(),
        zip: formData.zip.trim(),
      };
      await updateDoc(doc(db, "users", user.uid), payload);
      setProfileBaseline(payload);
      setFormData((prev) => ({ ...prev, ...payload }));
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...payload, uid: user.uid })
      );
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setProfileSaveError("Could not save your profile. Try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const displayProfileValue = (value: string) =>
    value.trim() ? value : "—";

  const handleClearDeviceData = async () => {
    const confirmed = window.confirm(
      "Clear cached resumes, study drafts, and other data stored on this device? Your online account and saved content will not be deleted. Your theme preference is kept."
    );
    if (!confirmed) return;

    setPrivacyActionError("");
    setIsClearingDeviceData(true);
    try {
      clearDeviceStoredData();
      window.location.reload();
    } catch {
      setPrivacyActionError("Could not clear device data. Try again.");
    } finally {
      setIsClearingDeviceData(false);
    }
  };

  const handleConfirmDeleteAccount = async (password?: string) => {
    if (!user || isDeletingAccount) return;

    const authUser = auth.currentUser ?? user;
    setPrivacyActionError("");
    setDeleteAccountModalError("");
    setIsDeletingAccount(true);
    try {
      await reauthenticateForSensitiveAction(authUser, password);

      const uid = authUser.uid;
      await deleteAllUserFirestoreData(uid);
      clearDeviceStoredData();
      await deleteUser(auth.currentUser ?? authUser);
      setShowDeleteAccountModal(false);
      navigate("/");
    } catch (error: unknown) {
      const code =
        error &&
        typeof error === "object" &&
        "code" in error &&
        typeof (error as { code: string }).code === "string"
          ? (error as { code: string }).code
          : "";

      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        setDeleteAccountModalError(
          "Confirmation was cancelled. Your account was not deleted."
        );
        return;
      }

      if (
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setDeleteAccountModalError("Incorrect password. Try again.");
        return;
      }

      setShowDeleteAccountModal(false);
      if (code === "auth/requires-recent-login") {
        setPrivacyActionError(
          "We could not verify your sign-in. Try again or sign out and back in, then retry."
        );
      } else {
        console.error("Account deletion failed:", error);
        setPrivacyActionError(
          "Could not delete your account. Some data may have been removed—contact support if this persists."
        );
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const deleteModalAuthUser = auth.currentUser ?? user;
  const deleteRequiresPassword = deleteModalAuthUser
    ? userNeedsPasswordReauth(deleteModalAuthUser)
    : false;
  const deleteUsesGoogle = deleteModalAuthUser
    ? deleteModalAuthUser.providerData.some(
        (p) => p.providerId === "google.com"
      )
    : false;

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
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const settingsCardClass =
    "bg-white/80 dark:bg-zinc-950/90 backdrop-blur-md shadow rounded-lg border border-transparent dark:border-zinc-800 p-6 mb-6";
  const settingsHeadingClass =
    "text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-4";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-zinc-300";
  const inputClass =
    "mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 shadow-sm focus:border-green-500 focus:ring-green-500 h-10 pl-4";
  const subheadingClass =
    "text-base font-medium text-gray-900 dark:text-zinc-100";
  const subtextClass = "text-sm text-gray-500 dark:text-zinc-400";
  const toggleTrackClass =
    "w-11 h-6 bg-gray-200 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 dark:peer-focus:ring-green-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-yellow-500";
  const primaryButtonClass =
    "inline-flex justify-center rounded-md bg-gradient-to-r from-green-500 to-yellow-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-green-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  const secondaryButtonClass =
    "inline-flex justify-center rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2 text-base font-medium text-gray-700 dark:text-zinc-200 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 sm:text-sm disabled:opacity-50";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-8 bg-gradient-to-r from-green-500 to-black dark:to-white text-transparent bg-clip-text">
            Account Settings
          </h1>

          {/* Personal Information Section */}
          <div className={settingsCardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h2 className={`${settingsHeadingClass} mb-0`}>
                Personal Information
              </h2>
              {!isEditingProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    setProfileSaveError("");
                    setIsEditingProfile(true);
                  }}
                  className="text-sm font-semibold text-[#16aeac] hover:opacity-80 shrink-0"
                >
                  Edit profile information
                </button>
              ) : null}
            </div>

            {!isEditingProfile ? (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <div>
                  <dt className={labelClass}>First Name</dt>
                  <dd className="mt-1 text-gray-900 dark:text-zinc-100">
                    {displayProfileValue(formData.firstName)}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Last Name</dt>
                  <dd className="mt-1 text-gray-900 dark:text-zinc-100">
                    {displayProfileValue(formData.lastName)}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Phone</dt>
                  <dd className="mt-1 text-gray-900 dark:text-zinc-100">
                    {displayProfileValue(formData.phone)}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>State</dt>
                  <dd className="mt-1 text-gray-900 dark:text-zinc-100">
                    {displayProfileValue(formData.state)}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Zip</dt>
                  <dd className="mt-1 text-gray-900 dark:text-zinc-100">
                    {displayProfileValue(formData.zip)}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Email Address</dt>
                  <dd className="mt-1 text-gray-900 dark:text-zinc-100 break-all">
                    {displayProfileValue(formData.email)}
                  </dd>
                </div>
              </dl>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className={labelClass}>
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelClass}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className={labelClass}>
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      id="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="zip" className={labelClass}>
                      Zip
                    </label>
                    <input
                      type="text"
                      name="zip"
                      id="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
                {profileSaveError ? (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {profileSaveError}
                  </p>
                ) : null}
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelProfileEdit}
                    disabled={isSavingProfile}
                    className={secondaryButtonClass}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className={primaryButtonClass}
                  >
                    {isSavingProfile ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Usage Section */}
          <div className={settingsCardClass}>
            <h2 className={settingsHeadingClass}>Account Usage</h2>
            {loadingUsage ? (
              <div className="text-gray-500 dark:text-zinc-400">
                Loading usage data...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-zinc-900/80 border border-transparent dark:border-zinc-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-zinc-400">
                    Total API Calls
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-yellow-500 dark:from-green-400 dark:to-yellow-400 text-transparent bg-clip-text">
                    {apiUsage?.totalApiCalls ?? 0}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-900/80 border border-transparent dark:border-zinc-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-zinc-400">
                    Total Tokens Used
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-yellow-500 dark:from-green-400 dark:to-yellow-400 text-transparent bg-clip-text">
                    {apiUsage?.totalTokens?.toLocaleString?.() ?? 0}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-900/80 border border-transparent dark:border-zinc-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-zinc-400">
                    Last Used
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-zinc-100 break-words">
                    {apiUsage?.lastUsed ?? "-"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* App Settings Section */}
          <div className={settingsCardClass}>
            <h2
              className={`${settingsHeadingClass} cursor-pointer select-none flex items-center justify-between mb-0`}
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
                  className="text-gray-500 dark:text-zinc-400"
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
            <p className={`${subtextClass} mb-4 mt-4`}>
              Manage advanced features and preferences for your account.
            </p>
            {isAppSettingsOpen && (
              <div className="space-y-4 border-t border-gray-100 dark:border-zinc-800 pt-4">
                {userType === "admin" && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className={subheadingClass}>Dashboard</h3>
                      <p className={subtextClass}>
                        Access the admin dashboard for advanced analytics and
                        management.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={() => navigate("/dashboard")}
                    >
                      Dashboard
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className={subheadingClass}>Email Notifications</h3>
                    <p className={subtextClass}>
                      Receive updates about your account activity
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className={toggleTrackClass} />
                  </label>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className={subheadingClass}>Dark Mode</h3>
                    <p className={subtextClass}>
                      Switch between light and dark theme
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={theme === "dark"}
                      onChange={(e) =>
                        setTheme(e.target.checked ? "dark" : "light")
                      }
                    />
                    <div className={toggleTrackClass} />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className={settingsCardClass}>
            <h2
              className={`${settingsHeadingClass} cursor-pointer select-none flex items-center justify-between mb-0`}
              onClick={() => {
                setIsAdvancedPrivacyOpen((open) => !open);
                setPrivacyActionError("");
              }}
            >
              Advanced &amp; privacy
              <span
                className="ml-2 transition-transform duration-200"
                style={{
                  transform: isAdvancedPrivacyOpen
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
                  className="text-gray-500 dark:text-zinc-400"
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
            <p className={`${subtextClass} mb-4 mt-4`}>
              What we store and how to remove data from this device or your
              account.
            </p>
            {isAdvancedPrivacyOpen && (
              <div className="space-y-6 border-t border-gray-100 dark:border-zinc-800 pt-4">
                <div>
                  <h3 className={subheadingClass}>Data we may collect</h3>
                  <ul className={`${subtextClass} mt-2 list-disc pl-5 space-y-2`}>
                    <li>
                      <span className="text-gray-800 dark:text-zinc-200">
                        Account profile
                      </span>{" "}
                      — name, email, phone, and location details you choose to
                      save with your account.
                    </li>
                    <li>
                      <span className="text-gray-800 dark:text-zinc-200">
                        Resumes &amp; cover letters
                      </span>{" "}
                      — content you create, saved to your account when you save
                      or sync; drafts may also be kept on this device.
                    </li>
                    <li>
                      <span className="text-gray-800 dark:text-zinc-200">
                        Study sets
                      </span>{" "}
                      — titles, flashcards, folders, and sharing settings tied
                      to your account.
                    </li>
                    <li>
                      <span className="text-gray-800 dark:text-zinc-200">
                        AI usage
                      </span>{" "}
                      — basic usage stats (such as how often you use AI tools)
                      to run the product fairly and show activity on your
                      account.
                    </li>
                    <li>
                      <span className="text-gray-800 dark:text-zinc-200">
                        This device
                      </span>{" "}
                      — theme preference and temporary caches or drafts so the
                      app works offline or after a refresh. We do not use
                      advertising cookies. See our{" "}
                      <Link
                        to="/privacy"
                        className="text-[#16aeac] hover:opacity-80 underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </li>
                  </ul>
                </div>

                {privacyActionError ? (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {privacyActionError}
                  </p>
                ) : null}

                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleClearDeviceData}
                    disabled={isClearingDeviceData || isDeletingAccount}
                    className={secondaryButtonClass}
                  >
                    {isClearingDeviceData ? "Clearing…" : "Clear data on this device"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrivacyActionError("");
                      setDeleteAccountModalError("");
                      setShowDeleteAccountModal(true);
                    }}
                    disabled={isDeletingAccount || isClearingDeviceData}
                    className="inline-flex justify-center rounded-md bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingAccount ? "Deleting account…" : "Delete account"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Section */}
          <div className={`${settingsCardClass} mb-0`}>
            <h2 className={settingsHeadingClass}>Sign Out</h2>
            <p className={`${subtextClass} mb-4`}>
              Sign out of your account. You can sign back in at any time.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex justify-center rounded-md bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 sm:text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <DeleteAccountConfirmModal
        isOpen={showDeleteAccountModal}
        confirming={isDeletingAccount}
        requiresPassword={deleteRequiresPassword}
        usesGoogleSignIn={deleteUsesGoogle}
        errorMessage={deleteAccountModalError}
        onClose={() => {
          if (isDeletingAccount) return;
          setDeleteAccountModalError("");
          setShowDeleteAccountModal(false);
        }}
        onConfirm={handleConfirmDeleteAccount}
      />
    </div>
  );
};

export default AccountSettings;
