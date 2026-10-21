import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  ClipboardIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  EnvelopeIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { auth } from "../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import SignInModal from "./SignInModal";
import ResumeShell from "./resume/ResumeShell";
import { postGenerateResume } from "../utils/aiApi";
import {
  fetchUserResume,
  listUserResumes,
  stripResumeDocument,
} from "../utils/resumeFirestore";
import {
  coverLetterTitle,
  createUserCoverLetter,
  deleteUserCoverLetter,
  listUserCoverLetters,
} from "../utils/coverLetterFirestore";
import type { ResumeData } from "../types/ResumeData";
import type { ResumeListItem } from "../types/resumeWorkspace";
import type { CoverLetter } from "../types/coverLetter";
import blueOrb from "../blueorb.mp4";

const LAST_COVER_KEY = "brightfolio_last_cover_letter";

const fieldClass =
  "w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#16aeac]/35 focus:border-[#16aeac]";

function readLastCoverId(): string | null {
  try {
    return localStorage.getItem(LAST_COVER_KEY);
  } catch {
    return null;
  }
}

function persistLastCoverId(id: string) {
  try {
    localStorage.setItem(LAST_COVER_KEY, id);
  } catch {
    // ignore
  }
}

export default function CoverLetterCreator() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);

  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const loadLetters = useCallback(async (uid: string) => {
    setLoadingLetters(true);
    try {
      const items = await listUserCoverLetters(uid);
      setLetters(items);
      const lastId = readLastCoverId();
      setActiveId((prev) => {
        if (prev && items.some((l) => l.id === prev)) return prev;
        if (lastId && items.some((l) => l.id === lastId)) return lastId;
        return items[0]?.id ?? null;
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load your cover letters."
      );
      setLetters([]);
    } finally {
      setLoadingLetters(false);
    }
  }, []);

  const loadResumeList = useCallback(async (uid: string) => {
    setLoadingResumes(true);
    setListError(null);
    try {
      const items = await listUserResumes(uid);
      setResumes(items);
      setSelectedResumeId((prev) => {
        if (prev && items.some((item) => item.id === prev)) return prev;
        return items[0]?.id ?? null;
      });
    } catch (e) {
      setListError(
        e instanceof Error ? e.message : "Could not load your resumes."
      );
      setResumes([]);
    } finally {
      setLoadingResumes(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    void loadLetters(user.uid);
    void loadResumeList(user.uid);
  }, [authReady, user, loadLetters, loadResumeList]);

  useEffect(() => {
    if (!user || !selectedResumeId) {
      setSelectedResume(null);
      return;
    }

    let cancelled = false;
    setLoadingSelected(true);
    void (async () => {
      try {
        const resumeDoc = await fetchUserResume(user.uid, selectedResumeId);
        if (cancelled) return;
        if (!resumeDoc) {
          setSelectedResume(null);
          return;
        }
        const { resume } = stripResumeDocument(
          resumeDoc as unknown as Record<string, unknown>
        );
        setSelectedResume(resume);
      } catch {
        if (!cancelled) setSelectedResume(null);
      } finally {
        if (!cancelled) setLoadingSelected(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, selectedResumeId]);

  const companyTrim = company.trim();
  const jobTitleTrim = jobTitle.trim();
  const hiringManagerTrim = hiringManager.trim();
  const jobDescriptionTrim = jobDescription.trim();

  const activeLetter = useMemo(
    () => letters.find((l) => l.id === activeId) ?? null,
    [letters, activeId]
  );

  const continueLetter = useMemo(() => {
    if (!letters.length) return null;
    const lastId = readLastCoverId();
    if (lastId) {
      const match = letters.find((l) => l.id === lastId);
      if (match) return match;
    }
    return letters[0];
  }, [letters]);

  const getPrompt = (resume: ResumeData) => {
    const pi = resume.personalInfo || {};
    const profession = pi.title || "";
    const fullName = pi.fullName || "";
    const email = pi.email || "";
    const phone = pi.phone || "";
    const location = pi.location || "";
    const summary = resume.profile || "";
    const experiences = Array.isArray(resume.experience)
      ? resume.experience
      : [];
    const experienceBullets = experiences
      .map((exp) => {
        const bullets = Array.isArray(exp.description)
          ? exp.description.filter(Boolean).join(" ")
          : "";
        return `- ${exp.title || "Role"} at ${
          exp.company || "Company"
        }: ${bullets}`;
      })
      .join("\n");

    const base = `Write a professional cover letter following Harvard MCS (Mignone Center for Career Success) cover letter guidance.

Structure (required):
1) Opening: State why you are writing, name the exact role (${jobTitleTrim}) and company (${companyTrim}), and briefly why you are a fit.
2) Middle (1-2 short paragraphs): Connect 1-2 specific, evidence-backed examples from the candidate's experience to the role needs. Do not restate the full resume. Prefer action verbs and concrete outcomes.
3) Closing: Reiterate interest, invite next steps, include phone and email for contact, thank the reader. Sign off with "Sincerely," then the candidate's name.

Harvard style rules:
- One page feel: concise, factual, about 180-250 words of body text.
- Tailor to this employer and role; no generic template language.
- Address a specific person when a hiring manager is provided (use a colon after the greeting, e.g. Dear Jordan Lee:). If no name, use "Dear Hiring Manager:" or "To Whom It May Concern:" - do not invent a name.
- Do not overuse "I" at the start of every sentence.
- Avoid flowery or vague language.
- Use only real facts from the candidate data. Never invent employers, degrees, metrics, or skills.
- No bracket placeholders of any kind. If a field is missing, omit that line.

Anti-AI style (critical - omit these):
- Do NOT use em dashes, en dashes, or ellipsis characters. Use commas, periods, or "and" instead.
- Do NOT use curly/smart quotes; use straight quotes only if needed.
- Do NOT use emoji, markdown, bold, bullets, or numbered lists in the letter body.
- Avoid AI cliche words/phrases: delve, leverage, utilize, robust, seamless, cutting-edge, passionate about, excited to, thrilled, synergy, landscape, tapestry, underscore, pivotal, elevate, foster, harness, spearhead, "I am writing to express my interest", "I am confident that", "stands out", "proven track record", "dynamic", "results-driven", "in today's fast-paced".
- Prefer plain, direct sentences a careful human would write.`;

    const header = `Candidate: ${fullName}\nTitle: ${profession}\nEmail: ${email}\nPhone: ${phone}\nLocation: ${location}`;
    const resumeBlock = `Summary: ${summary}\nExperience:\n${experienceBullets}`;
    const jobBlock = [
      `Target company: ${companyTrim}`,
      `Target role: ${jobTitleTrim}`,
      hiringManagerTrim
        ? `Hiring manager: ${hiringManagerTrim}`
        : "Hiring manager: (not provided)",
      jobDescriptionTrim
        ? `Job description:\n${jobDescriptionTrim}`
        : "Job description: (not provided; tailor using company and role title only)",
    ].join("\n");

    return `${base}\n\n${header}\n\n${resumeBlock}\n\n${jobBlock}\n\nOutput only the finished cover letter text (greeting through signature). No preamble or notes.`;
  };

  const stripAiTells = (text: string) => {
    return text
      .replace(/\u2014/g, ", ")
      .replace(/\u2013/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u00A0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/,(\s*),+/g, ",")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  };

  const personalizeOutput = (content: string, resume: ResumeData) => {
    const pi = resume.personalInfo || {};
    const replacements: Record<string, string> = {
      "[Your Name]": pi.fullName || "",
      "[Email Address]": pi.email || "",
      "[Phone Number]": pi.phone || "",
      "[City, State, Zip]": pi.location || "",
      "[Your Address]": "",
      "[Date]": new Date().toLocaleDateString(),
      "[Hiring Manager's Name]": hiringManagerTrim,
      "[Company Name]": companyTrim,
      "[Company Address]": "",
      "[Job Title]": jobTitleTrim,
      "[Position]": jobTitleTrim,
    };
    let out = content;
    for (const [needle, val] of Object.entries(replacements)) {
      const regex = new RegExp(
        needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      out = out.replace(regex, val);
    }
    out = out
      .split("\n")
      .filter((line) => !line.trim().match(/^\[.*\]$/))
      .join("\n");
    return stripAiTells(out);
  };

  const openLetter = (letter: CoverLetter) => {
    setActiveId(letter.id);
    persistLastCoverId(letter.id);
    setShowCreator(false);
    setCopied(false);
  };

  const generateCoverLetter = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    if (!selectedResumeId || !selectedResume) {
      setError("Select a resume to generate from.");
      return;
    }
    if (!companyTrim || !jobTitleTrim) {
      setError("Enter the company and role you’re applying to.");
      return;
    }

    const resumeMeta = resumes.find((r) => r.id === selectedResumeId);

    setIsLoading(true);
    setError(null);
    setCopied(false);
    try {
      const token = await user.getIdToken();
      const data = await postGenerateResume(token, {
        prompt: getPrompt(selectedResume),
      });
      const content = personalizeOutput(data.content || "", selectedResume);
      if (!content.trim()) {
        throw new Error("No cover letter was returned. Try again.");
      }

      const saved = await createUserCoverLetter(user.uid, {
        company: companyTrim,
        jobTitle: jobTitleTrim,
        hiringManager: hiringManagerTrim,
        content,
        resumeId: selectedResumeId,
        resumeTitle: resumeMeta?.title || "Resume",
      });

      setLetters((prev) => [saved, ...prev.filter((l) => l.id !== saved.id)]);
      openLetter(saved);
      setCompany("");
      setJobTitle("");
      setHiringManager("");
      setJobDescription("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate cover letter. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!activeLetter?.content) return;
    navigator.clipboard.writeText(activeLetter.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeLetter?.content) return;
    const blob = new Blob([activeLetter.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = `${activeLetter.jobTitle || "cover"}_${activeLetter.company || "letter"}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    a.download = `${slug || "cover_letter"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (letter: CoverLetter) => {
    if (!user) return;
    setDeletingId(letter.id);
    setError(null);
    try {
      await deleteUserCoverLetter(user.uid, letter.id);
      setLetters((prev) => {
        const next = prev.filter((l) => l.id !== letter.id);
        if (activeId === letter.id) {
          const fallback = next[0] ?? null;
          setActiveId(fallback?.id ?? null);
          if (fallback) persistLastCoverId(fallback.id);
        }
        return next;
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not delete this cover letter."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const canGenerate =
    Boolean(selectedResume) &&
    !loadingSelected &&
    Boolean(companyTrim) &&
    Boolean(jobTitleTrim);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16aeac]" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
          <p className="text-2xl font-bold bg-gradient-to-r from-[#16aeac] to-black dark:to-white bg-clip-text text-transparent">
            Brightfolio
          </p>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-zinc-100">
            Cover letter
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 text-center max-w-sm">
            Sign in to generate and save cover letters from your resumes.
          </p>
          <button
            type="button"
            onClick={() => setShowSignInModal(true)}
            className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#16aeac] text-white font-semibold hover:opacity-90"
          >
            Sign in
          </button>
          <Link
            to="/resume"
            className="mt-4 text-sm font-medium text-[#16aeac] hover:opacity-80"
          >
            Back to resumes
          </Link>
        </div>
        <SignInModal
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          onSuccess={() => setShowSignInModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <ResumeShell
        activeTab="coverLetter"
        sidebarOpen={sidebarOpen}
        onSidebarOpen={() => setSidebarOpen(true)}
        onSidebarClose={() => setSidebarOpen(false)}
        mode="coverLetter"
        onCreateCoverLetter={() => setShowCreator((open) => !open)}
      >
        <div className="w-full max-w-3xl self-start space-y-8">
          {(showCreator || isLoading) && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  New cover letter
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Pick a resume, name the job, then generate a Harvard-style
                  letter.
                </p>
              </div>

              {isLoading ? (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-12 sm:px-10">
                  <div className="max-w-md mx-auto flex flex-col items-center space-y-6">
                    <div className="h-12 w-12 rounded-full border-2 border-[#16aeac]/30 border-t-[#16aeac] animate-spin" />
                    <div className="space-y-2 text-center">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                        Writing your cover letter
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Tailoring to {jobTitleTrim || "the role"} at{" "}
                        {companyTrim || "the company"}…
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-7 py-5 space-y-5 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#16aeac]">
                        Resume
                      </p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        We’ll write from the resume you select.
                      </p>
                    </div>
                    {loadingResumes ? (
                      <div className="space-y-2">
                        {[0, 1].map((i) => (
                          <div
                            key={i}
                            className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse"
                          />
                        ))}
                      </div>
                    ) : listError ? (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {listError}
                      </p>
                    ) : resumes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 px-4 py-6 text-center">
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          Create a resume first.
                        </p>
                        <Link
                          to="/resume"
                          className="mt-3 inline-flex text-sm font-semibold text-[#16aeac] hover:opacity-80"
                        >
                          Go to resumes
                        </Link>
                      </div>
                    ) : (
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {resumes.map((item) => {
                          const selected = item.id === selectedResumeId;
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedResumeId(item.id)}
                                className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                                  selected
                                    ? "border-[#16aeac] bg-[#16aeac]/10 ring-1 ring-[#16aeac]/30"
                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                }`}
                              >
                                <span
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                    selected
                                      ? "bg-[#16aeac] text-white"
                                      : "bg-zinc-100 dark:bg-zinc-900 text-[#16aeac]"
                                  }`}
                                >
                                  <DocumentTextIcon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                    {item.title}
                                  </span>
                                  <span className="block text-xs text-zinc-500 truncate">
                                    {item.subtitle}
                                  </span>
                                </span>
                                {selected ? (
                                  <CheckCircleSolidIcon className="h-5 w-5 text-[#16aeac] shrink-0" />
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="px-5 sm:px-7 py-5 space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#16aeac]">
                        Job
                      </p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Company and role are required.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="cover-company"
                          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
                        >
                          Company
                        </label>
                        <input
                          id="cover-company"
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Stripe"
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="cover-job-title"
                          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
                        >
                          Role / job title
                        </label>
                        <input
                          id="cover-job-title"
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Product Designer"
                          className={fieldClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="cover-hiring-manager"
                        className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
                      >
                        Hiring manager{" "}
                        <span className="font-normal text-zinc-400">
                          (optional)
                        </span>
                      </label>
                      <input
                        id="cover-hiring-manager"
                        type="text"
                        value={hiringManager}
                        onChange={(e) => setHiringManager(e.target.value)}
                        placeholder="e.g. Jordan Lee"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="cover-job-description"
                        className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5"
                      >
                        Job description{" "}
                        <span className="font-normal text-zinc-400">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        id="cover-job-description"
                        className={`${fieldClass} min-h-[8rem] resize-y`}
                        rows={5}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job posting for a tighter match…"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#16aeac] text-white font-semibold hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed"
                        onClick={() => void generateCoverLetter()}
                        disabled={isLoading || !canGenerate}
                      >
                        <SparklesIcon className="h-5 w-5" />
                        {loadingSelected
                          ? "Loading resume…"
                          : "Generate cover letter"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreator(false)}
                        className="px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        Cancel
                      </button>
                    </div>
                    {error && showCreator ? (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </section>
          )}

          {error && !showCreator && !isLoading ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {continueLetter ? "Continue writing" : "Create a cover letter"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {continueLetter
                  ? "Open the letter you worked on most recently."
                  : "Generate a tailored letter from one of your resumes."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!continueLetter) {
                  setShowCreator(true);
                  return;
                }
                openLetter(continueLetter);
              }}
              className="group relative w-full overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/40 text-left shadow-sm transition-transform duration-300 hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16aeac] focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-[#0a0a0a] dark:focus-visible:ring-offset-zinc-950"
            >
              <div
                className="pointer-events-none absolute inset-0 hidden sm:block"
                aria-hidden
              >
                <video
                  src={blueOrb}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  className="absolute -right-6 top-1/2 h-[140%] w-[55%] -translate-y-1/2 scale-110 object-cover opacity-80 blur-md motion-reduce:hidden dark:invert"
                />
                <div className="absolute inset-0 bg-sky-50/40 backdrop-blur-[2px] dark:bg-black/35 dark:backdrop-blur-md" />
                <div className="absolute inset-0 bg-gradient-to-r from-sky-50 from-[35%] via-sky-50/90 via-[58%] to-sky-50/15 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/90 dark:to-[#0a0a0a]/20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,_rgba(2,132,199,0.16),_transparent_55%)]" />
              </div>

              <div className="relative z-10 flex items-center gap-4 p-5 sm:gap-6 sm:p-7">
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-[#16aeac] group-hover:border-[#16aeac]/50 group-hover:bg-[#16aeac]/5 dark:border-white/15 dark:bg-white/10 dark:text-white sm:h-[4.5rem] sm:w-[4.5rem]">
                  {continueLetter ? (
                    <EnvelopeIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                  ) : (
                    <PlusIcon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#16aeac]">
                    {continueLetter ? "Recent" : "Get started"}
                  </p>
                  <h3 className="mt-1.5 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl line-clamp-2">
                    {continueLetter
                      ? coverLetterTitle(continueLetter)
                      : "Create a cover letter for your next application"}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {continueLetter
                      ? `${continueLetter.resumeTitle} · ${continueLetter.createdAt.toLocaleDateString()}`
                      : "Pick a resume, add company and role, then generate."}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {continueLetter
                        ? "Tap to open"
                        : "Ready when you are"}
                    </span>
                    <span className="font-medium text-[#16aeac]">
                      {continueLetter ? "View letter" : "Tap to create"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </section>

          {activeLetter && !showCreator ? (
            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden animate-[fadeIn_0.35s_ease-out]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-7 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#16aeac]">
                    Selected
                  </p>
                  <h2 className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {coverLetterTitle(activeLetter)}
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                      copied ? "opacity-70" : ""
                    }`}
                    onClick={handleCopy}
                  >
                    <ClipboardIcon className="h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#16aeac] text-white text-sm font-semibold hover:opacity-90"
                    onClick={handleDownload}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    .txt
                  </button>
                </div>
              </div>
              <div className="px-5 sm:px-7 py-5 bg-zinc-50/70 dark:bg-zinc-900/40">
                <textarea
                  className="w-full p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-700 rounded-sm bg-white dark:bg-zinc-950 shadow-sm focus:outline-none text-zinc-900 dark:text-zinc-100 text-[15px] leading-relaxed resize-none focus:ring-2 focus:ring-[#16aeac]/30 font-serif"
                  rows={14}
                  value={activeLetter.content}
                  readOnly
                  style={{ minHeight: 280 }}
                />
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Your cover letters
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Letters you’ve generated. Use + next to your name to create one.
              </p>
            </div>

            {loadingLetters ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : letters.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 px-6 py-10 text-center">
                <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#16aeac]/10 text-[#16aeac] border border-[#16aeac]/20">
                  <EnvelopeIcon className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                  No cover letters yet
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Tap + next to your name to create one from a saved resume.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {letters.map((letter) => {
                  const isActive = activeId === letter.id;
                  return (
                    <li
                      key={letter.id}
                      className={`rounded-2xl border shadow-sm transition-colors ${
                        isActive
                          ? "border-[#16aeac]/50 bg-[#16aeac]/5 dark:bg-[#16aeac]/10"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openLetter(letter)}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                            isActive
                              ? "bg-[#16aeac] border-[#16aeac] text-white"
                              : "bg-[#16aeac]/10 border-[#16aeac]/20 text-[#16aeac]"
                          }`}
                          aria-label={`Open ${coverLetterTitle(letter)}`}
                        >
                          <EnvelopeIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openLetter(letter)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {coverLetterTitle(letter)}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                            {letter.resumeTitle} ·{" "}
                            {letter.createdAt.toLocaleDateString()}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(letter)}
                          disabled={deletingId === letter.id}
                          className="p-2 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40"
                          aria-label={`Delete ${coverLetterTitle(letter)}`}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </ResumeShell>

      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={() => setShowSignInModal(false)}
      />
    </>
  );
}
