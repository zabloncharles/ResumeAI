import React, { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import Orb from "./Orb";

interface AIResumeAssistantProps {
  profession: string;
  onSuggestionSelect: (suggestion: string) => void;
  disabled?: boolean;
  section: string | null;
  onSuggestionsChange?: (suggestions: string[]) => void;
}

const AIResumeAssistant = ({
  profession,
  onSuggestionSelect,
  disabled = false,
  section,
  onSuggestionsChange,
}: AIResumeAssistantProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (onSuggestionsChange) {
      onSuggestionsChange(suggestions);
    }
  }, [suggestions, onSuggestionsChange]);

  function buildPrompt(profession: string, section: string | null) {
    if (!profession) return "";
    if (section === "profile") {
      return `Generate 5 professional summary statements tailored for a ${profession}. Each summary should be concise, compelling, and highlight the candidate's strengths for this role. Focus on their overall professional identity, key skills, and career goals. Return as bullet points.`;
    }
    if (section === "employment") {
      return `Given the job title: ${profession}, generate 5 impactful resume bullet points describing achievements, responsibilities, or results that would impress a recruiter. Use action verbs, quantify results where possible, and keep each point concise. Return as bullet points.`;
    }
    // Add more cases as needed
    return "";
  }

  const generateSuggestions = async () => {
    if (!user) {
      setError("Please sign in to use this feature");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const token = await user.getIdToken();
      const prompt = buildPrompt(profession, section);
      const response = await fetch("/.netlify/functions/generateResume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          profession,
          section,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate suggestions");
      }

      const data = await response.json();
      const content = data.content || "";
      const newSuggestions = content
        .split("\n")
        .filter((line: string) => line.trim().startsWith("-"))
        .map((line: string) => line.trim().substring(1).trim());

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
              <h3 className="text-lg font-medium text-gray-900">
                AI Suggestions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get AI-powered resume suggestions tailored to your profession.
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
                  className="group relative bg-white rounded-lg border border-gray-200 hover:border-[#16aeac] transition-colors duration-200"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{suggestion}</p>
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

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

          <div className="pt-4">
            <button
              onClick={generateSuggestions}
              disabled={disabled || isLoading}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#16aeac] to-black hover:from-[#139b99] hover:to-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
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
                </>
              ) : (
                "Get Suggestions"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIResumeAssistant;
