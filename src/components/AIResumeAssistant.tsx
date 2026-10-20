import { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import Orb from "./Orb";
import SignInModal from "./SignInModal";
import { postGenerateResume } from "../utils/aiApi";
import { parseAiBulletLines } from "../utils/parseAiBullets";
import {
  buildIvySectionPrompt,
  ivyAiGuidanceLabel,
} from "@shared/ivyAiGuidelines.js";

interface AIResumeAssistantProps {
  profession: string;
  onSuggestionSelect: (suggestion: string) => void;
  disabled?: boolean;
  section: string | null;
  onSuggestionsChange?: (suggestions: string[]) => void;
  templateId?: string;
}

const AIResumeAssistant = ({
  profession,
  onSuggestionSelect,
  disabled = false,
  section,
  onSuggestionsChange,
  templateId = "harvard-mcs",
}: AIResumeAssistantProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (onSuggestionsChange) {
      onSuggestionsChange(suggestions);
    }
  }, [suggestions, onSuggestionsChange]);

  function buildPrompt(profession: string, section: string | null) {
    return buildIvySectionPrompt(templateId, section, profession);
  }

  const guidanceLabel = ivyAiGuidanceLabel(templateId);

  const generateSuggestions = async () => {
    const currentUser = auth.currentUser || user;
    // Avoid flashing the sign-in modal before auth resolves
    if (!authReady) return;
    if (!currentUser) {
      setShowSignInModal(true);
      return;
    }

    const prompt = buildPrompt(profession, section);
    if (!prompt.trim()) {
      setError("Add a job title first, then try again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const token = await currentUser.getIdToken();
      const data = await postGenerateResume(token, {
        prompt,
        profession,
        section,
        templateId,
      });
      const content = data.content || "";
      const newSuggestions = parseAiBulletLines(content);

      if (newSuggestions.length === 0) {
        setError(
          content.trim()
            ? "Could not read suggestions from the response. Try again."
            : "No suggestions returned. Try again."
        );
        return;
      }

      setSuggestions(newSuggestions);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-start space-x-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                AI Suggestions
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Suggestions follow {guidanceLabel} resume guidelines for your
                selected template.
              </p>
            </div>
            <div className="w-24 h-24 ml-4">
              <Orb className="w-full h-full" isLoading={isLoading} />
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-4 space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="group relative bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-[#16aeac] transition-colors duration-200"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-zinc-800 dark:text-zinc-200">
                          {suggestion}
                        </p>
                      </div>
                      <button
                        onClick={() => onSuggestionSelect(suggestion)}
                        className="ml-4 inline-flex items-center p-1.5 rounded-full text-[#16aeac] hover:bg-[#16aeac] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac] transition-all duration-200"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={generateSuggestions}
              disabled={disabled || isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#16aeac] hover:bg-[#16aeac]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? "Generating..." : "Generate Suggestions"}
            </button>
          </div>
        </div>
      </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={() => {
          setShowSignInModal(false);
          // Optionally auto-generate suggestions after successful sign-in
          setTimeout(() => {
            if (auth.currentUser) {
              generateSuggestions();
            }
          }, 1000);
        }}
      />
    </div>
  );
};

export default AIResumeAssistant;
