import Navbar from "./Navbar";
import { useState, useEffect } from "react";
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
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext";
import SignInModal from "./SignInModal";
import React from "react";

// MOCKED STEPS DATA FOR DEMO (replace with real API data structure as needed)
// const mockSteps = [
//   {
//     id: "you",
//     title: "You",
//     description: "",
//     prerequisiteIds: [],
//     childrenIds: ["bachelor"],
//   },
//   {
//     id: "bachelor",
//     title: "Bachelor's Degree",
//     description: "Complete a relevant degree",
//     prerequisiteIds: ["you"],
//     childrenIds: ["creative", "brand", "digital"],
//   },
//   {
//     id: "creative",
//     title: "Creative Director",
//     description: "Lead creative teams",
//     prerequisiteIds: ["bachelor"],
//     childrenIds: [],
//   },
//   {
//     id: "brand",
//     title: "Brand Manager",
//     description: "Manage brand strategy",
//     prerequisiteIds: ["bachelor"],
//     childrenIds: [],
//   },
//   {
//     id: "digital",
//     title: "Digital Marketing Director",
//     description: "Oversee digital marketing",
//     prerequisiteIds: ["bachelor"],
//     childrenIds: ["ux", "editor"],
//   },
//   {
//     id: "ux",
//     title: "UX Writer",
//     description: "Write for user experience",
//     prerequisiteIds: ["digital"],
//     childrenIds: [],
//   },
//   {
//     id: "editor",
//     title: "Senior Editor",
//     description: "Edit and manage content",
//     prerequisiteIds: ["digital"],
//     childrenIds: [],
//   },
// ];

// Helper: build a map for quick lookup (for any steps array)
function buildStepMap(stepsArr: any[]) {
  return Object.fromEntries((stepsArr || []).map((s) => [s.id, s]));
}

// Heuristic: detect if profession is broad/generic
function isGeneralProfession(term: string) {
  const lower = term.trim().toLowerCase();
  if (!lower) return false;
  const generic = [
    "doctor",
    "physician",
    "engineer",
    "developer",
    "designer",
    "scientist",
    "lawyer",
    "nurse",
    "teacher",
    "analyst",
    "marketing",
    "business",
  ];
  return (
    generic.some((g) => lower === g || lower.includes(g)) ||
    lower.split(" ").length === 1
  );
}

// Suggest specializations for broad careers (demo list)
function suggestSpecializations(term: string): string[] {
  const t = term.toLowerCase();
  if (t.includes("doctor") || t.includes("physician"))
    return [
      "Internal Medicine",
      "Pediatrics",
      "General Surgery",
      "Orthopedics",
      "Psychiatry",
      "Dermatology",
    ];
  if (t.includes("engineer"))
    return [
      "Software Engineer",
      "Electrical Engineer",
      "Mechanical Engineer",
      "Civil Engineer",
      "Aerospace Engineer",
      "Biomedical Engineer",
    ];
  if (t.includes("developer"))
    return [
      "Frontend Developer",
      "Backend Developer",
      "Full‑Stack Developer",
      "Mobile Developer",
    ];
  if (t.includes("designer"))
    return [
      "UX Designer",
      "UI Designer",
      "Product Designer",
      "Graphic Designer",
    ];
  if (t.includes("lawyer"))
    return ["Corporate Lawyer", "Criminal Lawyer", "IP Lawyer", "Tax Lawyer"];
  if (t.includes("nurse"))
    return [
      "RN (Registered Nurse)",
      "NP (Nurse Practitioner)",
      "ICU Nurse",
      "OR Nurse",
    ];
  if (t.includes("teacher"))
    return ["Elementary", "High School", "Special Education", "ESL Teacher"];
  return ["Specialization A", "Specialization B", "Specialization C"];
}

// (Scorecard integration removed)

