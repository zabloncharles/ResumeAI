import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bunny1 from "../bunny1.png";

const quotes = [
  {
    text: "Your resume is your story, let's make it compelling",
    author: "Brightfolio",
  },
  {
    text: "The best preparation for tomorrow is doing your best today",
    author: "H. Jackson Brown Jr.",
  },
  {
    text: "Success is not final, failure is not fatal",
    author: "Winston Churchill",
  },
  {
    text: "Your career is a journey, not a destination",
    author: "Brightfolio",
  },
  {
    text: "Excellence is not a skill, it's an attitude",
    author: "Ralph Marston",
  },
  {
    text: "The future depends on what you do today",
    author: "Mahatma Gandhi",
  },
  {
    text: "Every achievement begins with the decision to try",
    author: "Brightfolio",
  },
  {
    text: "Your potential is endless. Go do what you were created to do",
    author: "Brightfolio",
  },
  {
    text: "The only way to do great work is to love what you do",
    author: "Steve Jobs",
  },
  {
    text: "Your resume is ready to make an impact",
    author: "Brightfolio",
  },
];

const LoadingPage = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    const quoteInterval = setInterval(() => {
      setIsQuoteVisible(false);

      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        setIsQuoteVisible(true);
      }, 500);
    }, 5000);

    const timer = setTimeout(() => {
      navigate("/resume");
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearInterval(quoteInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="flex flex-col items-center space-y-8">
          <div className="relative flex justify-center">
            <img
              src={bunny1}
              alt="Brightfolio"
              className="h-16 w-16 object-contain animate-pulse"
            />
          </div>

          <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-[#16aeac] transition-all duration-100 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
              Preparing Your Resume Builder
            </h2>
            <p className="text-gray-500 dark:text-zinc-400">
              Setting up your workspace...
            </p>
          </div>

          <div
            className={`mt-8 text-center transition-all duration-1000 ease-in-out transform ${
              isQuoteVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-lg text-gray-700 dark:text-zinc-300 italic">
              "{quotes[currentQuoteIndex].text}"
            </p>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-2">
              — {quotes[currentQuoteIndex].author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
