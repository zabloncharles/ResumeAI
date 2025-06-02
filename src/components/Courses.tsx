import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, increment } from "firebase/firestore";
import Footer from "./Footer";

const stepIcons = [AcademicCapIcon, BookOpenIcon, CheckCircleIcon];

// MOCKED STEPS DATA FOR DEMO (replace with real API data structure as needed)
const mockSteps = [
  {
    id: "you",
    title: "You",
    description: "",
    prerequisiteIds: [],
    childrenIds: ["bachelor"],
  },
  {
    id: "bachelor",
    title: "Bachelor's Degree",
    description: "Complete a relevant degree",
    prerequisiteIds: ["you"],
    childrenIds: ["creative", "brand", "digital"],
  },
  {
    id: "creative",
    title: "Creative Director",
    description: "Lead creative teams",
    prerequisiteIds: ["bachelor"],
    childrenIds: [],
  },
  {
    id: "brand",
    title: "Brand Manager",
    description: "Manage brand strategy",
    prerequisiteIds: ["bachelor"],
    childrenIds: [],
  },
  {
    id: "digital",
    title: "Digital Marketing Director",
    description: "Oversee digital marketing",
    prerequisiteIds: ["bachelor"],
    childrenIds: ["ux", "editor"],
  },
  {
    id: "ux",
    title: "UX Writer",
    description: "Write for user experience",
    prerequisiteIds: ["digital"],
    childrenIds: [],
  },
  {
    id: "editor",
    title: "Senior Editor",
    description: "Edit and manage content",
    prerequisiteIds: ["digital"],
    childrenIds: [],
  },
];

// Helper: build a map for quick lookup (for any steps array)
function buildStepMap(stepsArr: any[]) {
  return Object.fromEntries((stepsArr || []).map((s) => [s.id, s]));
}

