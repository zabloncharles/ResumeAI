import { useState, useEffect } from "react";
import { SparklesIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, increment } from "firebase/firestore";

interface AIResumeAssistantProps {
  profession: string;
  onSuggestionSelect: (suggestion: string) => void;
  disabled?: boolean;
  section: string;
}

function getPrompt(section: string, profession: string) {
  if (section === "personal") {
    if (!profession || profession.trim().length === 0) {
      return {
        error:
          "Please provide a job title in the personal information section to get suggestions.",
      };
    }
    return `List 5 actionable tips or best practices for someone creating a resume for a ${profession} position. Do NOT provide example resume bullet points or work achievements. Instead, give advice on what to include, how to structure the resume, and what skills or experiences to highlight. Return as bullet points.`;
  }
  if (section === "summary" || section === "profile") {
    if (!profession || profession.trim().length === 0) {
      return {
        error:
          "Please provide a job title in the personal information section to get suggestions.",
      };
    }
    return `Generate 5 professional summary statements tailored for a ${profession}. Each summary should be concise, compelling, and highlight the candidate's strengths for this role. Focus on their overall professional identity, key skills, and career goals. Return as bullet points.`;
  }
  if (section === "employment") {
    if (!profession || profession.trim().length === 0) {
      return {
        error:
          "Please provide a job title for this experience to get suggestions.",
      };
    }
    return `Given the job title: ${profession}, generate 5 impactful resume bullet points describing achievements, responsibilities, or results that would impress a recruiter. Use action verbs, quantify results where possible, and keep each point concise. Return as bullet points.`;
  }
  return null;
}

const AIResumeAssistant = ({
  profession,
  onSuggestionSelect,
  disabled = false,
  section,
}: AIResumeAssistantProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    const promptOrError = getPrompt(section, profession);

    if (
      promptOrError &&
      typeof promptOrError === "object" &&
      "error" in promptOrError
    ) {
      setError(promptOrError.error);
      setIsLoading(false);
      return;
    }
    const prompt = promptOrError as string;

    if (!prompt) {
      setError(
        "Please provide a job title in the personal information section to get suggestions."
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/generateResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate suggestions");
        return;
      }

      const data = await response.json();
      const content = data.content || "";
      const totalTokens = data.total_tokens || 0;
      const suggestionList = content
        .split("\n")
        .filter((line: string) => line.trim().startsWith("-"));
      setSuggestions(
        suggestionList.map((s: string) => s.replace("-", "").trim())
      );
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate suggestions. Please try again."
      );
      console.error("Error generating suggestions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-blue-600" />
          <span>AI Resume Assistant</span>
        </h3>
        <button
          onClick={generateSuggestions}
          disabled={isLoading || disabled}
          className={`flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 ${
            disabled ? "cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              <span>Get Suggestions</span>
            </>
          )}
        </button>
      </div>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                onSuggestionSelect(suggestion);
                setSuggestions((prev) => prev.filter((_, i) => i !== index));
              }}
            >
              <p className="text-sm text-gray-700">{suggestion}</p>
            </div>
          ))}
        </div>
      )}

      {!isLoading && suggestions.length === 0 && !error && (
        <div className="text-sm text-gray-500">
          Click "Get Suggestions" to receive AI-powered resume suggestions
          tailored to your profession.
        </div>
      )}
    </div>
  );
};

export default AIResumeAssistant;
