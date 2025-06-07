import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  where,
  setDoc,
  increment,
} from "firebase/firestore";
import Navbar from "./Navbar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Globe from "react-globe.gl";
import MeditationStatsCard from "./MeditationStatsCard";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLogin: string;
  totalResumes: number;
  totalApiCalls: number;
  totalTokens: number;
  location: string;
  type: "admin" | "free" | "paid";
  state: string;
}

interface ActivityStats {
  totalUsers: number;
  totalResumes: number;
  resumesThisWeek: number;
}

interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

const Dashboard = () => {
  console.log("Dashboard component rendered");
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalResumes, setTotalResumes] = useState(0);
  const [totalApiCalls, setTotalApiCalls] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    totalUsers: 0,
    totalResumes: 0,
    resumesThisWeek: 0,
  });
  const [coverLettersThisWeek, setCoverLettersThisWeek] = useState(0);
  const [totalPaths, setTotalPaths] = useState(0);
  const [recentPathProfessions, setRecentPathProfessions] = useState<string[]>(
    []
  );
  const [recentUsers, setRecentUsers] = useState<UserData[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserData[]>([]);
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [locationArcs, setLocationArcs] = useState<any[]>([]);
  const [topStates, setTopStates] = useState<
    { state: string; count: number; percent: number }[]
  >([]);
  const globeRef = useRef<any>(null);
  const navigate = useNavigate();

  // Dynamic data for the chart
  const [profileImpressionData, setProfileImpressionData] = useState([
    { month: "Jan", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Feb", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Mar", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Apr", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "May", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Jun", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Jul", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Aug", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Sep", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Oct", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Nov", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
    { month: "Dec", coverLetter: 0, resume: 0, careerPath: 0, users: 0 },
  ]);

  // State for API calls and tokens per month
  const [apiTokenChartData, setApiTokenChartData] = useState([
    { month: "Jan", apiCalls: 0, tokens: 0 },
    { month: "Feb", apiCalls: 0, tokens: 0 },
    { month: "Mar", apiCalls: 0, tokens: 0 },
    { month: "Apr", apiCalls: 0, tokens: 0 },
    { month: "May", apiCalls: 0, tokens: 0 },
    { month: "Jun", apiCalls: 0, tokens: 0 },
    { month: "Jul", apiCalls: 0, tokens: 0 },
    { month: "Aug", apiCalls: 0, tokens: 0 },
    { month: "Sep", apiCalls: 0, tokens: 0 },
    { month: "Oct", apiCalls: 0, tokens: 0 },
    { month: "Nov", apiCalls: 0, tokens: 0 },
    { month: "Dec", apiCalls: 0, tokens: 0 },
  ]);

  const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser)
          localStorage.setItem("user", JSON.stringify(firebaseUser));
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      // Increment API call count for the user
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(
          userRef,
          {
            totalApiCalls: increment(1),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("[Dashboard] Error incrementing API call count:", error);
      }

      const fetchUserData = async () => {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = {
              id: user.uid,
              email: user.email || "",
              firstName: userSnap.data().firstName || "",
              lastName: userSnap.data().lastName || "",
              createdAt: userSnap.data().createdAt || "",
              lastLogin: userSnap.data().lastLogin || "",
              totalResumes: userSnap.data().totalResumes || 0,
              totalApiCalls: userSnap.data().totalApiCalls || 0,
              totalTokens: userSnap.data().totalTokens || 0,
              location: userSnap.data().location || "",
              type: userSnap.data().type || "free",
              state: userSnap.data().state || "",
            };
            setUserData(userData);
            localStorage.setItem("userData", JSON.stringify(userData));
          }
        } catch (error) {}
      };
      fetchUserData();
    })();
  }, [user]);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ altitude: 10 }, 0);
    }
  }, []);

  // Calculate max value for chart Y-axis based on current state
  const chartMax =
    Math.max(
      ...profileImpressionData.map((d) =>
        Math.max(d.resume, d.coverLetter, d.careerPath)
      ),
      0
    ) + 5;

  console.log(
    "[Dashboard] Render metrics: totalApiCalls:",
    totalApiCalls,
    "totalTokens:",
    totalTokens
  );

  useEffect(() => {
    console.log(
      "[Dashboard] State updated: totalApiCalls:",
      totalApiCalls,
      "totalTokens:",
      totalTokens
    );
  }, [totalApiCalls, totalTokens]);

  // Aggregate API calls and tokens per month after users are loaded
  useEffect(() => {
    // You already have the users array in fetchUsers, so let's aggregate here
    // We'll need to store the users array in state for this
    // For now, let's use recentUsers as a proxy (since it's set to all users in fetchUsers)
    const users = recentUsers.length > 0 ? recentUsers : [];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    // Initialize chart data
    const chartData = months.map((month) => ({
      month,
      apiCalls: 0,
      tokens: 0,
    }));
    users.forEach((user) => {
      // Use createdAt to determine the month
      let createdAt;
      if (
        user.createdAt &&
        typeof user.createdAt === "object" &&
        user.createdAt !== null &&
        typeof (user.createdAt as { toDate?: () => Date }).toDate === "function"
      ) {
        createdAt = (user.createdAt as { toDate: () => Date }).toDate();
      } else {
        createdAt = new Date(user.createdAt as string);
      }
      const m = createdAt.getMonth();
      if (isNaN(m) || m < 0 || m > 11) return;
      chartData[m].apiCalls += user.totalApiCalls || 0;
      chartData[m].tokens += user.totalTokens || 0;
    });
    setApiTokenChartData(chartData);
  }, [recentUsers]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white shadow-lg p-4 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <div className="space-y-2">
            {/* Profile section */}
            <div className="flex flex-col items-center gap-2 mb-8 mt-2">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow">
                {userData?.firstName?.[0] || ""}
                {userData?.lastName?.[0] || ""}
              </div>
              <div className="text-center">
                <div className="text-base font-semibold text-gray-900">
                  {userData
                    ? `${userData.firstName} ${userData.lastName}`
                    : "User"}
                </div>
                {userData?.type === "admin" && (
                  <div className="text-xs font-medium text-indigo-500 mt-1">
                    Admin
                  </div>
                )}
              </div>
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-2 mt-6">
              Menu
            </h3>
            <div className="space-y-2">
              <button
                className="w-full text-left px-4 py-2 rounded-lg bg-green-50 text-green-700"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700">
                Analytics
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700">
                Schedules
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700">
                Communities
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700">
                Settings
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700">
                Archive
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700">
                Help
              </button>
              {/* Connected Accounts */}
              <div className="mt-8 bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                    />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Connected Accounts
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Third-party services linked to your account
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-700">
                      Firebase
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-purple-50">
                    <svg
                      className="w-6 h-6 text-purple-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                    <span className="text-sm font-medium text-purple-700">
                      Netlify
                    </span>
                  </div>
                </div>
              </div>
              {/* Log Out button directly below Connected Accounts */}
              <div className="mt-10">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-2">
                  Log Out
                </h3>
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-base shadow transition-all duration-150"
                  // TODO: Add actual log out logic here if not present
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                    />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main and Right Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
          {/* Middle/Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Resume & Employment Analytics
            </h1>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V7a4 4 0 00-8 0v3m12 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1a2 2 0 012-2h12a2 2 0 012 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total Users
                  </h3>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  {totalUsers}
                </p>
                <p className="text-xs text-gray-500">
                  All registered users on the platform
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total Resumes
                  </h3>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {totalResumes}
                </p>
                <p className="text-xs text-gray-500">
                  Resumes created by all users
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-6 h-6 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m4 4h-1v-4h-1m-4 4h-1v-4H7"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total API Calls
                  </h3>
                </div>
                <p className="text-3xl font-bold text-indigo-600 mb-1">
                  {totalApiCalls}
                </p>
                <p className="text-xs text-gray-500">
                  API requests made by all users
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-6 h-6 text-pink-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total Tokens
                  </h3>
                </div>
                <p className="text-3xl font-bold text-pink-600 mb-1">
                  {totalTokens}
                </p>
                <p className="text-xs text-gray-500">
                  Tokens used by all users
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-6 h-6 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 17l4 4 4-4m0-5V3m-8 4h8"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Resumes This Week
                  </h3>
                </div>
                <p className="text-3xl font-bold text-orange-600 mb-1">
                  {activityStats.resumesThisWeek}
                </p>
                <p className="text-xs text-gray-500">
                  New resumes created in the last 7 days
                </p>
              </div>
            </div>

            {/* Spinning Globe User Locations */}
            <div className="bg-white rounded-xl shadow p-6 mb-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Job Seeker Locations
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Where are users creating resumes?
              </p>
              <div className="flex gap-8">
                {/* Globe Section */}
                <div className="w-1/2">
                  <div
                    style={{
                      width: "100%",
                      height: 300,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Globe
                      ref={globeRef}
                      globeImageUrl="//unpkg.com/three-globe/example/img/earth-water.png"
                      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                      pointsData={userLocations.map((loc) => ({
                        lat: loc.lat,
                        lng: loc.lng,
                        name: loc.name,
                        color: "#ef4444", // Keep points red for consistency
                        size: 0.8,
                        altitude: 0.1,
                      }))}
                      arcsData={locationArcs}
                      arcColor="color"
                      arcAltitude={0.3}
                      arcStroke={0.5}
                      arcDashLength={0.4}
                      arcDashGap={0.2}
                      arcDashAnimateTime={2000}
                      arcLabel={(arcObj: any) => {
                        const { startLat, startLng, endLat, endLng } =
                          arcObj || {};
                        const start = userLocations.find(
                          (loc) => loc.lat === startLat && loc.lng === startLng
                        );
                        const end = userLocations.find(
                          (loc) => loc.lat === endLat && loc.lng === endLng
                        );
                        return `${start?.name ?? ""} → ${end?.name ?? ""}`;
                      }}
                      pointLat="lat"
                      pointLng="lng"
                      pointColor="color"
                      pointAltitude="altitude"
                      pointRadius="size"
                      pointLabel="name"
                      backgroundColor="#ffffff"
                      animateIn={true}
                      atmosphereColor="#6366f1"
                      atmosphereAltitude={0.1}
                      pointsMerge={false}
                      pointsTransitionDuration={1000}
                      onPointClick={(point) => {
                        console.log("Clicked point:", point);
                      }}
                      onPointHover={(point) => {
                        if (point) {
                          document.body.style.cursor = "pointer";
                        } else {
                          document.body.style.cursor = "default";
                        }
                      }}
                    />
                  </div>
                </div>

                {/* User Stats Section */}
                <div className="w-1/2">
                  <div className="space-y-6 h-[300px] overflow-y-auto pr-2">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Total Active Users
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {totalUsers}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Across 6 continents
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <svg
                          className="w-4 h-4 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Top Locations
                      </h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {userLocations.map((location, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-blue-100"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-sm">
                                <span className="text-sm font-medium text-blue-600">
                                  {location.name?.split(" ")[1] || "U"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {location.name}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                  </svg>
                                  {location.lat.toFixed(2)}°N,{" "}
                                  {location.lng.toFixed(2)}°E
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                                <p className="text-sm font-medium text-gray-900">
                                  1 user
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {userLocations.length === 0 && (
                        <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl border border-gray-100">
                          <svg
                            className="w-12 h-12 mx-auto text-gray-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          <p className="text-sm font-medium">
                            No location data available
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Users haven't shared their locations yet
                          </p>
                        </div>
                      )}
                      {/* Top Locations (States) Section - moved here */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4 mt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-5 h-5 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          <h3 className="text-md font-semibold text-gray-900">
                            Top Locations
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          States with the most active users
                        </p>
                        <div className="space-y-3">
                          {topStates.map((item, idx) => (
                            <div
                              key={item.state}
                              className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                            >
                              <div
                                className={`h-7 w-7 rounded-full flex items-center justify-center ${
                                  idx === 0
                                    ? "bg-blue-100"
                                    : idx === 1
                                    ? "bg-green-100"
                                    : "bg-yellow-100"
                                }`}
                              >
                                <span
                                  className={`text-xs font-medium ${
                                    idx === 0
                                      ? "text-blue-600"
                                      : idx === 1
                                      ? "text-green-600"
                                      : "text-yellow-600"
                                  }`}
                                >
                                  {item.state.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-gray-900 flex-1 ml-2">
                                {item.state}
                              </span>
                              <span className="text-xs text-gray-500">
                                {item.percent}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Impression Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-4">
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center space-x-6">
                  <span className="flex items-center space-x-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 17l4 4 4-4m0-5V3m-8 4h8"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      Resume Creations
                    </span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      Cover Letter Creations
                    </span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      Applications Sent
                    </span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      Users Created
                    </span>
                  </span>
                </div>
                <select className="text-sm border-gray-200 rounded-md bg-gray-50">
                  <option>Past Year</option>
                  <option>Past 6 Months</option>
                  <option>Past Month</option>
                </select>
              </div>
              <div className="relative z-10">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={profileImpressionData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    barCategoryGap={16}
                  >
                    <defs>
                      <linearGradient
                        id="coverLetterGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#fdba74" />
                        <stop offset="100%" stopColor="#fb923c" />
                      </linearGradient>
                      <linearGradient
                        id="resumeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#6ee7b7" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                      <linearGradient
                        id="careerPathGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#7dd3fc" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 13, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => value}
                      allowDecimals={false}
                      tick={{ fontSize: 13, fill: "#6366f1" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "API Calls",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#6366f1",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => value}
                      allowDecimals={false}
                      tick={{ fontSize: 13, fill: "#ec4899" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Tokens",
                        angle: 90,
                        position: "insideRight",
                        fill: "#ec4899",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      formatter={(value) => value.toLocaleString()}
                      contentStyle={{
                        borderRadius: 12,
                        fontSize: 14,
                        boxShadow: "0 4px 24px 0 rgba(16, 30, 54, 0.12)",
                      }}
                    />
                    <Bar
                      dataKey="coverLetter"
                      stackId="a"
                      name="Cover Letter"
                      fill="url(#coverLetterGradient)"
                      isAnimationActive={true}
                      animationDuration={1200}
                      yAxisId="left"
                    />
                    <Bar
                      dataKey="resume"
                      stackId="a"
                      name="Resume"
                      fill="url(#resumeGradient)"
                      isAnimationActive={true}
                      animationDuration={1200}
                      yAxisId="left"
                    />
                    <Bar
                      dataKey="careerPath"
                      stackId="a"
                      name="Career Path"
                      fill="url(#careerPathGradient)"
                      isAnimationActive={true}
                      animationDuration={1200}
                      yAxisId="left"
                    />
                    <Bar
                      dataKey="users"
                      stackId="a"
                      name="Users Created"
                      fill="#6366f1"
                      isAnimationActive={true}
                      animationDuration={1200}
                      yAxisId="left"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* API Calls & Tokens Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-4 mt-6">
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m4 4h-1v-4h-1m-4 4h-1v-4H7"
                    />
                  </svg>
                  <h2 className="text-lg font-bold text-gray-900">
                    API Calls & Tokens by Month
                  </h2>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Monthly totals of API requests and tokens used by all users
              </p>
              <div className="relative z-10">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={apiTokenChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    barCategoryGap={8}
                    barSize={40}
                  >
                    <defs>
                      <linearGradient
                        id="apiCallsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                      <linearGradient
                        id="tokensGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#f472b6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 13, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => value}
                      allowDecimals={false}
                      tick={{ fontSize: 13, fill: "#6366f1" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "API Calls",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#6366f1",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => value}
                      allowDecimals={false}
                      tick={{ fontSize: 13, fill: "#ec4899" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Tokens",
                        angle: 90,
                        position: "insideRight",
                        fill: "#ec4899",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      formatter={(value) => value.toLocaleString()}
                      contentStyle={{
                        borderRadius: 12,
                        fontSize: 14,
                        boxShadow: "0 4px 24px 0 rgba(16, 30, 54, 0.12)",
                      }}
                    />
                    <Bar
                      dataKey="apiCalls"
                      name="API Calls"
                      fill="url(#apiCallsGradient)"
                      isAnimationActive={true}
                      animationDuration={1200}
                      yAxisId="left"
                    />
                    <Bar
                      dataKey="tokens"
                      name="Tokens"
                      fill="url(#tokensGradient)"
                      isAnimationActive={true}
                      animationDuration={1200}
                      yAxisId="right"
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 14, paddingTop: 8 }}
                      iconType="circle"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Job Seekers
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Newest users creating resumes on the platform
              </p>
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">
                        {(() => {
                          let date: Date | null = null;
                          if (user.createdAt) {
                            if (
                              typeof user.createdAt === "object" &&
                              user.createdAt !== null &&
                              typeof (user.createdAt as { toDate?: () => Date })
                                .toDate === "function"
                            ) {
                              date = (
                                user.createdAt as { toDate: () => Date }
                              ).toDate();
                            } else {
                              const d = new Date(user.createdAt as string);
                              if (!isNaN(d.getTime())) date = d;
                            }
                          }
                          return date ? date.toLocaleDateString() : "N/A";
                        })()}
                      </span>
                      <p className="text-xs text-gray-400">
                        Views: {Math.floor(Math.random() * 100)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Right Column */}
          <div className="flex flex-col gap-8">
            {/* Regional Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                Recent Users
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Latest users who joined the platform
              </p>
              <div className="space-y-4">
                {recentUsers.slice(0, 3).map((user, idx) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        idx === 0
                          ? "bg-blue-100"
                          : idx === 1
                          ? "bg-green-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          idx === 0
                            ? "text-blue-600"
                            : idx === 1
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 flex-1 ml-2">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {(() => {
                        let date: Date | null = null;
                        if (user.createdAt) {
                          if (
                            typeof user.createdAt === "object" &&
                            user.createdAt !== null &&
                            typeof (user.createdAt as { toDate?: () => Date })
                              .toDate === "function"
                          ) {
                            date = (
                              user.createdAt as { toDate: () => Date }
                            ).toDate();
                          } else {
                            const d = new Date(user.createdAt as string);
                            if (!isNaN(d.getTime())) date = d;
                          }
                        }
                        return date ? date.toLocaleDateString() : "N/A";
                      })()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Meditation and Exercise Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1 border-b border-gray-100 pb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 17l4 4 4-4m0-5V3m-8 4h8"
                  />
                </svg>
                Resume Activity Stats
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between rounded-lg bg-orange-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-orange-700">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Resumes Created
                  </span>
                  <span className="text-xl font-bold text-orange-700">
                    {activityStats.resumesThisWeek}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z"
                      />
                    </svg>
                    Total Resumes
                  </span>
                  <span className="text-xl font-bold text-blue-700">
                    {profileImpressionData.reduce(
                      (sum, month) => sum + month.resume,
                      0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-purple-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Average per Month
                  </span>
                  <span className="text-xl font-bold text-purple-700">
                    {(
                      profileImpressionData.reduce(
                        (sum, month) => sum + month.resume,
                        0
                      ) / 12
                    ).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            {/* Cover Letter Activity Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6 mt-4">
              <h2 className="text-lg font-bold text-gray-900 mb-1 border-b border-gray-100 pb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Cover Letter Activity Stats
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Cover Letters Created
                  </span>
                  <span className="text-xl font-bold text-green-700">
                    {coverLettersThisWeek}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z"
                      />
                    </svg>
                    Total Cover Letters
                  </span>
                  <span className="text-xl font-bold text-blue-700">
                    {profileImpressionData.reduce(
                      (sum, month) => sum + month.coverLetter,
                      0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-purple-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-purple-700">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Average per Month
                  </span>
                  <span className="text-xl font-bold text-purple-700">
                    {(
                      profileImpressionData.reduce(
                        (sum, month) => sum + month.coverLetter,
                        0
                      ) / 12
                    ).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            {/* Path Activity Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6 mt-4">
              <h2 className="text-lg font-bold text-gray-900 mb-1 border-b border-gray-100 pb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z"
                  />
                </svg>
                Path Activity Stats
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z"
                      />
                    </svg>
                    Paths Created
                  </span>
                  <span className="text-xl font-bold text-blue-700">
                    {totalPaths}
                  </span>
                </div>
                {totalPaths > 0 && recentPathProfessions.length > 0 && (
                  <div className="flex flex-col gap-1 rounded-lg bg-indigo-50 px-4 py-3 mt-2">
                    <div className="text-xs text-gray-500 mb-1 font-semibold">
                      Last 3 Professions
                    </div>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {recentPathProfessions.map((prof, idx) => (
                        <li key={idx}>{prof}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
