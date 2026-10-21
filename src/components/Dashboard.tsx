import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import AdminShell from "./admin/AdminShell";
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
import { useNavigate } from "react-router-dom";
import type { ComponentType, SVGProps } from "react";
import {
  UsersIcon,
  DocumentTextIcon,
  BoltIcon,
  CircleStackIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {
  emptyMonthChart,
  emptyPlanRegistrationChart,
  fetchAnalyticsGlobal,
  fetchAnalyticsMonthsForYear,
  type AnalyticsGlobal,
} from "../utils/analyticsFirestore";
import {
  ACCOUNT_PLAN_CHART_COLORS,
  ACCOUNT_PLAN_LABELS,
  ACCOUNT_PLANS,
  isCustomerPlan,
  normalizeAccountPlan,
  type AccountPlan,
  type AccountType,
} from "../constants/accountPlans";
import { coordsForUsState } from "../constants/usStateCentroids";

type MetricIcon = ComponentType<SVGProps<SVGSVGElement>>;

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
  type: AccountType | "paid";
  state: string;
}

const Dashboard = () => {
  if (import.meta.env.DEV) console.log("Dashboard component rendered");
  const { user } = useAuth();
  const { theme } = useTheme();
  const chartTooltipStyles =
    theme === "dark"
      ? {
          contentStyle: {
            backgroundColor: "#09090b",
            border: "1px solid #27272a",
            borderRadius: 12,
            fontSize: 14,
            color: "#f4f4f5",
            boxShadow: "0 8px 28px rgba(0, 0, 0, 0.45)",
          } as const,
          itemStyle: { color: "#e4e4e7" } as const,
          labelStyle: { color: "#a1a1aa", marginBottom: 4 } as const,
          cursor: { fill: "rgba(255,255,255,0.04)" } as const,
        }
      : {
          contentStyle: {
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            fontSize: 14,
            color: "#111827",
            boxShadow: "0 4px 24px 0 rgba(16, 30, 54, 0.12)",
          } as const,
          itemStyle: { color: "#374151" } as const,
          labelStyle: { color: "#6b7280", marginBottom: 4 } as const,
          cursor: { fill: "rgba(0,0,0,0.04)" } as const,
        };
  const [recentUsers, setRecentUsers] = useState<UserData[]>([]);
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [locationArcs, setLocationArcs] = useState<any[]>([]);
  const [topStates, setTopStates] = useState<
    { state: string; count: number; percent: number }[]
  >([]);
  const [platformStats, setPlatformStats] = useState<AnalyticsGlobal>({
    totalUsers: 0,
    totalResumes: 0,
    totalCoverLetters: 0,
    totalApiCalls: 0,
    totalTokens: 0,
    usersFree: 0,
    usersPremium: 0,
    usersPro: 0,
  });
  const [planCounts, setPlanCounts] = useState<Record<AccountPlan, number>>({
    free: 0,
    premium: 0,
    pro: 0,
  });
  const [newUsersThisWeek, setNewUsersThisWeek] = useState(0);
  const [currentMonthResumes, setCurrentMonthResumes] = useState(0);
  const [currentMonthCoverLetters, setCurrentMonthCoverLetters] = useState(0);
  const globeRef = useRef<any>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const [globeWidth, setGlobeWidth] = useState(480);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [profileImpressionData, setProfileImpressionData] = useState(() =>
    emptyMonthChart().map(({ month, coverLetter, resume, users }) => ({
      month,
      coverLetter,
      resume,
      users,
      applications: 0,
    }))
  );

  const [apiTokenChartData, setApiTokenChartData] = useState(() =>
    emptyMonthChart().map(({ month, apiCalls, tokens }) => ({
      month,
      apiCalls,
      tokens,
    }))
  );

  const [planRegistrationData, setPlanRegistrationData] = useState(() =>
    emptyPlanRegistrationChart()
  );

  useEffect(() => {
    if (!user) {
      if (!isLoading) navigate("/");
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          navigate("/");
          return;
        }

        const data = userSnap.data();
        const nextUser: UserData = {
          id: user.uid,
          email: user.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          createdAt: data.createdAt || "",
          lastLogin: data.lastLogin || "",
          totalResumes: data.totalResumes || 0,
          totalApiCalls: data.totalApiCalls || 0,
          totalTokens: data.totalTokens || 0,
          location: data.location || "",
          type: normalizeAccountPlan(data.type),
          state: data.state || "",
        };
        if (cancelled) return;
        localStorage.setItem("userData", JSON.stringify(nextUser));

        if (nextUser.type !== "admin") {
          setIsAdmin(false);
          navigate("/");
          return;
        }
        setIsAdmin(true);

        const year = new Date().getFullYear();
        const [global, months, usersSnap] = await Promise.all([
          fetchAnalyticsGlobal(),
          fetchAnalyticsMonthsForYear(year),
          getDocs(collection(db, "users")),
        ]);

        if (cancelled) return;

        setPlatformStats(global);

        const monthIndex = new Date().getMonth();
        setCurrentMonthResumes(months[monthIndex]?.resumes ?? 0);
        setCurrentMonthCoverLetters(months[monthIndex]?.coverLetters ?? 0);

        setProfileImpressionData(
          months.map((m) => ({
            month: m.label,
            coverLetter: m.coverLetters,
            resume: m.resumes,
            users: m.users,
            applications: 0,
          }))
        );
        setApiTokenChartData(
          months.map((m) => ({
            month: m.label,
            apiCalls: m.apiCalls,
            tokens: m.tokens,
          }))
        );

        const allUsers: UserData[] = [];
        const livePlanCounts: Record<AccountPlan, number> = {
          free: 0,
          premium: 0,
          pro: 0,
        };
        const planByMonth = emptyPlanRegistrationChart(year);
        usersSnap.forEach((d) => {
          const u = d.data() as Record<string, unknown>;
          const plan = normalizeAccountPlan(u.type);
          allUsers.push({
            id: d.id,
            email: String(u.email || ""),
            firstName: String(u.firstName || ""),
            lastName: String(u.lastName || ""),
            createdAt: String(u.createdAt || ""),
            lastLogin: String(u.lastLogin || ""),
            totalResumes: Number(u.totalResumes) || 0,
            totalApiCalls: Number(u.totalApiCalls) || 0,
            totalTokens: Number(u.totalTokens) || 0,
            location: String(u.location || ""),
            type: plan,
            state: String(u.state || ""),
          });
          if (isCustomerPlan(plan)) {
            livePlanCounts[plan] += 1;
            const created = new Date(String(u.createdAt || ""));
            if (
              !Number.isNaN(created.getTime()) &&
              created.getFullYear() === year
            ) {
              planByMonth[created.getMonth()][plan] += 1;
            }
          }
        });
        allUsers.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentUsers(allUsers);
        setPlanCounts(livePlanCounts);

        const rollupHasPlanData = months.some(
          (m) => m.usersFree + m.usersPremium + m.usersPro > 0
        );
        setPlanRegistrationData(
          rollupHasPlanData
            ? months.map((m) => ({
                month: m.label,
                monthKey: m.monthKey,
                free: m.usersFree,
                premium: m.usersPremium,
                pro: m.usersPro,
              }))
            : planByMonth
        );

        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setNewUsersThisWeek(
          allUsers.filter((u) => new Date(u.createdAt).getTime() >= weekAgo)
            .length
        );

        const locs: { lat: number; lng: number; name: string }[] = [];
        for (const u of allUsers) {
          const displayName =
            `${u.firstName} ${u.lastName}`.trim() || u.email || "User";
          let lat: number | null = null;
          let lng: number | null = null;

          if (
            u.location &&
            typeof u.location === "string" &&
            u.location.includes(",")
          ) {
            const [latStr, lngStr] = u.location.split(",");
            const parsedLat = parseFloat(latStr);
            const parsedLng = parseFloat(lngStr);
            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
              lat = parsedLat;
              lng = parsedLng;
            }
          }

          if (lat == null || lng == null) {
            const fromState = coordsForUsState(u.state, u.id || displayName);
            if (fromState) {
              lat = fromState.lat;
              lng = fromState.lng;
            }
          }

          if (lat != null && lng != null) {
            locs.push({ lat, lng, name: displayName });
          }
        }
        setUserLocations(locs);
        setLocationArcs([]);

        const stateCounts: Record<string, number> = {};
        for (const u of allUsers) {
          if (u.state) stateCounts[u.state] = (stateCounts[u.state] || 0) + 1;
        }
        const totalForStates = allUsers.length || 1;
        setTopStates(
          Object.entries(stateCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([state, count]) => ({
              state,
              count,
              percent: Math.round((count / totalForStates) * 100),
            }))
        );
      } catch (e) {
        if (import.meta.env.DEV) console.error("Dashboard load failed", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    setIsLoading(true);
    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const setGlobeOverview = () => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView({ lat: 20, lng: -30, altitude: 2.4 }, 0);
  };

  useEffect(() => {
    const el = globeContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const next = Math.max(Math.floor(el.clientWidth), 240);
      setGlobeWidth(next);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16aeac]" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminShell
      title="Resume & Employment Analytics"
      description="Platform adoption and AI usage at a glance."
    >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {(
            [
              {
                key: "users",
                label: "Total users",
                value: platformStats.totalUsers || recentUsers.length,
                hint: "Platform-wide registered accounts",
                Icon: UsersIcon,
                tone: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
              },
              {
                key: "resumes",
                label: "Total resumes",
                value: platformStats.totalResumes,
                hint: "First cloud saves across all users",
                Icon: DocumentTextIcon,
                tone: "bg-[#16aeac]/10 text-[#16aeac] dark:bg-[#16aeac]/15",
              },
              {
                key: "api",
                label: "Total API calls",
                value: platformStats.totalApiCalls,
                hint: "All AI actions across the platform",
                Icon: BoltIcon,
                tone: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
              },
              {
                key: "tokens",
                label: "Total tokens",
                value: platformStats.totalTokens,
                hint: "All tokens used across the platform",
                Icon: CircleStackIcon,
                tone: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
              },
              {
                key: "week",
                label: "New users this week",
                value: newUsersThisWeek,
                hint: "Accounts created in the last 7 days",
                Icon: UserPlusIcon,
                tone: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
              },
            ] as Array<{
              key: string;
              label: string;
              value: number;
              hint: string;
              Icon: MetricIcon;
              tone: string;
            }>
          ).map(({ key, label, value, hint, Icon, tone }) => (
            <div
              key={key}
              className="relative overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,_rgba(22,174,172,0.1),_transparent_70%)]"
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
                    {value.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed">
                    {hint}
                  </p>
                </div>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
              Account types
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Current mix of Free, Premium, and Pro accounts (admins excluded).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ACCOUNT_PLANS.map((plan) => {
              const count = planCounts[plan];
              const customerTotal =
                planCounts.free + planCounts.premium + planCounts.pro || 1;
              const percent = Math.round((count / customerTotal) * 100);
              return (
                <div
                  key={plan}
                  className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {ACCOUNT_PLAN_LABELS[plan]}
                    </p>
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: ACCOUNT_PLAN_CHART_COLORS[plan] }}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
                    {count.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    {percent}% of customer accounts
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: ACCOUNT_PLAN_CHART_COLORS[plan],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                Job Seeker Locations
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                Where are users creating resumes?
              </p>
              <div className="flex gap-8">
                {/* Globe Section */}
                <div className="w-1/2">
                  <div
                    ref={globeContainerRef}
                    className="w-full h-[300px] overflow-hidden flex items-center justify-center"
                  >
                    <Globe
                      ref={globeRef}
                      width={globeWidth}
                      height={300}
                      globeImageUrl="//unpkg.com/three-globe/example/img/earth-water.png"
                      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                      pointsData={userLocations.map((loc) => ({
                        lat: loc.lat,
                        lng: loc.lng,
                        name: loc.name,
                        color: "#ef4444",
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
                      backgroundColor="rgba(0,0,0,0)"
                      animateIn={false}
                      atmosphereColor="#6366f1"
                      atmosphereAltitude={0.1}
                      pointsMerge={false}
                      pointsTransitionDuration={1000}
                      onGlobeReady={setGlobeOverview}
                      onPointClick={(point) => {
                        if (import.meta.env.DEV)
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

                <div className="w-1/2">
                  <div className="space-y-4 h-[300px] overflow-y-auto pr-2">
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-100 mb-2">
                        Total Active Users
                      </h3>
                      <p className="text-2xl font-bold text-blue-600 dark:text-sky-400">
                        {platformStats.totalUsers || recentUsers.length}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                        Across 6 continents
                      </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                        <h3 className="text-md font-semibold text-gray-900 dark:text-zinc-100">
                          Top Locations
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
                        States with the most active users
                      </p>
                      <div className="space-y-3">
                        {topStates.map((item, idx) => (
                          <div
                            key={item.state}
                            className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2 last:border-b-0 last:pb-0"
                          >
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center ${
                                idx === 0
                                  ? "bg-blue-100 dark:bg-sky-950"
                                  : idx === 1
                                  ? "bg-green-100 dark:bg-emerald-950"
                                  : "bg-yellow-100 dark:bg-amber-950"
                              }`}
                            >
                              <span
                                className={`text-xs font-medium ${
                                  idx === 0
                                    ? "text-blue-600 dark:text-sky-400"
                                    : idx === 1
                                    ? "text-green-600 dark:text-emerald-400"
                                    : "text-yellow-600 dark:text-amber-400"
                                }`}
                              >
                                {item.state.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-gray-900 dark:text-zinc-100 flex-1 ml-2">
                              {item.state}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-zinc-400">
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

            {/* Profile Impression Chart */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-8 mb-4">
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
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
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
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Cover Letter Creations
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
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Users Created
                    </span>
                  </span>
                </div>
                <select className="text-sm border-gray-200 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-zinc-100">
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
                      contentStyle={chartTooltipStyles.contentStyle}
                      itemStyle={chartTooltipStyles.itemStyle}
                      labelStyle={chartTooltipStyles.labelStyle}
                      cursor={chartTooltipStyles.cursor}
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
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-8 mb-4 mt-6">
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
                  <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                    API Calls & Tokens by Month
                  </h2>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
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
                      contentStyle={chartTooltipStyles.contentStyle}
                      itemStyle={chartTooltipStyles.itemStyle}
                      labelStyle={chartTooltipStyles.labelStyle}
                      cursor={chartTooltipStyles.cursor}
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

            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-8 mb-4 mt-2">
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                    Registrations by account type
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    New signups each month across Free, Premium, and Pro
                  </p>
                </div>
              </div>
              <div className="relative z-10 mt-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={planRegistrationData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    barCategoryGap={12}
                    barGap={2}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={theme === "dark" ? "#27272a" : "#e5e7eb"}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{
                        fontSize: 13,
                        fill: theme === "dark" ? "#a1a1aa" : "#6b7280",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 13,
                        fill: theme === "dark" ? "#a1a1aa" : "#6b7280",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => value.toLocaleString()}
                      contentStyle={chartTooltipStyles.contentStyle}
                      itemStyle={chartTooltipStyles.itemStyle}
                      labelStyle={chartTooltipStyles.labelStyle}
                      cursor={chartTooltipStyles.cursor}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 14, paddingTop: 8 }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="free"
                      name="Free"
                      fill={ACCOUNT_PLAN_CHART_COLORS.free}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive
                      animationDuration={1000}
                    />
                    <Bar
                      dataKey="premium"
                      name="Premium"
                      fill={ACCOUNT_PLAN_CHART_COLORS.premium}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive
                      animationDuration={1000}
                    />
                    <Bar
                      dataKey="pro"
                      name="Pro"
                      fill={ACCOUNT_PLAN_CHART_COLORS.pro}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
          {/* Right Column */}
          <div className="flex flex-col gap-8">
            {/* Regional Distribution */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
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
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
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
                          ? "bg-blue-100 dark:bg-sky-950"
                          : idx === 1
                          ? "bg-green-100 dark:bg-emerald-950"
                          : "bg-yellow-100 dark:bg-amber-950"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          idx === 0
                            ? "text-blue-600 dark:text-sky-400"
                            : idx === 1
                            ? "text-green-600 dark:text-emerald-400"
                            : "text-yellow-600 dark:text-amber-400"
                        }`}
                      >
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 ml-2 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {ACCOUNT_PLAN_LABELS[normalizeAccountPlan(user.type)]}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-zinc-400">
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
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 flex flex-col gap-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-1 border-b border-gray-100 dark:border-zinc-800 pb-2 flex items-center gap-2">
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
                <div className="flex items-center justify-between px-1 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
                    <svg
                      className="w-4 h-4 text-orange-500"
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
                    This Month
                  </span>
                  <span className="inline-flex min-w-10 h-10 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/50 px-3 text-sm font-bold tabular-nums text-orange-700 dark:text-orange-300">
                    {currentMonthResumes}
                  </span>
                </div>
                <div className="flex items-center justify-between px-1 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
                    <svg
                      className="w-4 h-4 text-blue-500"
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
                  <span className="inline-flex min-w-10 h-10 items-center justify-center rounded-full bg-blue-50 dark:bg-sky-950/50 px-3 text-sm font-bold tabular-nums text-blue-700 dark:text-sky-300">
                    {platformStats.totalResumes}
                  </span>
                </div>
                <div className="flex items-center justify-between px-1 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
                    <svg
                      className="w-4 h-4 text-purple-500"
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
                  <span className="inline-flex min-w-10 h-10 items-center justify-center rounded-full bg-purple-50 dark:bg-violet-950/50 px-3 text-sm font-bold tabular-nums text-purple-700 dark:text-violet-300">
                    {(
                      platformStats.totalResumes /
                      Math.max(new Date().getMonth() + 1, 1)
                    ).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            {/* Cover Letter Activity Stats */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 flex flex-col gap-6 mt-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-1 border-b border-gray-100 dark:border-zinc-800 pb-2 flex items-center gap-2">
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
                <div className="flex items-center justify-between px-1 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
                    <svg
                      className="w-4 h-4 text-green-500"
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
                    This Month
                  </span>
                  <span className="inline-flex min-w-10 h-10 items-center justify-center rounded-full bg-green-50 dark:bg-emerald-950/50 px-3 text-sm font-bold tabular-nums text-green-700 dark:text-emerald-300">
                    {currentMonthCoverLetters}
                  </span>
                </div>
                <div className="flex items-center justify-between px-1 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
                    <svg
                      className="w-4 h-4 text-blue-500"
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
                  <span className="inline-flex min-w-10 h-10 items-center justify-center rounded-full bg-blue-50 dark:bg-sky-950/50 px-3 text-sm font-bold tabular-nums text-blue-700 dark:text-sky-300">
                    {platformStats.totalCoverLetters}
                  </span>
                </div>
                <div className="flex items-center justify-between px-1 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
                    <svg
                      className="w-4 h-4 text-purple-500"
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
                  <span className="inline-flex min-w-10 h-10 items-center justify-center rounded-full bg-purple-50 dark:bg-violet-950/50 px-3 text-sm font-bold tabular-nums text-purple-700 dark:text-violet-300">
                    {(
                      platformStats.totalCoverLetters /
                      Math.max(new Date().getMonth() + 1, 1)
                    ).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </AdminShell>
  );
};

export default Dashboard;
