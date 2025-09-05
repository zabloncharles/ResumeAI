import Navbar from "./Navbar";
import { useState } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { db, auth } from "../firebase";
// import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  setDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext";
import SignInModal from "./SignInModal";
import React from "react";

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

// Compute distance (importance) from root ("you"): lower distance = earlier prerequisite
function computeDistances(stepsArr: any[]) {
  const map = buildStepMap(stepsArr);
  const distance: Record<string, number> = {};
  // Initialize
  Object.keys(map).forEach((id) => (distance[id] = Number.POSITIVE_INFINITY));
  if (map["you"]) distance["you"] = 0;
  // Relax edges from prerequisites -> step (BFS-like)
  let updated = true;
  let guard = 0;
  while (updated && guard < 1000) {
    updated = false;
    guard += 1;
    for (const step of stepsArr) {
      for (const pid of step.prerequisiteIds || []) {
        const cand = (distance[pid] ?? Infinity) + 1;
        if (cand < (distance[step.id] ?? Infinity)) {
          distance[step.id] = cand;
          updated = true;
        }
      }
    }
  }
  return distance;
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
            Prerequisite: {step.prerequisiteIds
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
          {children.map((child: any) => (
            <svg
              key={child.id}
              height="30"
              width="200"
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: 0, zIndex: 0 }}
            >
              {child.prerequisiteIds && child.prerequisiteIds.includes(id) && (
                <line
                  x1={100}
                  y1={0}
                  x2={100}
                  y2={30}
                  stroke="#bbb"
                  strokeDasharray="6,4"
                  strokeWidth="2"
                />
              )}
            </svg>
          ))}
          {children.map((child: any) => (
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
  const { user } = useAuth();
  const [profession, setProfession] = useState("");
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"timeline" | "board">("timeline");
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Initialize board with mock statuses if entering board view with no steps
  React.useEffect(() => {
    if (view === "board" && steps.length === 0) {
      const initialized = mockSteps
        .filter((s) => s.id !== "you")
        .map((s) => ({ ...s, status: "planned" }));
      setSteps(initialized);
    }
  }, [view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSteps([]);
    try {
      const currentUser = user || auth.currentUser;
      if (!currentUser) {
        setShowSignInModal(true);
        setLoading(false);
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await fetch("/.netlify/functions/generateCareerPath", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profession }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate career path");
      }

      const data = await response.json();
      const totalTokens = data.total_tokens || 0;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(
          userRef,
          { callCount: increment(1), totalTokens: increment(totalTokens) },
          { merge: true }
        );
      } catch (e) {}

      // Initialize all steps as planned (Prerequisites) until user advances them
      const stepsWithStatus = (data.steps || [])
        .filter((s: any) => s.id !== "you")
        .map((step: any) => ({
          ...step,
          status: "planned",
        }));
      setSteps(stepsWithStatus);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  const advanceStep = (id: string) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status:
                s.status === "planned"
                  ? "inprogress"
                  : s.status === "inprogress"
                  ? "released"
                  : "released",
            }
          : s
      )
    );
  };

  const renderBoard = () => {
    const stepsArr = steps;
    const dist = computeDistances([{ id: "you", prerequisiteIds: [], childrenIds: [] }, ...mockSteps]);
    const byStatus = (status: string) =>
      stepsArr
        .filter((s) => (s.status || "planned") === status)
        .sort((a, b) => (dist[a.id] || 999) - (dist[b.id] || 999));

    const col = (
      title: string,
      items: any[],
      accent: string
    ) => (
      <div className="px-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${accent}`}>{title}</h3>
          <span className="text-xs text-gray-500">{items.length}</span>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => advanceStep(item.id)}
              className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {item.title}
                </span>
                <span className="text-[10px] text-gray-500">Advance →</span>
              </div>
              {item.prerequisiteIds && item.prerequisiteIds.length > 0 && (
                <div className="text-[11px] text-gray-500">
                  Requires: {item.prerequisiteIds.join(", ")}
                </div>
              )}
            </button>
          ))}
          {items.length === 0 && (
            <div className="text-xs text-gray-400 py-2 text-center border border-dashed border-gray-200 rounded-lg">
              Empty
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {col("Prerequisites", byStatus("planned"), "text-gray-700")}
          {col("In Progress", byStatus("inprogress"), "text-blue-700")}
          {col("Completed", byStatus("released"), "text-green-700")}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex flex-col items-center py-0 px-4">
        {/* Hero Section */}
        <div className="w-full flex flex-col items-center justify-center pt-28 pb-10 mb-0">
          <div className="max-w-2xl w-full mx-auto flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Discover Your
              <br />
              <span className="text-[#16aeac]">Career Path</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Get personalized career guidance and step-by-step roadmap to achieve
              your professional goals
            </p>

            <form onSubmit={handleSubmit} className="w-full max-w-md">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Enter your profession (e.g., Software Engineer)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16aeac] focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !profession.trim()}
                  className="px-6 py-3 bg-[#16aeac] text-white rounded-lg hover:bg-[#16aeac]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </div>
                  ) : (
                    <>
                      Generate Path
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Menu */}
        <div className="flex justify-center mb-10 gap-4">
          <div className="inline-flex rounded-full bg-white border border-gray-200 p-1">
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
            <div className="flex flex-col items-center">
              {steps && steps.length > 0 ? (
                <FlowNodeGeneric id={steps[0].id} stepMap={buildStepMap(steps)} />
              ) : (
                <FlowNodeGeneric id="you" stepMap={buildStepMap(mockSteps)} />
              )}
            </div>
          </div>
        )}

        {view === "board" && (
          <div className="w-full max-w-6xl mx-auto pb-16">{renderBoard()}</div>
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

        {/* Sign In Modal */}
        <SignInModal
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          onSuccess={() => {
            setShowSignInModal(false);
            setTimeout(() => {
              const form = document.querySelector("form");
              form && (form as HTMLFormElement).dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }, 300);
          }}
        />
      </div>
    </>
  );
};

export default Courses;