// Helper: recursively render the flowchart for any steps array
function FlowNodeGeneric({ id, stepMap }: { id: string; stepMap: any }) {
  const step = stepMap[id];
  if (!step) return null;
  const children = (step.childrenIds || [])
    .map((cid: string) => stepMap[cid])
    .filter(Boolean);
  return (
    <div className="flex flex-col items-center relative">
      {/* Prerequisite note */}
      {step.prerequisiteIds &&
        step.prerequisiteIds.length > 0 &&
        step.id !== "you" && (
          <div className="text-xs text-gray-400 mb-1">
            Prerequisite:{" "}
            {step.prerequisiteIds
              .map((pid: string) => stepMap[pid]?.title)
              .join(", ")}
          </div>
        )}
      {/* Node card */}
      <div className="bg-white rounded-xl shadow border px-6 py-3 mb-4 text-center min-w-[180px]">
        <div className="font-semibold text-lg mb-1">{step.title}</div>
        {step.description && (
          <div className="text-xs text-gray-500">{step.description}</div>
        )}
      </div>
      {/* Draw lines to children */}
      {children.length > 0 && (
        <div className="flex flex-row justify-center items-start w-full relative">
          {/* SVG lines */}
          <svg
            height="30"
            width={children.length * 200}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: 0, zIndex: 0 }}
          >
            {children.map((child: any, i: number) => (
              <line
                key={child.id}
                x1={children.length === 1 ? 100 : 100 + i * 200}
                y1={0}
                x2={children.length === 1 ? 100 : 100 + i * 200}
                y2={30}
                stroke="#bbb"
                strokeDasharray="6,4"
                strokeWidth="2"
              />
            ))}
          </svg>
          {/* Children nodes */}
          {children.map((child: any, i: number) => (
            <div key={child.id} className="mx-4 mt-8">
              <FlowNodeGeneric id={child.id} stepMap={stepMap} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const Courses = () => {
  const [profession, setProfession] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [view, setView] = useState<"timeline" | "board">("timeline");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSteps([]);
    try {
      const response = await fetch("/.netlify/functions/generateCareerPath", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profession }),
      });
      if (!response.ok) throw new Error("Failed to generate career path");
      const data = await response.json();
      const totalTokens = data.total_tokens || 0;

      // Increment call count and totalTokens in Firestore
      if (user) {
        const userRef = doc(db, "users", user.uid);
        try {
          console.log(
            "[Firestore] Attempting to increment callCount and totalTokens for:",
            user.uid,
            "Tokens:",
            totalTokens
          );
          await setDoc(
            userRef,
            { callCount: increment(1), totalTokens: increment(totalTokens) },
            { merge: true }
          );
          console.log(
            "[Firestore] callCount and totalTokens incremented for:",
            user.uid
          );
        } catch (e) {
          console.error(
            "[Firestore] Error incrementing callCount/totalTokens:",
            e
          );
        }
      }

      // For demo: randomly assign status to steps if not present
      const statuses = ["planned", "inprogress", "released"];
      const stepsWithStatus = (data.steps || []).map(
        (step: any, idx: number) => ({
          ...step,
          status: step.status || statuses[idx % statuses.length],
        })
      );
      setSteps(stepsWithStatus);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex flex-col items-center py-0 px-4">
        {/* Hero Section */}
        <div className="w-full flex flex-col items-center justify-center pt-28 pb-10 mb-0">
          <div className="max-w-2xl w-full mx-auto flex flex-col items-center text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Find Your Path to Success
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              Enter your dream profession and get a personalized, actionable
              roadmap with the best courses and certifications to land your next
              job.
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-xl mx-auto w-full mb-2"
            >
              <input
                type="text"
                className="flex-1 px-6 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white text-gray-900 text-lg shadow-sm transition-all placeholder:text-gray-400"
                placeholder="e.g. Data Scientist, UX Designer, Cloud Engineer"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold text-lg shadow-md hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>
                    <ArrowRightIcon className="w-5 h-5" />
                    Get My Roadmap
                  </>
                )}
              </button>
            </form>
            {error && (
              <div className="text-red-500 text-center mt-2 font-medium animate-pulse">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Toggle Menu */}
        <div className="flex justify-center mb-10 gap-4">
          <div className="inline-flex rounded-full bg-white border border-gray-200 p-1 shadow-sm">
            <button
              className={`px-6 py-2 rounded-full font-semibold text-lg transition-all ${
                view === "timeline"
                  ? "bg-blue-500 text-white"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
              onClick={() => setView("timeline")}
            >
              Timeline
            </button>
            <button
              className={`px-6 py-2 rounded-full font-semibold text-lg transition-all ${
                view === "board"
                  ? "bg-blue-500 text-white"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
              onClick={() => setView("board")}
            >
              Board
            </button>
          </div>
        </div>

        {/* Roadmap Section */}
        {view === "timeline" && (
          <div className="w-full max-w-6xl mx-auto pb-16">
            {/* FLOWCHART RENDERING */}
            <div className="flex flex-col items-center">
              {steps && steps.length > 0 ? (
                <FlowNodeGeneric
                  id={steps[0].id}
                  stepMap={buildStepMap(steps)}
                />
              ) : (
                <FlowNodeGeneric id="you" stepMap={buildStepMap(mockSteps)} />
              )}
            </div>
          </div>
        )}

        {/* How it works Section */}
        <div className="w-full max-w-4xl mx-auto mt-20 mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">1</div>
              <div className="font-semibold text-gray-900 mb-1">
                Enter Profession
              </div>
              <div className="text-gray-500 text-sm">
                Type your dream job or field to get started.
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">2</div>
              <div className="font-semibold text-gray-900 mb-1">
                Get Roadmap
              </div>
              <div className="text-gray-500 text-sm">
                Receive a step-by-step, AI-powered learning path.
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">3</div>
              <div className="font-semibold text-gray-900 mb-1">
                Start Learning
              </div>
              <div className="text-gray-500 text-sm">
                Follow the roadmap and achieve your career goals.
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section (minimal, below How it works) */}
        <div className="w-full max-w-4xl mx-auto rounded-2xl shadow-md px-8 py-10 mt-0 mb-24 bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">100K+</div>
              <div className="text-gray-600">Roadmaps Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">85%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">50K+</div>
              <div className="text-gray-600">Job Placements</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">2x</div>
              <div className="text-gray-600">Avg. Salary Increase</div>
            </div>
          </div>
        </div>

        {/* Footer (copied from LandingPage) */}
        <Footer />
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </>
  );
};

export default Courses;
