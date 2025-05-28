import { useState } from 'react';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface AIResumeAssistantProps {
  profession: string;
  summary?: string;
  onSuggestionSelect: (suggestion: string) => void;
  disabled?: boolean;
}

const AIResumeAssistant = ({ profession, summary = '', onSuggestionSelect, disabled = false }: AIResumeAssistantProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Debug logging
    console.log('Environment variables:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length,
      envKeys: Object.keys(import.meta.env)
    });
    
    if (!apiKey) {
      setError('OpenAI API key is not configured. Please contact support if this error persists.');
      setIsLoading(false);
      return;
    }

    // Build the prompt based on context
    let userPrompt = '';
    if (summary && summary.trim().length > 0) {
      userPrompt = `Rewrite the following professional summary to make it more compelling, concise, and professional. Provide 5 improved versions as bullet points.\n\nSummary: ${summary.trim()}`;
    } else if (profession && profession.trim().length > 0) {
      userPrompt = `Generate 5 impactful resume bullet points for the job title: ${profession}. Each bullet should describe a specific achievement, responsibility, or result that would impress a recruiter and help land an interview. Use action verbs, quantify results where possible, and keep each point concise and professional. Return as bullet points.`;
    } else {
      userPrompt = `Generate 5 professional summary statements for a resume. Each should be concise, compelling, and tailored for a resume. Return as bullet points.`;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an expert resume writer and career coach. Focus on:
              1. Professional, concise, and compelling language
              2. Resume-appropriate tone
              3. Action-oriented and achievement-focused statements
              4. For employment history, focus on bullet points that describe what the candidate did at the job that would help them land an interview. Use action verbs and quantify results where possible.
              Return only the 5 best bullet points as bullet points.`
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate suggestions');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
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