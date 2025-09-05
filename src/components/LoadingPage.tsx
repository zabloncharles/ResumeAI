import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const quotes = [
  {
    text: "Your resume is your story, let's make it compelling",
    author: "Resume AI"
  },
  {
    text: "The best preparation for tomorrow is doing your best today",
    author: "H. Jackson Brown Jr."
  },
  {
    text: "Success is not final, failure is not fatal",
    author: "Winston Churchill"
  },
  {
    text: "Your career is a journey, not a destination",
    author: "Resume AI"
  },
  {
    text: "Excellence is not a skill, it's an attitude",
    author: "Ralph Marston"
  },
  {
    text: "The future depends on what you do today",
    author: "Mahatma Gandhi"
  },
  {
    text: "Every achievement begins with the decision to try",
    author: "Resume AI"
  },
  {
    text: "Your potential is endless. Go do what you were created to do",
    author: "Resume AI"
  },
  {
    text: "The only way to do great work is to love what you do",
    author: "Steve Jobs"
  },
  {
    text: "Your resume is ready to make an impact",
    author: "Resume AI"
  }
];

const LoadingPage = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);

  useEffect(() => {
    // Animate progress bar - 4 seconds total
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1; // 1% every 40ms = 4 seconds total
      });
    }, 40);

    // Rotate quotes every 5 seconds with fade transition
    const quoteInterval = setInterval(() => {
      // Start fade out
      setIsQuoteVisible(false);
      
      // Change quote after fade out
      setTimeout(() => {
        setCurrentQuoteIndex(prev => (prev + 1) % quotes.length);
        // Start fade in
        setIsQuoteVisible(true);
      }, 500); // Half of transition duration
      
    }, 5000);

    // Navigate to resume builder after 4 seconds
    const timer = setTimeout(() => {
      navigate('/resume');
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearInterval(quoteInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="flex flex-col items-center space-y-8">
          {/* Centered Spinner */}
          <div className="relative flex justify-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#16aeac] rounded-full animate-spin"></div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-[#16aeac] transition-all duration-100 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Text */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Preparing Your Resume Builder</h2>
            <p className="text-gray-500">Setting up your workspace...</p>
          </div>

          {/* Quotes Section */}
          <div 
            className={`mt-8 text-center transition-all duration-1000 ease-in-out transform ${
              isQuoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-lg text-gray-700 italic">"{quotes[currentQuoteIndex].text}"</p>
            <p className="text-sm text-gray-500 mt-2">— {quotes[currentQuoteIndex].author}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage; 