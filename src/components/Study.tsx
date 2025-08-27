import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  mastery: number; // 0-100
}

interface StudySet {
  id: string;
  title: string;
  description: string;
  category: string;
  cardCount: number;
  flashcards: Flashcard[];
  createdAt: Date;
  lastStudied?: Date;
}

const Study = () => {
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'flashcards' | 'quiz' | 'matching'>('flashcards');
  const [isStudying, setIsStudying] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Sample study sets data
  useEffect(() => {
    const sampleSets: StudySet[] = [
      {
        id: '1',
        title: 'JavaScript Fundamentals',
        description: 'Core JavaScript concepts and syntax',
        category: 'Programming',
        cardCount: 25,
        flashcards: [
          { id: '1', front: 'What is a variable?', back: 'A container that stores data values', category: 'Basics', difficulty: 'easy', mastery: 85 },
          { id: '2', front: 'What is the difference between let, const, and var?', back: 'let: block-scoped, const: block-scoped and immutable, var: function-scoped', category: 'Basics', difficulty: 'medium', mastery: 60 },
          { id: '3', front: 'What is a closure?', back: 'A function that has access to variables in its outer scope', category: 'Advanced', difficulty: 'hard', mastery: 30 },
          { id: '4', front: 'What is the event loop?', back: 'A mechanism that handles asynchronous operations in JavaScript', category: 'Advanced', difficulty: 'hard', mastery: 20 },
          { id: '5', front: 'What is destructuring?', back: 'A way to extract values from objects or arrays into distinct variables', category: 'ES6', difficulty: 'medium', mastery: 70 },
        ],
        createdAt: new Date('2024-01-15'),
        lastStudied: new Date('2024-01-20')
      },
      {
        id: '2',
        title: 'React Hooks',
        description: 'Essential React hooks and their usage',
        category: 'Programming',
        cardCount: 15,
        flashcards: [
          { id: '1', front: 'What is useState?', back: 'A hook that lets you add state to functional components', category: 'Hooks', difficulty: 'easy', mastery: 90 },
          { id: '2', front: 'What is useEffect?', back: 'A hook that lets you perform side effects in functional components', category: 'Hooks', difficulty: 'medium', mastery: 75 },
          { id: '3', front: 'What is useContext?', back: 'A hook that lets you consume context in functional components', category: 'Hooks', difficulty: 'medium', mastery: 50 },
        ],
        createdAt: new Date('2024-01-10'),
        lastStudied: new Date('2024-01-18')
      },
      {
        id: '3',
        title: 'Interview Questions',
        description: 'Common technical interview questions',
        category: 'Career',
        cardCount: 30,
        flashcards: [
          { id: '1', front: 'What is the time complexity of binary search?', back: 'O(log n)', category: 'Algorithms', difficulty: 'medium', mastery: 80 },
          { id: '2', front: 'Explain REST API', back: 'Representational State Transfer - an architectural style for designing networked applications', category: 'Web Development', difficulty: 'medium', mastery: 65 },
          { id: '3', front: 'What is the difference between SQL and NoSQL?', back: 'SQL: relational, structured data. NoSQL: non-relational, flexible schema', category: 'Databases', difficulty: 'medium', mastery: 70 },
        ],
        createdAt: new Date('2024-01-05'),
        lastStudied: new Date('2024-01-22')
      }
    ];
    setStudySets(sampleSets);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const startStudySession = (set: StudySet) => {
    setCurrentSet(set);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsStudying(true);
    setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
    setTimer(0);
    setIsTimerRunning(true);
  };

  const endStudySession = () => {
    setIsStudying(false);
    setCurrentSet(null);
    setIsTimerRunning(false);
    setTimer(0);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentSet && currentCardIndex < currentSet.flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const markCard = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (currentSet) {
      const updatedSets = studySets.map(set => {
        if (set.id === currentSet.id) {
          const updatedFlashcards = set.flashcards.map((card, index) => {
            if (index === currentCardIndex) {
              let newMastery = card.mastery;
              if (difficulty === 'easy') newMastery = Math.min(100, card.mastery + 10);
              else if (difficulty === 'medium') newMastery = Math.min(100, card.mastery + 5);
              else newMastery = Math.max(0, card.mastery - 5);
              
              return {
                ...card,
                mastery: newMastery,
                lastReviewed: new Date()
              };
            }
            return card;
          });
          return { ...set, flashcards: updatedFlashcards };
        }
        return set;
      });
      setStudySets(updatedSets);
      nextCard();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!currentSet) return 0;
    return ((currentCardIndex + 1) / currentSet.flashcards.length) * 100;
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return 'text-green-600';
    if (mastery >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isStudying && currentSet) {
    const currentCard = currentSet.flashcards[currentCardIndex];
    
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
          {/* Study Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-lg">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentSet.title}</h1>
                <p className="text-gray-600">Card {currentCardIndex + 1} of {currentSet.flashcards.length}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <ClockIcon className="h-5 w-5" />
                  <span>{formatTime(timer)}</span>
                </div>
                <button
                  onClick={endStudySession}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  End Session
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 bg-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">{Math.round(getProgressPercentage())}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Flashcard */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="text-center mb-6">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {currentCard.category}
                  </span>
                </div>
                
                <div 
                  className="min-h-[300px] flex items-center justify-center cursor-pointer"
                  onClick={flipCard}
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Click to {isFlipped ? 'show question' : 'show answer'}
                    </p>
                  </div>
                </div>

                {/* Mastery Level */}
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm text-gray-600">Mastery:</span>
                    <span className={`text-sm font-medium ${getMasteryColor(currentCard.mastery)}`}>
                      {currentCard.mastery}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation and Difficulty Buttons */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-lg">
              <button
                onClick={previousCard}
                disabled={currentCardIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Previous</span>
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={() => markCard('hard')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <XCircleIcon className="h-5 w-5" />
                  <span>Hard</span>
                </button>
                <button
                  onClick={() => markCard('medium')}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  <span>Medium</span>
                </button>
                <button
                  onClick={() => markCard('easy')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Easy</span>
                </button>
              </div>

              <button
                onClick={nextCard}
                disabled={currentCardIndex === currentSet.flashcards.length - 1}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto text-center mb-12 pt-32">
          <div className="flex items-center justify-center mb-6">
            <AcademicCapIcon className="h-16 w-16 text-blue-600 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Study Hub
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Master new skills with interactive flashcards, quizzes, and study sessions. Track your progress and improve your knowledge retention.
          </p>
        </section>

        {/* Study Sets Grid */}
        <section className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {studySets.map((set) => (
              <div
                key={set.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {set.category}
                    </span>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <BookOpenIcon className="h-4 w-4" />
                      <span className="text-sm">{set.cardCount} cards</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{set.title}</h3>
                  <p className="text-gray-600 mb-4">{set.description}</p>
                  
                  {/* Progress Overview */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Average Mastery</span>
                      <span className="font-medium">
                        {Math.round(set.flashcards.reduce((acc, card) => acc + card.mastery, 0) / set.flashcards.length)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${set.flashcards.reduce((acc, card) => acc + card.mastery, 0) / set.flashcards.length}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => startStudySession(set)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlayIcon className="h-5 w-5" />
                      <span>Start Studying</span>
                    </button>
                    
                    <div className="text-right">
                      {set.lastStudied && (
                        <p className="text-xs text-gray-500">
                          Last studied: {set.lastStudied.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create New Set Button */}
          <div className="mt-12 text-center">
            <button className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <BookOpenIcon className="h-5 w-5" />
              <span>Create New Study Set</span>
            </button>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Study;
