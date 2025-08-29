import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Cookies from 'js-cookie';

interface Flashcard {
  id?: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mastery: number;
  createdBy?: string;
  isPublic: boolean;
  createdAt?: Date;
  lastReviewed?: Date;
}

interface StudySet {
  id?: string;
  title: string;
  description: string;
  category: string;
  isPublic: boolean;
  createdBy?: string;
  createdAt?: Date;
  lastStudied?: Date;
  cardCount: number;
  flashcards: Flashcard[];
}

const COOKIE_KEY = 'study_set_draft';

export default function CreateStudySet() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Study set form
  const [studySet, setStudySet] = useState<StudySet>({
    title: '',
    description: '',
    category: '',
    isPublic: false,
    cardCount: 0,
    flashcards: []
  });

  // Current flashcard being edited
  const [currentCard, setCurrentCard] = useState<Flashcard>({
    front: '',
    back: '',
    category: '',
    difficulty: 'medium',
    mastery: 0,
    isPublic: false
  });

  // Cookie management functions
  const saveToCookies = (data: StudySet) => {
    try {
      Cookies.set(COOKIE_KEY, JSON.stringify(data), { expires: 7 }); // 7 days
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error saving to cookies:', error);
    }
  };

  const loadFromCookies = (): StudySet | null => {
    try {
      const saved = Cookies.get(COOKIE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHasUnsavedChanges(true);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading from cookies:', error);
    }
    return null;
  };

  const clearCookies = () => {
    try {
      Cookies.remove(COOKIE_KEY);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (studySet.title || studySet.description || studySet.category || studySet.flashcards.length > 0) {
      saveToCookies(studySet);
    }
  }, [studySet]);

  // Load data from cookies on mount
  useEffect(() => {
    const savedData = loadFromCookies();
    if (savedData) {
      setStudySet(savedData);
    }
  }, []);

  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Authentication effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        localStorage.setItem("user", JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        }));
      } else {
        localStorage.removeItem("user");
        navigate("/");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowExitModal(true);
    } else {
      navigate('/study');
    }
  };

  const confirmExit = () => {
    clearCookies();
    navigate('/study');
  };

  const addCard = () => {
    if (currentCard.front.trim() && currentCard.back.trim()) {
      setStudySet(prev => ({
        ...prev,
        flashcards: [...prev.flashcards, { ...currentCard, id: Date.now().toString() }],
        cardCount: prev.cardCount + 1
      }));
      setCurrentCard({
        front: '',
        back: '',
        category: '',
        difficulty: 'medium',
        mastery: 0,
        isPublic: false
      });
    }
  };

  const removeCard = (cardId: string) => {
    setStudySet(prev => ({
      ...prev,
      flashcards: prev.flashcards.filter(card => card.id !== cardId),
      cardCount: prev.cardCount - 1
    }));
  };

  const createStudySet = async () => {
    if (!user || !studySet.title.trim()) return;

    try {
      // Create the study set
      const docRef = await addDoc(collection(db, 'studySets'), {
        title: studySet.title,
        description: studySet.description,
        category: studySet.category,
        isPublic: studySet.isPublic,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        lastStudied: null
      });

      // Add all flashcards to the study set
      const flashcardPromises = studySet.flashcards.map(card => 
        addDoc(collection(db, 'studySets', docRef.id, 'flashcards'), {
          front: card.front,
          back: card.back,
          category: card.category,
          difficulty: card.difficulty,
          mastery: 0,
          createdBy: user.uid,
          isPublic: card.isPublic,
          createdAt: serverTimestamp(),
          lastReviewed: null
        })
      );

      await Promise.all(flashcardPromises);

      // Clear cookies after successful save
      clearCookies();

      // Navigate to the study set page
      navigate(`/study/${docRef.id}`);
    } catch (error) {
      console.error('Error creating study set:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackClick}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Study Set</h1>
                <p className="text-gray-600">Build your flashcards and share knowledge</p>
                {hasUnsavedChanges && (
                  <p className="text-sm text-green-600 mt-1">✓ Auto-saved progress</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Study Set Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Study Set Details</h2>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={studySet.title}
                      onChange={(e) => setStudySet({...studySet, title: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder="Enter study set title..."
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={studySet.description}
                      onChange={(e) => setStudySet({...studySet, description: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="Describe what this study set covers..."
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={studySet.category}
                      onChange={(e) => setStudySet({...studySet, category: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder="e.g., Programming, Math, History..."
                    />
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={studySet.isPublic}
                      onChange={(e) => setStudySet({...studySet, isPublic: e.target.checked})}
                      className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded bg-white"
                    />
                    <label htmlFor="isPublic" className="ml-3 block text-sm text-gray-700">
                      <span className="font-semibold">Make this set public</span>
                      <span className="block text-gray-500 mt-1">Other users can discover and use this study set</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <button
                  onClick={createStudySet}
                  disabled={!studySet.title.trim() || studySet.flashcards.length === 0}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg shadow-green-500/25"
                >
                  Create Study Set ({studySet.flashcards.length} cards)
                </button>
              </div>
            </div>

            {/* Right Column - Add Cards */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add Cards</h2>
                
                {/* Current Card Form */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-700">New Card</span>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Term Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">TERM</label>
                      <textarea
                        value={currentCard.front}
                        onChange={(e) => setCurrentCard({...currentCard, front: e.target.value})}
                        className="w-full px-4 py-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                        rows={4}
                        placeholder="Enter your question here..."
                      />
                    </div>

                    {/* Definition Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">DEFINITION</label>
                      <textarea
                        value={currentCard.back}
                        onChange={(e) => setCurrentCard({...currentCard, back: e.target.value})}
                        className="w-full px-4 py-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                        rows={4}
                        placeholder="Enter the answer here..."
                      />
                    </div>
                  </div>
                </div>
                
                {/* Add Card Button */}
                <div className="text-center">
                  <button
                    onClick={addCard}
                    disabled={!currentCard.front.trim() || !currentCard.back.trim()}
                    className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold border border-gray-700"
                  >
                    Add a card.
                  </button>
                </div>
              </div>

              {/* Added Cards List */}
              {studySet.flashcards.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Added Cards ({studySet.flashcards.length})</h3>
                  
                  <div className="space-y-3">
                    {studySet.flashcards.map((card, index) => (
                      <div key={card.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Card {index + 1}</span>
                          <button
                            onClick={() => removeCard(card.id!)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700">Term:</span>
                            <p className="text-gray-600 mt-1">{card.front}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Definition:</span>
                            <p className="text-gray-600 mt-1">{card.back}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Unsaved Changes</h3>
              <p className="text-gray-600 mb-6">
                You have {studySet.flashcards.length} card{studySet.flashcards.length !== 1 ? 's' : ''} that haven't been saved. 
                Are you sure you want to leave without creating the study set?
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                >
                  Stay
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
