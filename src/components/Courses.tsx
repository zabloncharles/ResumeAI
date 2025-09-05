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
  return generic.some((g) => lower === g || lower.includes(g)) || lower.split(" ").length === 1;
}

// Suggest specializations for broad careers (demo list)
function suggestSpecializations(term: string): string[] {
  const t = term.toLowerCase();
  if (t.includes("doctor") || t.includes("physician"))
    return [
      "Psychiatrist",
      "Cardiologist",
      "Dermatologist",
      "General Surgeon",
      "Pediatrician",
    ];
  if (t.includes("engineer"))
    return [
      "Software Engineer",
      "Electrical Engineer",
      "Mechanical Engineer",
      "Civil Engineer",
      "Biomedical Engineer",
    ];
  if (t.includes("developer"))
    return ["Frontend Developer", "Backend Developer", "Full‑Stack Developer", "Mobile Developer"];
  if (t.includes("designer"))
    return ["UX Designer", "UI Designer", "Product Designer", "Graphic Designer"];
  if (t.includes("lawyer") || t.includes("law")) return ["Criminal Lawyer", "Corporate Lawyer", "IP Lawyer", "Tax Lawyer"];
  if (t.includes("nurse")) return ["RN (Registered Nurse)", "NP (Nurse Practitioner)", "ICU Nurse", "OR Nurse"];
  if (t.includes("teacher")) return ["Elementary Teacher", "High School Teacher", "Special Education Teacher"];
  return ["Data Analyst", "Product Manager", "Cybersecurity Analyst"];
}

// Heuristic: is college required for a specialization
function isCollegeRequired(spec: string): boolean {
  const s = (spec || "").toLowerCase();
  const must = ["psychiatrist", "doctor", "surgeon", "lawyer", "attorney", "nurse", "engineer", "teacher", "pharmacist", "dentist", "architect"];
  if (must.some((k) => s.includes(k))) return true;
  // tech roles often benefit from degrees, but not strictly required
  const optional = ["developer", "designer", "analyst", "marketer", "pm", "product manager"];
  if (optional.some((k) => s.includes(k))) return false;
  return false;
}

// Scorecard: find top schools by program keyword
function getProgramKeywordsForSpec(spec: string): string[] {
  const s = (spec || "").toLowerCase();
  // Law-related mappings to CIP titles
  if (s.includes("tax")) return ["Tax Law", "Law"];
  if (s.includes("ip") || s.includes("intellectual property")) return ["Intellectual Property Law", "Law"];
  if (s.includes("corporate") || s.includes("business")) return ["Business/Corporate Law", "Law"];
  if (s.includes("criminal")) return ["Criminal Law", "Law"];
  if (s.includes("environment")) return ["Environmental Law", "Law"];
  if (s.includes("family")) return ["Family Law", "Law"];
  // Medical
  if (s.includes("psychiatrist")) return ["Psychiatry", "Medicine", "Medical"];
  // Engineering / CS
  if (s.includes("software")) return ["Computer Science", "Software Engineering"];
  if (s.includes("electrical")) return ["Electrical Engineering", "Engineering"];
  if (s.includes("mechanical")) return ["Mechanical Engineering", "Engineering"];
  return [spec || "", "Law", "Engineering", "Computer Science"]; // generic fallbacks
}