function sanitizeSteps(input: any[]): any[] {
  const seenTitles = new Set<string>();
  return (input || [])
    .filter((s) => {
      const key = (s.title || "").trim().toLowerCase();
      if (!key) return false;
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    })
    .map((s) => ({
      ...s,
      prerequisiteIds: (s.prerequisiteIds || []).filter(
        (pid: string) => pid && pid !== s.id
      ),
    }));
}

function findStepIdByTitle(steps: any[], keyword: string): string | null {
  const k = keyword.toLowerCase();
  const found = steps.find((s) => (s.title || "").toLowerCase().includes(k));
  return found ? found.id : null;
}

function adjustInstitutionPrereqs(
  steps: any[],
  profession: string,
  specialization: string
): any[] {
  const isLaw =
    /\blaw|lawyer|attorney|bar\b/i.test(profession || "") ||
    /\blaw|criminal\b/i.test(specialization || "");
  if (!isLaw) return steps;
  const lsatId =
    findStepIdByTitle(steps, "LSAT") || findStepIdByTitle(steps, "Bar");
  const bachelorId = findStepIdByTitle(steps, "Bachelor");
  return steps.map((s) => {
    if (
      s.title?.startsWith("Apply to ") ||
      s.title?.includes("• Explore Programs") ||
      s.title?.includes("• ")
    ) {
      const prereqs: string[] = [];
      if (lsatId) prereqs.push(lsatId);
      else if (bachelorId) prereqs.push(bachelorId);
      else prereqs.push("you");
      return { ...s, prerequisiteIds: prereqs };
    }
    return s;
  });
}

function getDetailBulletsForStep(title: string, specialization: string): string[] {
  const t = (title || "").toLowerCase();
  const spec = (specialization || "").toLowerCase();
  // High school details
  if (t.includes("high school")) {
    return [
      "Take AP/IB Biology, Chemistry, Physics, and Calculus",
      "Volunteer at hospitals/clinics; join HOSA or science clubs",
      "Shadow physicians; build early clinical exposure",
      "Prepare for SAT/ACT; craft competitive applications",
    ];
  }
  // Bachelor details (pre‑med)
  if (t.includes("bachelor")) {
    return [
      "Complete pre‑med prerequisites: Bio I/II, Chem I/II, Organic Chem, Physics, Biochem, Statistics, Psychology",
      "Maintain strong GPA (target 3.6+)",
      "Clinical experience: scribe/EMT/volunteer; physician shadowing",
      "Research or publications (optional but beneficial)",
      "Prepare for MCAT (content review + practice exams)",
      "Build letters of recommendation and personal statement",
    ];
  }
  // Medical school details
  if (t.includes("medical school")) {
    return [
      "M1–M2: Basic sciences; USMLE Step 1",
      "M3: Core clinical rotations (IM, Surgery, Pediatrics, Psych, OB/Gyn, FM)",
      "M4: Sub‑internships and electives in target specialty",
      "USMLE Step 2 CK; finalize letters of recommendation",
      "Apply for residency via ERAS; interview season timing",
    ];
  }
  // Residency details
  if (t.includes("residency")) {
    if (spec.includes("psych")) {
      return [
        "Match into Psychiatry (PGY‑1 to PGY‑4)",
        "Inpatient psychiatry, outpatient clinics, consult‑liaison, addiction, child psych rotations",
        "USMLE Step 3; moonlighting policies",
        "Apply for ABPN board certification after residency",
        "State medical license; DEA registration",
        "Optional fellowship (e.g., Child & Adolescent, Addiction, Forensic)",
      ];
    }
    return [
      "PGY‑1: Intern year; fundamentals and off‑service rotations",
      "PGY‑2+: Specialty‑specific rotations and electives",
      "USMLE/COMLEX Step 3; in‑training exams",
      "Boards eligibility; state license and DEA registration",
      "Consider fellowship for further subspecialization",
    ];
  }
  return [];
}

function attachStepDetails(steps: any[], specialization: string): any[] {
  return steps.map((s) => {
    const details = getDetailBulletsForStep(s.title, specialization);
    return details.length > 0 ? { ...s, details } : s;
  });
}

