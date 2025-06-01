import { useState } from 'react';
import { DocumentTextIcon, BriefcaseIcon, ClipboardIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface CoverLetterCreatorProps {
  resumeData: any;
}

const CoverLetterCreator = ({ resumeData }: CoverLetterCreatorProps) => {
  const [mode, setMode] = useState<'resume' | 'job'>('resume');
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getPrompt = () => {
    const profession = resumeData.personalInfo.title || '';
    const summary = resumeData.profile || '';
    const experience = resumeData.experience?.map((exp: any) => `- ${exp.title} at ${exp.company}: ${exp.description.join(' ')}`).join('\n') || '';
    if (mode === 'resume') {
      return `Generate a professional cover letter for a ${profession} using the following resume information.\nSummary: ${summary}\nExperience:\n${experience}\nMake it concise, compelling, and suitable for job applications.`;
    } else {
      return `Generate a professional cover letter for a ${profession} using the following resume information.\nSummary: ${summary}\nExperience:\n${experience}\nTailor the cover letter to this job description: ${jobDescription}\nMake it concise, compelling, and aligned with the job requirements.`;
    }
  };

  const generateCoverLetter = async () => {
    setIsLoading(true);
    setError(null);
    setCoverLetter('');
    setCopied(false);
    const prompt = getPrompt();
    try {
      const response = await fetch('/.netlify/functions/generateResume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate cover letter');
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      setCoverLetter(data.content || '');
    } catch (err) {
      setError('Failed to generate cover letter. Please try again.');
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
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover_letter.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto mt-10 animate-fade-in">
      <div className="flex items-center mb-6">
        <SparklesIcon className="h-7 w-7 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold">AI Cover Letter Generator</h2>
      </div>
      <p className="text-gray-600 mb-6">Generate a tailored, professional cover letter in seconds. Choose to use your resume or target a specific job description for best results.</p>
      <div className="flex space-x-4 mb-8">
        <button
          className={`flex-1 flex flex-col items-center p-4 rounded-lg border transition-colors ${mode === 'resume' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}
          onClick={() => setMode('resume')}
        >
          <DocumentTextIcon className="h-8 w-8 mb-2 text-blue-600" />
          <span className="font-semibold">From Resume</span>
          <span className="text-xs text-gray-500 mt-1">Use your resume details to create a general cover letter.</span>
        </button>
        <button
          className={`flex-1 flex flex-col items-center p-4 rounded-lg border transition-colors ${mode === 'job' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}
          onClick={() => setMode('job')}
        >
          <BriefcaseIcon className="h-8 w-8 mb-2 text-blue-600" />
          <span className="font-semibold">For Specific Job</span>
          <span className="text-xs text-gray-500 mt-1">Paste a job description to tailor your cover letter.</span>
        </button>
      </div>
      {mode === 'job' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Paste Job Description</label>
          <textarea
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
            rows={6}
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
          />
        </div>
      )}
      <button
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-semibold mb-4 flex items-center justify-center"
        onClick={generateCoverLetter}
        disabled={isLoading || (mode === 'job' && !jobDescription.trim())}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            Generating...
          </>
        ) : (
          <>
            <SparklesIcon className="h-5 w-5 mr-2" /> Generate Cover Letter
          </>
        )}
      </button>
      {error && <div className="text-red-600 mb-4 flex items-center"><span className="mr-2">❌</span>{error}</div>}
      {coverLetter && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 relative animate-fade-in">
          <label className="block text-sm font-medium text-gray-700 mb-2">Generated Cover Letter</label>
          <textarea
            className="w-full p-3 border rounded-md bg-gray-100 text-gray-800 font-mono text-sm"
            rows={12}
            value={coverLetter}
            readOnly
          />
          <div className="flex space-x-2 mt-2">
            <button
              className={`flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${copied ? 'opacity-70' : ''}`}
              onClick={handleCopy}
            >
              <ClipboardIcon className="h-5 w-5 mr-1" /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={handleDownload}
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-1" /> Download as .txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverLetterCreator; 