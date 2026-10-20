import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import SignInModal from "../SignInModal";
import Orb from "../Orb";
import type { ResumeData } from "../../types/ResumeData";
import type { AtsCheckResult } from "../../types/atsCheck";
import { postAtsCheck } from "../../utils/aiApi";
import { ivyAiGuidanceLabel } from "@shared/ivyAiGuidelines.js";
import {
  resumeTemplates,
  type ResumeTemplateId,
} from "../../constants/resumeTemplates";
import {
  buildAtsResumePayload,
  clearPhoto,
  clearProfile,
  dedupeExperienceBullets,
  findDuplicateExperienceBullets,
  findInconsistentStoredDates,
  templateDiscouragesSummary,
} from "../../utils/resumeHygiene";

type AtsCheckPanelProps = {
  resumeData: ResumeData;
  templateId: ResumeTemplateId;
  onUpdateResume: (next: ResumeData) => void;
};

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreRingColor(score: number) {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

function severityClass(severity: string) {
  if (severity === "high") {
    return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200";
  }
  if (severity === "low") {
    return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
  return "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
}

function AtsCheckPanel({
  resumeData,
  templateId,
  onUpdateResume,
}: AtsCheckPanelProps) {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsCheckResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  const templateMeta = resumeTemplates.find((t) => t.id === templateId);
  const ivyLabel = ivyAiGuidanceLabel(templateId);
  const duplicateBullets = findDuplicateExperienceBullets(resumeData);
  const dateIssues = findInconsistentStoredDates(resumeData);
  const hasPhoto = Boolean(resumeData.personalInfo.photo?.trim());
  const hasProfile = Boolean(resumeData.profile?.trim());
  const summaryDiscouraged = templateDiscouragesSummary(templateId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const runCheck = async () => {
    if (!authReady) return;
    const currentUser = auth.currentUser || user;
    if (!currentUser) {
      setShowSignInModal(true);
      return;
    }
    if (!consent) {
      setError("Confirm that we may send your resume data for analysis.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const { result: next } = await postAtsCheck(token, {
        resumePayload: buildAtsResumePayload(resumeData, templateId),
        templateId,
        templateName: templateMeta?.name,
      });
      setResult(next);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "ATS check failed. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const circumference = 2 * Math.PI * 44;
  const score = result?.score ?? 0;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            ATS Check
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            We analyze your full resume against ATS parsing rules and{" "}
            {ivyLabel} guidelines for{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {templateMeta?.name ?? templateId}
            </span>
            .
          </p>
        </div>
        <div className="w-20 h-20 shrink-0">
          <Orb className="w-full h-full" isLoading={loading} />
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 rounded border-zinc-300 text-[#16aeac] focus:ring-[#16aeac]"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          I agree to send my resume content (title, email, location, experience,
          education, and links—not your full name or phone) to AI for ATS and
          Ivy-style review. Results stay in this panel.
        </span>
      </label>

      {(duplicateBullets > 0 ||
        dateIssues.length > 0 ||
        hasPhoto ||
        (summaryDiscouraged && hasProfile)) && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 p-4 space-y-3">
          <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
            Quick fixes before you apply
          </p>
          <ul className="text-xs text-amber-900/90 dark:text-amber-100/90 space-y-1 list-disc ml-4">
            {summaryDiscouraged && hasProfile ? (
              <li>Professional summary is discouraged for this Ivy template.</li>
            ) : null}
            {duplicateBullets > 0 ? (
              <li>{duplicateBullets} duplicate experience bullet(s) detected.</li>
            ) : null}
            {dateIssues.length > 0 ? (
              <li>Inconsistent date formats in editor ({dateIssues.length}).</li>
            ) : null}
            {hasPhoto ? (
              <li>Photo is stored but not used on Ivy PDF exports.</li>
            ) : null}
          </ul>
          <div className="flex flex-wrap gap-2">
            {summaryDiscouraged && hasProfile ? (
              <button
                type="button"
                className="text-xs px-3 py-1.5 rounded-md border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 hover:bg-amber-100/50 dark:hover:bg-zinc-800"
                onClick={() => onUpdateResume(clearProfile(resumeData))}
              >
                Clear summary
              </button>
            ) : null}
            {duplicateBullets > 0 ? (
              <button
                type="button"
                className="text-xs px-3 py-1.5 rounded-md border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 hover:bg-amber-100/50 dark:hover:bg-zinc-800"
                onClick={() =>
                  onUpdateResume(dedupeExperienceBullets(resumeData))
                }
              >
                Remove duplicate bullets
              </button>
            ) : null}
            {hasPhoto ? (
              <button
                type="button"
                className="text-xs px-3 py-1.5 rounded-md border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 hover:bg-amber-100/50 dark:hover:bg-zinc-800"
                onClick={() => onUpdateResume(clearPhoto(resumeData))}
              >
                Clear stored photo
              </button>
            ) : null}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => void runCheck()}
        disabled={loading || !consent}
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#16aeac] hover:bg-[#16aeac]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Checking…" : "Run ATS check"}
      </button>

      {error ? (
        <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-5 border-t border-zinc-200 dark:border-zinc-800 pt-5">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  className="stroke-zinc-200 dark:stroke-zinc-700"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  className={scoreRingColor(result.score)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center ${scoreTone(result.score)}`}
              >
                <span className="text-2xl font-bold">{result.score}</span>
                <span className="text-xs uppercase tracking-wide">Score</span>
              </div>
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    result.atsReady
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                  }`}
                >
                  {result.atsReady ? "ATS-friendly" : "ATS risks found"}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    result.shouldEdit
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                  }`}
                >
                  {result.shouldEdit ? "Edits recommended" : "Ready to apply"}
                </span>
              </div>
              {result.overview ? (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {result.overview}
                </p>
              ) : null}
            </div>
          </div>

          {result.ivyNotes ? (
            <div className="rounded-lg border border-[#16aeac]/30 bg-[#16aeac]/5 dark:bg-[#16aeac]/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#16aeac] mb-1">
                Ivy template fit
              </p>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                {result.ivyNotes}
              </p>
            </div>
          ) : null}

          {result.strengths.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Strengths
              </h4>
              <ul className="list-disc ml-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {result.strengths.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.recommendations.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Recommendations
              </h4>
              <ul className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-white dark:bg-zinc-900/50"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${severityClass(rec.severity)}`}
                      >
                        {rec.severity}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      {rec.issue}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Fix:{" "}
                      </span>
                      {rec.fix}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={() => {
          setShowSignInModal(false);
          setTimeout(() => {
            if (auth.currentUser && consent) {
              void runCheck();
            }
          }, 800);
        }}
      />
    </div>
  );
}

export default AtsCheckPanel;
