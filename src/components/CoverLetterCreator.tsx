import { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  BriefcaseIcon,
  ClipboardIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface CoverLetterCreatorProps {
  resumeData?: any;
}

const CoverLetterCreator = ({ resumeData }: CoverLetterCreatorProps) => {
  const [mode, setMode] = useState<"resume" | "job">("resume");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [effectiveResume, setEffectiveResume] = useState<any>(resumeData || {});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Load resume from localStorage if not provided via props
  useEffect(() => {
    if (!resumeData || Object.keys(resumeData || {}).length === 0) {
      const stored = localStorage.getItem("resume");
      if (stored) {
        try {
          setEffectiveResume(JSON.parse(stored));
        } catch {
          setEffectiveResume(resumeData || {});
        }
      }
    } else {
      setEffectiveResume(resumeData);
    }
  }, [resumeData]);

  const getPrompt = () => {
    const pi = effectiveResume?.personalInfo || {};
    const profession = pi.title || "";
    const fullName = pi.fullName || "";
    const email = pi.email || "";
    const phone = pi.phone || "";
    const location = pi.location || "";
    const summary = effectiveResume?.profile || "";
    const experiences = Array.isArray(effectiveResume?.experience)
      ? effectiveResume.experience
      : [];
    const experienceBullets = experiences
      .map((exp: any) => {
        const bullets = Array.isArray(exp.description)
          ? exp.description.filter(Boolean).join(" ")
          : "";
        return `- ${exp.title || "Role"} at ${exp.company || "Company"}: ${bullets}`;
      })
      .join("\n");

    const base = `You are a helpful assistant writing a professional cover letter. Use the REAL data provided. Do not output any placeholder tokens in brackets. If a field is missing, omit that line entirely. Keep it 180-250 words, confident, and specific. Avoid generic filler. Include 1–2 quantifiable achievements from experience.`;

    const header = `Candidate: ${fullName}\nTitle: ${profession}\nEmail: ${email}\nPhone: ${phone}\nLocation: ${location}`;
    const resumeBlock = `Summary: ${summary}\nExperience:\n${experienceBullets}`;

    if (mode === "resume") {
      return `${base}\n\n${header}\n\n${resumeBlock}\n\nWrite a general-purpose cover letter suitable for applications in this field. Do not use placeholders for company or hiring manager; keep it company-agnostic.`;
    }

    return `${base}\n\n${header}\n\n${resumeBlock}\n\nTailor the cover letter to this job description:\n${jobDescription}\n\nDo not invent missing facts. No bracket placeholders.`;
  };

  // Cleanup common bracket placeholders in model output using known values
  const personalizeOutput = (content: string) => {
    const pi = effectiveResume?.personalInfo || {};
    const replacements: Record<string, string> = {
      "[Your Name]": pi.fullName || "",
      "[Email Address]": pi.email || "",
      "[Phone Number]": pi.phone || "",
      "[City, State, Zip]": pi.location || "",
      "[Your Address]": "",
      "[Date]": new Date().toLocaleDateString(),
      "[Hiring Manager's Name]": "",
      "[Company Name]": "",
      "[Company Address]": "",
    };
    let out = content;
    for (const [needle, val] of Object.entries(replacements)) {
      const regex = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      out = out.replace(regex, val);
    }
    // Remove any remaining bracketed placeholders lines completely
    out = out
      .split("\n")
      .filter((line) => !line.trim().match(/^\[.*\]$/))
      .join("\n");
    return out;
  };

  const generateCoverLetter = async () => {
    setIsLoading(true);
    setError(null);
    setCoverLetter("");
    setCopied(false);
    const prompt = getPrompt();
    try {
      let token = "";
      if (user) {
        token = await user.getIdToken();
      }
      const response = await fetch("/.netlify/functions/generateResume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate cover letter");
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      const raw = data.content || "";
      setCoverLetter(personalizeOutput(raw));
    } catch (err) {
      setError("Failed to generate cover letter. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover_letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      {/* Minimal Generator */}
      <section className="w-full bg-white pt-28 pb-10 px-4">
        <div className="max-w-3xl w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Cover Letter Generator
            </h1>
            <p className="text-gray-600 mt-2">
              Generate a clean, tailored cover letter from your resume or a job description.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="h-5 w-5 text-[#16aeac]" />
              <h2 className="text-lg font-semibold text-gray-900">Start</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                  mode === "resume"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                }`}
                onClick={() => setMode("resume")}
              >
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className={`h-5 w-5 ${mode === "resume" ? "text-white" : "text-gray-700"}`} />
                  <span className="font-medium">From Resume</span>
                </div>
                <div className={`text-xs mt-1 ${mode === "resume" ? "text-white/80" : "text-gray-500"}`}>
                  Uses your saved resume details.
                </div>
              </button>

              <button
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                  mode === "job"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                }`}
                onClick={() => setMode("job")}
              >
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className={`h-5 w-5 ${mode === "job" ? "text-white" : "text-gray-700"}`} />
                  <span className="font-medium">For Specific Job</span>
                </div>
                <div className={`text-xs mt-1 ${mode === "job" ? "text-white/80" : "text-gray-500"}`}>
                  Paste a job description to tailor the letter.
                </div>
              </button>
            </div>

            {mode === "job" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job description
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16aeac] focus:border-[#16aeac]"
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                />
              </div>
            )}

            <button
              className="w-full px-5 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-black transition-colors flex items-center justify-center"
              onClick={generateCoverLetter}
              disabled={isLoading || (mode === "job" && !jobDescription.trim())}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5 mr-2 text-white" /> Generate Cover Letter
                </>
              )}
            </button>

            {error && (
              <div className="text-red-600 mt-4 text-sm">{error}</div>
            )}

            {coverLetter && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Generated cover letter
                </label>
                <textarea
                  className="w-full p-4 border border-gray-200 rounded-lg bg-white focus:outline-none text-gray-900 font-sans text-base leading-relaxed resize-none focus:ring-2 focus:ring-[#16aeac]"
                  rows={12}
                  value={coverLetter}
                  readOnly
                  style={{ minHeight: 220 }}
                />
                <div className="flex flex-col sm:flex-row gap-2 mt-3 justify-end">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 ${
                      copied ? "opacity-70" : ""
                    }`}
                    onClick={handleCopy}
                  >
                    <ClipboardIcon className="h-5 w-5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
                    onClick={handleDownload}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" /> Download .txt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it Works - Minimal */}
      <section className="w-full bg-white px-4 pb-14">
        <div className="max-w-4xl w-full mx-auto grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              icon: <DocumentTextIcon className="h-6 w-6 text-gray-700" />,
              title: "1. Enter Info",
              desc: "Add your resume details or job description.",
            },
            {
              icon: <SparklesIcon className="h-6 w-6 text-gray-700" />,
              title: "2. Generate",
              desc: "Let AI craft a personalized cover letter.",
            },
            {
              icon: <ClipboardIcon className="h-6 w-6 text-gray-700" />,
              title: "3. Copy or Download",
              desc: "Copy to clipboard or download instantly.",
            },
            {
              icon: <BriefcaseIcon className="h-6 w-6 text-gray-700" />,
              title: "4. Apply",
              desc: "Use your new cover letter for any job.",
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center text-center"
            >
              <div className="mb-2">{step.icon}</div>
              <div className="font-semibold text-base text-gray-900 mb-1">
                {step.title}
              </div>
              <div className="text-gray-600 text-sm">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA - Minimal */}
      <section className="w-full bg-white px-4 pb-16">
        <div className="max-w-3xl w-full mx-auto text-center">
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Want a matching resume?</h2>
            <p className="text-gray-600 mb-4">Use our AI Resume Builder for a cohesive application.</p>
            <a
              href="/resume"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-900 text-white font-semibold hover:bg-black"
            >
              Open Resume Builder
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CoverLetterCreator;