async function fetchTopSchoolsByProgram(program: string): Promise<string[]> {
  try {
    const apiKey = (import.meta as any).env?.VITE_SCORECARD_KEY;
    if (!apiKey || !program) return [];
    // Use search by program keyword via fields filter
    const base = "https://api.data.gov/ed/collegescorecard/v1/schools";
    const fields = "id,school.name,latest.programs.cip_4_digit.title";
    const keywords = getProgramKeywordsForSpec(program).filter(Boolean);
    let names: string[] = [];
    for (const kw of keywords) {
      const url = `${base}?fields=${encodeURIComponent(fields)}&latest.programs.cip_4_digit.title__icontains=${encodeURIComponent(
        kw
      )}&per_page=5&api_key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const results = json?.results || [];
      const batch = results.map((r: any) => r?.school?.name).filter(Boolean);
      names = Array.from(new Set([...names, ...batch]));
      if (names.length >= 3) break;
    }
    return names.slice(0, 3);
  } catch {
    return [];
  }
}

// Scorecard: typeahead institution suggestions
async function fetchInstitutionSuggestions(qs: string): Promise<string[]> {
  try {
    const apiKey = (import.meta as any).env?.VITE_SCORECARD_KEY;
    if (!apiKey || !qs) return [];
    const base = "https://api.data.gov/ed/collegescorecard/v1/schools";
    const fields = "school.name";
    const url = `${base}?fields=${encodeURIComponent(fields)}&school.name__icontains=${encodeURIComponent(
      qs
    )}&per_page=5&api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const results = json?.results || [];
    return Array.from(new Set(results.map((r: any) => r?.school?.name).filter(Boolean)));
  } catch {
    return [];
  }
}

// Degree course templates (simple) for path injection
function getDegreeCourses(spec: string): string[] {
  const s = (spec || "").toLowerCase();
  if (s.includes("psychiatrist") || s.includes("doctor"))
    return ["Biology I", "General Chemistry", "Organic Chemistry", "Physics", "Psychology", "Biochemistry"];
  if (s.includes("law")) return ["Constitutional Law", "Criminal Law", "Torts", "Contracts", "Evidence", "Legal Writing"];
  if (s.includes("software") || s.includes("developer")) return ["Data Structures", "Algorithms", "Databases", "Operating Systems", "Web Development", "Computer Networks"];
  return ["Core 1", "Core 2", "Elective 1", "Elective 2"];
}

// College Scorecard integration: fetch programs for an institution
async function fetchScorecardPrograms(institution: string): Promise<{ code?: string; title: string }[]> {
  try {
    const apiKey = (import.meta as any).env?.VITE_SCORECARD_KEY;
    if (!apiKey || !institution) return [];
    const base = "https://api.data.gov/ed/collegescorecard/v1/schools";
    const fields = [
      "id",
      "school.name",
      "latest.programs.cip_4_digit.code",
      "latest.programs.cip_4_digit.title",
    ].join(",");
    const buildUrl = (nameParam: string) =>
      `${base}?${nameParam}=${encodeURIComponent(institution)}&fields=${encodeURIComponent(
        fields
      )}&per_page=1&api_key=${encodeURIComponent(apiKey)}`;

    let url = buildUrl("school.name__icontains");
    let res = await fetch(url);
    if (!res.ok) {
      url = buildUrl("school.name");
      res = await fetch(url);
    }
    if (!res.ok) {
      console.warn("[Scorecard] HTTP error", res.status);
      return [];
    }
    const json = await res.json();
    const results = json?.results || [];
    if (results.length === 0) {
      console.info("[Scorecard] No school results for", institution);
      return [];
    }
    const programs =
      results[0]?.latest?.programs?.cip_4_digit ||
      results[0]?.latest?.programs ||
      [];
    const mapped = (programs || [])
      .map((p: any) => ({ code: p?.code, title: p?.title }))
      .filter((p: any) => !!p.title);
    console.info("[Scorecard] Programs fetched:", mapped.length);
    return mapped;
  } catch (e) {
    console.warn("[Scorecard] Exception:", e);
    return [];
  }
}

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
      prerequisiteIds: (s.prerequisiteIds || []).filter((pid: string) => pid && pid !== s.id),
    }));
}

function findStepIdByTitle(steps: any[], keyword: string): string | null {
  const k = keyword.toLowerCase();
  const found = steps.find((s) => (s.title || "").toLowerCase().includes(k));
  return found ? found.id : null;
}