// Compute distance (importance) from root ("you"): lower distance = earlier prerequisite
function computeDistances(stepsArr: any[]) {
  const map = buildStepMap(stepsArr);
  const distance: Record<string, number> = {};
  Object.keys(map).forEach((id) => (distance[id] = Number.POSITIVE_INFINITY));
  if (map["you"]) distance["you"] = 0;
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
// FlowNodeGeneric kept for reference, currently unused
/*
function FlowNodeGeneric({
  id,
  stepMap,
  sequenceMap,
}: {
  id: string;
  stepMap: any;
  sequenceMap: Record<string, number>;
}) {
  const step = stepMap[id];
  if (!step) return null;
  const children = (step.childrenIds || [])
    .map((cid: string) => stepMap[cid])
    .filter(Boolean);
  return (
    <div className="flex flex-col items-center relative">
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
      <div className="bg-white rounded-xl shadow border px-6 py-3 mb-4 text-center min-w-[220px]">
        <div className="flex items-center justify-center gap-2 mb-1">
          {sequenceMap[step.id] && step.id !== "you" && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] text-[11px] px-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {sequenceMap[step.id]}
            </span>
          )}
          <div className="font-semibold text-lg">{step.title}</div>
        </div>
        {step.description && (
          <div className="text-xs text-gray-500">{step.description}</div>
        )}
      </div>
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
              <FlowNodeGeneric
                id={child.id}
                stepMap={stepMap}
                sequenceMap={sequenceMap}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
*/

const Courses = () => {
  const { user } = useAuth();
  const [profession, setProfession] = useState("");
  const [specialization, setSpecialization] = useState<string>("");
  // removed institution input
  const [suggestedSpecs, setSuggestedSpecs] = useState<string[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Removed timeline view; board appears after generation only
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [currentPathId, setCurrentPathId] = useState<string | null>(null);

  // Suggest specializations when profession changes
  useEffect(() => {
    setSpecialization("");
    if (isGeneralProfession(profession)) {
      setSuggestedSpecs(suggestSpecializations(profession));
    } else {
      setSuggestedSpecs([]);
    }
  }, [profession]);

  // Load last saved path for user (client-side pick latest)
  useEffect(() => {
    (async () => {
      const currentUser = user || auth.currentUser;
      if (!currentUser) return;
      try {
        const q = query(collection(db, "paths"), where("userId", "==", currentUser.uid));
        const snap = await getDocs(q);
        if (snap.empty) return;
        let latestDoc: any = null;
        snap.forEach((d) => {
          const data = d.data();
          const ts =
            data.updatedAt?.toMillis?.() ||
            data.updatedAt?.seconds * 1000 ||
            data.createdAt?.toMillis?.() ||
            data.createdAt?.seconds * 1000 ||
            0;
          if (!latestDoc || ts > latestDoc._ts) {
            latestDoc = { id: d.id, ...data, _ts: ts };
          }
        });
        if (latestDoc) {
          setCurrentPathId(latestDoc.id);
          setProfession(latestDoc.profession || "");
          setSpecialization(latestDoc.specialization || "");
          if (Array.isArray(latestDoc.steps)) {
            setSteps(latestDoc.steps);
          }
        }
      } catch (e) {
        // non-blocking
      }
    })();
  }, [user]);

  // Do not initialize board until after generation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSteps([]);
    try {
      // Enforce specialization for general careers
      if (isGeneralProfession(profession) && !specialization) {
        setSuggestedSpecs(suggestSpecializations(profession));
        setError("Please select a specialization to generate a detailed path.");
        setLoading(false);
        return;
      }

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
        body: JSON.stringify({ profession, specialization }),
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
      const rawGeneratedSteps = (data.steps || []).filter(
        (s: any) => s.id !== "you"
      );

      // Institution support removed; do not inject admissions/programs
      const schoolProgramSteps: any[] = [];

      // Fallback for legal track if generator returned nothing
      let fallback: any[] = [];
      const prof = (profession || "").toLowerCase();
      const specLower = (specialization || "").toLowerCase();
      if (
        rawGeneratedSteps.length === 0 &&
        (prof.includes("law") || specLower.includes("law"))
      ) {
        fallback = [
          {
            id: "hs",
            title: "High School Diploma",
            description: "Complete secondary education",
            prerequisiteIds: ["you"],
            childrenIds: [],
            status: "planned",
          },
          {
            id: "bachelor",
            title: "Bachelor's Degree (Pre‑Law/Political Science)",
            description: "4‑year undergraduate program",
            prerequisiteIds: ["you"],
            childrenIds: [],
            status: "planned",
          },
          {
            id: "lsat",
            title: "LSAT",
            description: "Prepare and take the LSAT exam",
            prerequisiteIds: ["bachelor"],
            childrenIds: [],
            status: "planned",
          },
          {
            id: "jd",
            title: "Law School (JD)",
            description: "3‑year Juris Doctor program",
            prerequisiteIds: ["lsat"],
            childrenIds: [],
            status: "planned",
          },
          {
            id: "clinics",
            title: "Clinics & Internships",
            description: "Hands‑on experience during JD",
            prerequisiteIds: ["jd"],
            childrenIds: [],
            status: "planned",
          },
          {
            id: "bar",
            title: "Bar Exam",
            description: "Pass the bar in your jurisdiction",
            prerequisiteIds: ["jd"],
            childrenIds: [],
            status: "planned",
          },
          {
            id: "clerkship",
            title: "Clerkship/Associate Role",
            description: "Start in criminal law practice",
            prerequisiteIds: ["bar"],
            childrenIds: [],
            status: "planned",
          },
        ];
      }

      const stepsPlanned = [
        ...schoolProgramSteps,
        ...fallback,
        ...rawGeneratedSteps.map((step: any) => ({
          ...step,
          status: "planned",
        })),
      ];
      let stepsWithStatus = sanitizeSteps(stepsPlanned);
      // Ensure institution steps come after key gates for law paths
      stepsWithStatus = adjustInstitutionPrereqs(
        stepsWithStatus,
        profession,
        specialization
      );
      // Attach detail bullets to key steps
      stepsWithStatus = attachStepDetails(stepsWithStatus, specialization);
      setSteps(stepsWithStatus);

      // Save/overwrite last path
      try {
        if (currentPathId) {
          await updateDoc(doc(db, "paths", currentPathId), {
            userId: currentUser.uid,
            profession,
            specialization,
            steps: stepsWithStatus,
            updatedAt: serverTimestamp(),
          });
        } else {
          const ref = await addDoc(collection(db, "paths"), {
            userId: currentUser.uid,
            profession,
            specialization,
            steps: stepsWithStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setCurrentPathId(ref.id);
        }
      } catch (e) {}
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  const persistBoard = async (nextSteps: any[]) => {
    const currentUser = user || auth.currentUser;
    if (!currentUser) return;
    try {
      if (currentPathId) {
        await updateDoc(doc(db, "paths", currentPathId), {
          steps: nextSteps,
          updatedAt: serverTimestamp(),
        });
      } else {
        const ref = await addDoc(collection(db, "paths"), {
          userId: currentUser.uid,
          profession,
          specialization,
          steps: nextSteps,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setCurrentPathId(ref.id);
      }
    } catch (e) {}
  };

  const advanceStep = (id: string) => {
    setSteps((prev) => {
      const next = prev.map((s) =>
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
      );
      persistBoard(next);
      return next;
    });
  };

  const renderBoard = () => {
    const stepsArr = steps;
    const dist = computeDistances([
      { id: "you", prerequisiteIds: [], childrenIds: [] },
      ...stepsArr,
    ]);
    const byStatus = (status: string) =>
      stepsArr
        .filter((s) => (s.status || "planned") === status)
        .sort((a, b) => (dist[a.id] || 999) - (dist[b.id] || 999));

    const col = (title: string, items: any[], accent: string) => (
      <div className="px-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${accent}`}>{title}</h3>
          <span className="text-xs text-gray-500">{items.length}</span>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => advanceStep(item.id)}
              className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] text-[11px] px-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {item.title}
                  </span>
                </div>
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
      <div className="min-h-screen bg-white flex flex-col items-center py-0 px-4">
        {/* Hero Section */}
        <div className="w-full flex flex-col items-center justify-center pt-28 pb-10 mb-0">
          <div className="max-w-2xl w-full mx-auto flex flex-col items-center text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <span>🧭</span>
              <span>→</span>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-semibold">AI</span>
              <span>→</span>
              <span>💼</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Plan your
              <br />
              <span className="text-[#16aeac]">Career Path</span> with Clarity
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-2xl">
              Generate a personalized roadmap and track progress with a clean Kanban board.
            </p>
            <div className="mt-2 mb-6 flex justify-center gap-3">
              <a
                href="/account"
                className="inline-block px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all text-base font-semibold"
              >
                Sign in to save paths
              </a>
              <a
                href="#features"
                className="inline-block px-6 py-3 bg-white text-gray-900 rounded-full border-2 border-gray-200 hover:bg-gray-100 transition-all text-base font-semibold"
              >
                Explore features
              </a>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-md">
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Career (e.g., Doctor, Software Engineer)"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16aeac] focus:border-transparent"
                  required
                />

                {suggestedSpecs.length > 0 && !specialization && (
                  <div className="text-left">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                      Choose a specialization
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSpecs.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setSpecialization(s)}
                          className="px-3 py-1 rounded-full border border-gray-300 text-sm hover:bg-gray-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Specialization (optional unless career is broad)"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16aeac] focus:border-transparent"
                />

                <button
                  type="submit"
                  disabled={loading || !profession.trim()}
                  className="mt-1 px-6 py-3 bg-[#16aeac] text-white rounded-lg hover:bg-[#16aeac]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
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

                {error && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            </form>
            {steps && steps.length > 0 && (
              <div className="w-full max-w-6xl mx-auto mt-8 pb-4">
                {renderBoard()}
              </div>
            )}
          </div>
        </div>

        {/* Promo Card (blurred green like Study/Home) */}
        <div
          className="mt-4 max-w-2xl mx-auto bg-green-50/60 backdrop-blur-md border border-green-200/70 rounded-xl p-8 pb-10 flex flex-col items-center text-center shadow-lg"
        >
          <div className="flex items-center mb-3 justify-center">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-100 text-green-700 mr-2">✓</span>
            <h2 className="text-2xl font-bold text-green-700">Kanban Board</h2>
          </div>
          <p className="text-gray-700 mb-3">
            Generate a detailed path, then track progress with an interactive board.
          </p>
          <a
            href="#how-it-works"
            className="px-6 py-2.5 bg-white text-gray-900 rounded-full border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all shadow-sm"
          >
            See how it works
          </a>
        </div>

        {/* Features Section (match Study style) */}
        <div id="features" className="max-w-6xl mx-auto py-16 px-4">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to plan smarter</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Focused, flat UI with the essentials: generate, refine, and track your path.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center mb-4">
                <span className="text-green-600">🧠</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Personalized Paths</h4>
              <p className="text-sm text-gray-600">AI‑generated steps tailored to your profession and specialization.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center mb-4">
                <span className="text-green-600">🗂️</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Specialization Picker</h4>
              <p className="text-sm text-gray-600">For broad careers, pick a focus to get a more detailed roadmap.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center mb-4">
                <span className="text-green-600">📊</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Kanban Board</h4>
              <p className="text-sm text-gray-600">Move cards as you make progress through your path.</p>
            </div>
          </div>
        </div>

        {/* How it works Section */}
        <div id="how-it-works" className="w-full max-w-4xl mx-auto mt-20 mb-12">
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
              form &&
                (form as HTMLFormElement).dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true })
                );
            }, 300);
          }}
        />
      </div>
    </>
  );
};

export default Courses;
