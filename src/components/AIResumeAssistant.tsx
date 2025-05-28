import { useState } from 'react';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface AIResumeAssistantProps {
  profession: string;
  summary?: string;
  onSuggestionSelect: (suggestion: string) => void;
  disabled?: boolean;
  section: string;
}

const AIResumeAssistant = ({ profession, summary = '', onSuggestionSelect, disabled = false, section }: AIResumeAssistantProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/generateResume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profession, summary, section })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestions');
      }

      const data = await response.json();
      // The OpenAI response is in data.content
      const content = data.content || '';
      const suggestionList = content.split('\n').filter((line: string) => line.trim().startsWith('-'));
      setSuggestions(suggestionList.map((s: string) => s.replace('-', '').trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions. Please try again.');
      console.error('Error generating suggestions:', err);
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
          className={`flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 ${disabled ? 'cursor-not-allowed' : ''}`}
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

      {error && (
        <div className="text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                onSuggestionSelect(suggestion);
                setSuggestions(prev => prev.filter((_, i) => i !== index));
              }}
            >
              <p className="text-sm text-gray-700">{suggestion}</p>
            </div>
          ))}
        </div>
      )}

      {!isLoading && suggestions.length === 0 && !error && (
        <div className="text-sm text-gray-500">
          Click "Get Suggestions" to receive AI-powered resume suggestions tailored to your profession.
        </div>
      )}
    </div>
  );
};

export default AIResumeAssistant; 