function adjustInstitutionPrereqs(steps: any[], profession: string, specialization: string): any[] {
  const isLaw = /\blaw|lawyer|attorney|bar\b/i.test(profession || "") || /\blaw|criminal\b/i.test(specialization || "");
  if (!isLaw) return steps;
  const lsatId = findStepIdByTitle(steps, "LSAT") || findStepIdByTitle(steps, "Bar");
  const bachelorId = findStepIdByTitle(steps, "Bachelor");
  return steps.map((s) => {
    if (s.title?.startsWith("Apply to ") || s.title?.includes("• Explore Programs") || s.title?.includes("• ")) {
      const prereqs: string[] = [];
      if (lsatId) prereqs.push(lsatId);
      else if (bachelorId) prereqs.push(bachelorId);
      else prereqs.push("you");
      return { ...s, prerequisiteIds: prereqs };
    }
    return s;
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

// Compute a topological sequence index per node (1..N)
function computeSequenceIndexMap(stepsArr: any[]): Record<string, number> {
  const idSet = new Set((stepsArr || []).map((s) => s.id));
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  (stepsArr || []).forEach((s) => {
    inDegree[s.id] = 0;
    adj[s.id] = [];
  });
  (stepsArr || []).forEach((s) => {
    (s.prerequisiteIds || []).forEach((pid: string) => {
      if (pid === "you") return; // treat root prerequisite as satisfied
      if (idSet.has(pid)) {
        inDegree[s.id] += 1;
        adj[pid] = adj[pid] || [];
        adj[pid].push(s.id);
      }
    });
  });
  const queue: string[] = [];
  Object.keys(inDegree)
    .sort()
    .forEach((id) => {
      if (inDegree[id] === 0) queue.push(id);
    });
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift() as string;
    order.push(id);
    for (const nxt of adj[id] || []) {
      inDegree[nxt] -= 1;
      if (inDegree[nxt] === 0) queue.push(nxt);
    }
  }
  // Fallback: if disconnected nodes remain
  (stepsArr || []).forEach((s) => {
    if (!order.includes(s.id)) order.push(s.id);
  });
  const map: Record<string, number> = {};
  order.forEach((id, idx) => (map[id] = idx + 1));
  return map;
}

// Helper: recursively render the flowchart for any steps array
function FlowNodeGeneric({ id, stepMap, sequenceMap }: { id: string; stepMap: any; sequenceMap: Record<string, number> }) {
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
            Prerequisite: {step.prerequisiteIds
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
              <FlowNodeGeneric id={child.id} stepMap={stepMap} sequenceMap={sequenceMap} />
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
  const [specialization, setSpecialization] = useState<string>("");
  const [institution, setInstitution] = useState<string>("");
  const [suggestedSpecs, setSuggestedSpecs] = useState<string[]>([]);
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [topSchools, setTopSchools] = useState<string[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"timeline" | "board">("timeline");
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

  useEffect(() => {
    (async () => {
      if (!specialization) {
        setTopSchools([]);
        return;
      }
      if (isCollegeRequired(specialization)) {
        const schools = await fetchTopSchoolsByProgram(specialization);
        setTopSchools(schools);
      } else {
        setTopSchools([]);
      }
    })();
  }, [specialization]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!institution || institution.length < 3) {
        setSchoolSuggestions([]);
        return;
      }
      const list = await fetchInstitutionSuggestions(institution);
      setSchoolSuggestions(list);
    }, 300);
    return () => clearTimeout(t);
  }, [institution]);

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
          const ts = (data.updatedAt?.toMillis?.() || data.updatedAt?.seconds * 1000) ||
                     (data.createdAt?.toMillis?.() || data.createdAt?.seconds * 1000) || 0;
          if (!latestDoc || ts > latestDoc._ts) {
            latestDoc = { id: d.id, ...data, _ts: ts };
          }
        });
        if (latestDoc) {
          setCurrentPathId(latestDoc.id);
          setProfession(latestDoc.profession || "");
          setSpecialization(latestDoc.specialization || "");
          setInstitution(latestDoc.institution || "");
          if (Array.isArray(latestDoc.steps)) {
            setSteps(latestDoc.steps);
          }
        }
      } catch (e) {
        // non-blocking
      }
    })();
  }, [user]);

  // Initialize board with mock statuses if entering board view with no steps
  useEffect(() => {
    if (view === "board" && steps.length === 0) {
      const initialized = mockSteps
        .filter((s) => s.id !== "you")
        .map((s) => ({ ...s, status: "planned" }));
      setSteps(initialized);
    }
  }, [view, steps.length]);

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
        body: JSON.stringify({ profession, specialization, institution }),
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
      const rawGeneratedSteps = (data.steps || []).filter((s: any) => s.id !== "you");

      // If institution provided, enrich with program steps from Scorecard
      let schoolProgramSteps: any[] = [];
      if (institution) {
        const programs = await fetchScorecardPrograms(institution);
        let filtered = programs;
        if (specialization && !/^specialization\s[a-c]$/i.test(specialization.trim())) {
          const spec = specialization.toLowerCase();
          const f = programs.filter((p) => p.title?.toLowerCase?.().includes(spec));
          if (f.length > 0) filtered = f;
        }
        const top = filtered.slice(0, 5);
        schoolProgramSteps = top.map((p, idx) => ({
          id: `program_${p.code || idx}_${Date.now()}`,
          title: `${institution} • ${p.title}`,
          description: "Program relevant to your specialization",
          prerequisiteIds: ["you"],
          childrenIds: [],
          status: "planned",
        }));
        // Always include an admissions/application step
        schoolProgramSteps.unshift({
          id: `admissions_${Date.now()}`,
          title: `Apply to ${institution}`,
          description: "Prepare application materials, required tests, and financial aid",
          prerequisiteIds: ["you"],
          childrenIds: [],
          status: "planned",
        });
        // If no programs were found, include a discovery step so user still sees the school reflected
        if (top.length === 0) {
          schoolProgramSteps.push({
            id: `explore_${Date.now()}`,
            title: `${institution} • Explore Programs`,
            description: "Review the institution's catalog to pick the best major",
            prerequisiteIds: ["you"],
            childrenIds: [],
            status: "planned",
          });
        }
      }

      // Fallback for legal track if generator returned nothing
      let fallback: any[] = [];
      const prof = (profession || "").toLowerCase();
      const specLower = (specialization || "").toLowerCase();
      if (rawGeneratedSteps.length === 0 && (prof.includes("law") || specLower.includes("law"))) {
        fallback = [
          { id: "hs", title: "High School Diploma", description: "Complete secondary education", prerequisiteIds: ["you"], childrenIds: [], status: "planned" },
          { id: "bachelor", title: "Bachelor's Degree (Pre‑Law/Political Science)", description: "4‑year undergraduate program", prerequisiteIds: ["you"], childrenIds: [], status: "planned" },
          { id: "lsat", title: "LSAT", description: "Prepare and take the LSAT exam", prerequisiteIds: ["bachelor"], childrenIds: [], status: "planned" },
          { id: "jd", title: "Law School (JD)", description: "3‑year Juris Doctor program", prerequisiteIds: ["lsat"], childrenIds: [], status: "planned" },
          { id: "clinics", title: "Clinics & Internships", description: "Hands‑on experience during JD", prerequisiteIds: ["jd"], childrenIds: [], status: "planned" },
          { id: "bar", title: "Bar Exam", description: "Pass the bar in your jurisdiction", prerequisiteIds: ["jd"], childrenIds: [], status: "planned" },
          { id: "clerkship", title: "Clerkship/Associate Role", description: "Start in criminal law practice", prerequisiteIds: ["bar"], childrenIds: [], status: "planned" },
        ];
      }

      const stepsPlanned = [
        ...schoolProgramSteps,
        ...fallback,
        ...rawGeneratedSteps.map((step: any) => ({ ...step, status: "planned" })),
      ];
      let stepsWithStatus = sanitizeSteps(stepsPlanned);
      // Ensure institution steps come after key gates for law paths
      stepsWithStatus = adjustInstitutionPrereqs(stepsWithStatus, profession, specialization);

      // If college required and we have specialization + institution/any school, inject degree courses
      if (isCollegeRequired(specialization)) {
        const courses = getDegreeCourses(specialization).map((c, idx) => ({
          id: `course_${idx}_${Date.now()}`,
          title: `Course: ${c}`,
          description: `Core course for ${specialization}`,
          prerequisiteIds: [findStepIdByTitle(stepsWithStatus, "Bachelor") || "you"],
          childrenIds: [],
          status: "planned",
        }));
        stepsWithStatus = sanitizeSteps([...stepsWithStatus, ...courses]);
      }

      setSteps(stepsWithStatus);

      // Save/overwrite last path
      try {
        if (currentPathId) {
          await updateDoc(doc(db, "paths", currentPathId), {
            userId: currentUser.uid,
            profession,
            specialization,
            institution,
            steps: stepsWithStatus,
            updatedAt: serverTimestamp(),
          });
        } else {
          const ref = await addDoc(collection(db, "paths"), {
            userId: currentUser.uid,
            profession,
            specialization,
            institution,
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
          institution,
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

                {specialization && isCollegeRequired(specialization) && (
                  <div className="text-left">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                      Top schools for {specialization}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {topSchools.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setInstitution(s)}
                          className="px-3 py-1 rounded-full border border-gray-300 text-sm hover:bg-gray-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Institution (optional, e.g., Harvard University)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16aeac] focus:border-transparent"
                  />
                  {schoolSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-auto">
                      {schoolSuggestions.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => {
                            setInstitution(s);
                            setSchoolSuggestions([]);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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
                (() => {
                  const seq = computeSequenceIndexMap(steps);
                  const ordered = steps.slice().sort((a, b) => (seq[a.id] || 999) - (seq[b.id] || 999));
                  const idToTitle: Record<string, string> = Object.fromEntries(ordered.map((s) => [s.id, s.title]));
                  const fmtPrereqs = (ids?: string[]) =>
                    (ids || [])
                      .filter((id) => id && id !== "you")
                      .map((id) => idToTitle[id] || id)
                      .filter(Boolean);
                  return (
                    <div className="w-full max-w-3xl space-y-3">
                      {ordered.map((s, idx) => (
                        <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] text-[11px] px-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              {idx + 1}
                            </span>
                            <div className="font-medium text-gray-900">{s.title}</div>
                          </div>
                          {s.description && (
                            <div className="text-sm text-gray-600">{s.description}</div>
                          )}
                          {(() => {
                            const pr = fmtPrereqs(s.prerequisiteIds);
                            return pr.length > 0 ? (
                              <div className="text-[11px] text-gray-500 mt-1">Prerequisite: {pr.join(", ")}</div>
                            ) : null;
                          })()}
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const seq = computeSequenceIndexMap(mockSteps);
                  const ordered = mockSteps.slice().sort((a, b) => (seq[a.id] || 999) - (seq[b.id] || 999));
                  const idToTitle: Record<string, string> = Object.fromEntries(ordered.map((s) => [s.id, s.title]));
                  const fmtPrereqs = (ids?: string[]) =>
                    (ids || [])
                      .filter((id) => id && id !== "you")
                      .map((id) => idToTitle[id] || id)
                      .filter(Boolean);
                  return (
                    <div className="w-full max-w-3xl space-y-3">
                      {ordered.map((s, idx) => (
                        <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] text-[11px] px-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              {idx + 1}
                            </span>
                            <div className="font-medium text-gray-900">{s.title}</div>
                          </div>
                          {s.description && (
                            <div className="text-sm text-gray-600">{s.description}</div>
                          )}
                          {(() => {
                            const pr = fmtPrereqs(s.prerequisiteIds);
                            return pr.length > 0 ? (
                              <div className="text-[11px] text-gray-500 mt-1">Prerequisite: {pr.join(", ")}</div>
                            ) : null;
                          })()}
                        </div>
                      ))}
                    </div>
                  );
                })()
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
