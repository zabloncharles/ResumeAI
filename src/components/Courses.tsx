import Navbar from './Navbar';
import { useState } from 'react';
import { AcademicCapIcon, CheckCircleIcon, ArrowRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const stepColors = [
  'bg-blue-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-green-400',
  'bg-yellow-400',
  'bg-indigo-400',
];
const stepIcons = [AcademicCapIcon, BookOpenIcon, CheckCircleIcon];

const boardColumns = [
  { key: 'planned', label: 'Planned', color: 'text-purple-500', dot: 'bg-purple-400' },
  { key: 'inprogress', label: 'In Progress', color: 'text-blue-500', dot: 'bg-blue-400' },
  { key: 'released', label: 'Released', color: 'text-green-500', dot: 'bg-green-400' },
];

const Courses = () => {
  const [profession, setProfession] = useState('');
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [view, setView] = useState<'timeline' | 'board'>('timeline');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSteps([]);
    try {
      const response = await fetch('/.netlify/functions/generateCareerPath', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profession }),
      });
      if (!response.ok) throw new Error('Failed to generate career path');
      const data = await response.json();
      // For demo: randomly assign status to steps if not present
      const statuses = ['planned', 'inprogress', 'released'];
      const stepsWithStatus = (data.steps || []).map((step: any, idx: number) => ({
        ...step,
        status: step.status || statuses[idx % statuses.length],
      }));
      setSteps(stepsWithStatus);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex flex-col items-center py-0 px-4">
        {/* Hero Section */}
        <div className="w-full flex flex-col items-center justify-center pt-28 pb-10 mb-0">
          <div className="max-w-2xl w-full mx-auto flex flex-col items-center text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">Find Your Path to Success</h1>
            <p className="text-lg text-gray-500 mb-8">Enter your dream profession and get a personalized, actionable roadmap with the best courses and certifications to land your next job.</p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-xl mx-auto w-full mb-2">
              <input
                type="text"
                className="flex-1 px-6 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white text-gray-900 text-lg shadow-sm transition-all placeholder:text-gray-400"
                placeholder="e.g. Data Scientist, UX Designer, Cloud Engineer"
                value={profession}
                onChange={e => setProfession(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold text-lg shadow-md hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>
                    <ArrowRightIcon className="w-5 h-5" />
                    Get My Roadmap
                  </>
                )}
              </button>
            </form>
            {error && <div className="text-red-500 text-center mt-2 font-medium animate-pulse">{error}</div>}
          </div>
        </div>

        {/* Toggle Menu */}
        <div className="flex justify-center mb-10 gap-4">
          <div className="inline-flex rounded-full bg-white border border-gray-200 p-1 shadow-sm">
            <button
              className={`px-6 py-2 rounded-full font-semibold text-lg transition-all ${view === 'timeline' ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
              onClick={() => setView('timeline')}
            >
              Timeline
            </button>
            <button
              className={`px-6 py-2 rounded-full font-semibold text-lg transition-all ${view === 'board' ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
              onClick={() => setView('board')}
            >
              Board
            </button>
          </div>
        </div>

        {/* Roadmap Section */}
        {view === 'timeline' && (
          <div className="w-full max-w-6xl mx-auto pb-16">
            {steps.length > 0 && (
              <>
                <div className="relative rounded-2xl py-12 px-2 shadow-md overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {/* Horizontal timeline with scroll */}
                  <div className="flex items-center relative min-w-[700px]" style={{ minWidth: steps.length * 260 + 'px' }}>
                    {/* Timeline line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-gray-100 rounded-full z-0" style={{ transform: 'translateY(-50%)' }} />
                    {steps.map((step, idx) => {
                      const Icon = stepIcons[idx % stepIcons.length];
                      // Active color for first N steps, gray for the rest
                      const isActive = idx === 0 || idx === 1 || idx === 2; // Example: first 3 active
                      const dotColor = isActive ? 'bg-blue-400 border-blue-400' : 'bg-gray-200 border-gray-300';
                      return (
                        <div key={idx} className="relative flex flex-col items-center mx-6 z-10" style={{ minWidth: 240 }}>
                          <div className="relative flex flex-col items-center w-full">
                            {/* Card above the line */}
                            <div className={`bg-white rounded-xl border ${isActive ? 'border-blue-400 shadow-md' : 'border-gray-100 shadow-sm'} px-7 py-6 text-left text-gray-900 transition-all w-full`}>
                              <div className="text-lg font-semibold mb-2">Step {idx + 1}</div>
                              <div className="text-sm text-blue-700 mb-2">{step.title}</div>
                              <div className="text-xs text-gray-500 mb-2">{step.description}</div>
                              {step.links && step.links.length > 0 && (
                                <ul className="list-disc ml-5 space-y-1 text-xs text-blue-500 mt-2">
                                  {step.links.map((link: any, lidx: number) => (
                                    <li key={lidx}>
                                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                        <BookOpenIcon className="w-3 h-3 inline-block" />
                                        {link.label}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            {/* Node on the line, always centered below card */}
                            <div className={`absolute left-1/2 -bottom-5 -translate-x-1/2 w-6 h-6 rounded-full border-4 ${dotColor} flex items-center justify-center z-20`}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          {/* Connector line to next node (except last) */}
                          {idx < steps.length - 1 && (
                            <div className="w-24 h-px bg-gray-200 my-8" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Navigation arrows (scroll buttons) */}
                  <div className="flex justify-center mt-8 gap-2">
                    <button className="w-8 h-8 rounded bg-white text-blue-400 flex items-center justify-center border border-blue-200 hover:bg-blue-100 hover:text-blue-600 transition-all" aria-label="Scroll left">
                      <span className="text-lg">&#60;</span>
                    </button>
                    <button className="w-8 h-8 rounded bg-white text-blue-400 flex items-center justify-center border border-blue-200 hover:bg-blue-100 hover:text-blue-600 transition-all" aria-label="Scroll right">
                      <span className="text-lg">&#62;</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* How it works Section */}
        <div className="w-full max-w-4xl mx-auto mt-20 mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">1</div>
              <div className="font-semibold text-gray-900 mb-1">Enter Profession</div>
              <div className="text-gray-500 text-sm">Type your dream job or field to get started.</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">2</div>
              <div className="font-semibold text-gray-900 mb-1">Get Roadmap</div>
              <div className="text-gray-500 text-sm">Receive a step-by-step, AI-powered learning path.</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">3</div>
              <div className="font-semibold text-gray-900 mb-1">Start Learning</div>
              <div className="text-gray-500 text-sm">Follow the roadmap and achieve your career goals.</div>
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
        <footer className="bg-black text-white py-20 w-full">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
              {/* Column 1 - About */}
              <div className="col-span-1">
                <p className="text-lg mb-8">
                  Stay connected, explore opportunities, and build your career with confidence. Your success story starts here
                </p>
                <div className="flex gap-4">
                  <a href="#" className="text-white hover:text-gray-300 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                  <a href="#" className="text-white hover:text-gray-300 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                    </svg>
                  </a>
                  <a href="#" className="text-white hover:text-gray-300 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-white hover:text-gray-300 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Column 2 - Navigation */}
              <div className="col-span-1">
                <ul className="space-y-4">
                  <li><a href="/" className="hover:text-gray-300 transition-colors">Home</a></li>
                  <li><a href="/services" className="hover:text-gray-300 transition-colors">Services</a></li>
                  <li><a href="/resume" className="hover:text-gray-300 transition-colors">Resume Builder</a></li>
                  <li><a href="/templates" className="hover:text-gray-300 transition-colors">Templates</a></li>
                </ul>
              </div>

              {/* Column 3 - Legal */}
              <div className="col-span-1">
                <ul className="space-y-4">
                  <li><a href="/about" className="hover:text-gray-300 transition-colors">About</a></li>
                  <li><a href="/contact" className="hover:text-gray-300 transition-colors">Contact</a></li>
                  <li><a href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-gray-300 transition-colors">Terms & Conditions</a></li>
                </ul>
              </div>

              {/* Column 4 - Logo */}
              <div className="col-span-1">
                <div className="flex items-center justify-end h-full">
                  <span className="text-2xl font-bold">ResumeAI</span>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center text-gray-400 text-sm">
              All Rights Reserved 2024 | ResumeAI
            </div>
          </div>
        </footer>
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </>
  );
};

export default Courses; 