import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
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
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  mastery: number; // 0-100
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
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
  createdBy: string;
  isPublic: boolean;
}

const Study = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
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
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my' | 'public'>('all');

  // Form states
  const [newSetForm, setNewSetForm] = useState({
    title: '',
    description: '',
    category: '',
    isPublic: false
  });

  const [newCardForm, setNewCardForm] = useState({
    front: '',
    back: '',
    category: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    isPublic: false
  });

  // Authentication effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      if (firebaseUser) {
        console.log('User UID:', firebaseUser.uid);
        console.log('User email:', firebaseUser.email);
      }
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

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Load study sets from Firebase
  useEffect(() => {
    if (!user) return;

    const loadStudySets = async () => {
      try {
        let q;
        if (filter === 'my') {
          q = query(
            collection(db, 'studySets'),
            where('createdBy', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
        } else if (filter === 'public') {
          q = query(
            collection(db, 'studySets'),
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc')
          );
        } else {
          q = query(
            collection(db, 'studySets'),
            orderBy('createdAt', 'desc')
          );
        }

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const sets: StudySet[] = [];
          for (const doc of snapshot.docs) {
            const setData = doc.data();
            // Load flashcards for each set
            const flashcardsQuery = query(
              collection(db, 'studySets', doc.id, 'flashcards'),
              orderBy('createdAt', 'asc')
            );
            const flashcardsSnapshot = await getDocs(flashcardsQuery);
            const flashcards = flashcardsSnapshot.docs.map(cardDoc => ({
              id: cardDoc.id,
              ...cardDoc.data(),
              createdAt: cardDoc.data().createdAt?.toDate() || new Date(),
              lastReviewed: cardDoc.data().lastReviewed?.toDate()
            })) as Flashcard[];

            sets.push({
              id: doc.id,
              ...setData,
              flashcards,
              cardCount: flashcards.length,
              createdAt: setData.createdAt?.toDate() || new Date(),
              lastStudied: setData.lastStudied?.toDate()
            } as StudySet);
          }
          setStudySets(sets);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error loading study sets:', error);
      }
    };

    loadStudySets();
  }, [user, filter]);

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

  const endStudySession = async () => {
    if (currentSet) {
      // Update last studied time
      try {
        await updateDoc(doc(db, 'studySets', currentSet.id), {
          lastStudied: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating last studied:', error);
      }
    }
    
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

  const markCard = async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (currentSet && user) {
      const currentCard = currentSet.flashcards[currentCardIndex];
      let newMastery = currentCard.mastery;
      if (difficulty === 'easy') newMastery = Math.min(100, currentCard.mastery + 10);
      else if (difficulty === 'medium') newMastery = Math.min(100, currentCard.mastery + 5);
      else newMastery = Math.max(0, currentCard.mastery - 5);
      
      try {
        await updateDoc(doc(db, 'studySets', currentSet.id, 'flashcards', currentCard.id), {
          mastery: newMastery,
          lastReviewed: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating card mastery:', error);
      }
      
      nextCard();
    }
  };

  const createStudySet = async () => {
    if (!user) {
      console.error('No user found for study set creation');
      return;
    }
    
    console.log('Creating study set with user:', user.uid);
    
    try {
      const docRef = await addDoc(collection(db, 'studySets'), {
        title: newSetForm.title,
        description: newSetForm.description,
        category: newSetForm.category,
        createdBy: user.uid,
        isPublic: newSetForm.isPublic,
        createdAt: serverTimestamp(),
        lastStudied: null
      });
      
      console.log('Study set created successfully:', docRef.id);
      
      setNewSetForm({ title: '', description: '', category: '', isPublic: false });
      setShowCreateModal(false);
      setSelectedSetId(docRef.id);
      setShowCreateCardModal(true);
    } catch (error) {
      console.error('Error creating study set:', error);
    }
  };

  const createFlashcard = async () => {
    if (!user || !selectedSetId) return;
    
    try {
      await addDoc(collection(db, 'studySets', selectedSetId, 'flashcards'), {
        front: newCardForm.front,
        back: newCardForm.back,
        category: newCardForm.category,
        difficulty: newCardForm.difficulty,
        mastery: 0,
        createdBy: user.uid,
        isPublic: newCardForm.isPublic,
        createdAt: serverTimestamp(),
        lastReviewed: null
      });
      
      setNewCardForm({ 
        front: '', 
        back: '', 
        category: '', 
        difficulty: 'medium', 
        isPublic: false 
      });
      setShowCreateCardModal(false);
      setSelectedSetId(null);
    } catch (error) {
      console.error('Error creating flashcard:', error);
    }
  };

  const deleteStudySet = async (setId: string) => {
    if (!user) return;
    
    try {
      // Delete all flashcards first
      const flashcardsSnapshot = await getDocs(collection(db, 'studySets', setId, 'flashcards'));
      const deletePromises = flashcardsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete the study set
      await deleteDoc(doc(db, 'studySets', setId));
    } catch (error) {
      console.error('Error deleting study set:', error);
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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (isStudying && currentSet) {
    const currentCard = currentSet.flashcards[currentCardIndex];
    
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 px-4">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 px-4">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto text-center mb-12">
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

        {/* Filter and Create Button */}
        <section className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Sets
              </button>
              <button
                onClick={() => setFilter('my')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'my' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                My Sets
              </button>
              <button
                onClick={() => setFilter('public')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'public' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Public Sets
              </button>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create New Set</span>
            </button>
          </div>
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
                    <div className="flex items-center space-x-2">
                      {set.isPublic ? (
                        <EyeIcon className="h-4 w-4 text-green-600" title="Public" />
                      ) : (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" title="Private" />
                      )}
                      <div className="flex items-center space-x-2 text-gray-500">
                        <BookOpenIcon className="h-4 w-4" />
                        <span className="text-sm">{set.cardCount} cards</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{set.title}</h3>
                  <p className="text-gray-600 mb-4">{set.description}</p>
                  
                  {/* Progress Overview */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Average Mastery</span>
                      <span className="font-medium">
                        {set.flashcards.length > 0 
                          ? Math.round(set.flashcards.reduce((acc, card) => acc + card.mastery, 0) / set.flashcards.length)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${set.flashcards.length > 0 
                            ? set.flashcards.reduce((acc, card) => acc + card.mastery, 0) / set.flashcards.length
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => startStudySession(set)}
                      disabled={set.flashcards.length === 0}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <PlayIcon className="h-5 w-5" />
                      <span>Start Studying</span>
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      {set.createdBy === user.uid && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedSetId(set.id);
                              setShowCreateCardModal(true);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Add Card"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteStudySet(set.id)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete Set"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {set.lastStudied && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last studied: {set.lastStudied.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {studySets.length === 0 && (
            <div className="text-center py-12">
              <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No study sets found</h3>
              <p className="text-gray-600 mb-4">
                {filter === 'my' 
                  ? "You haven't created any study sets yet."
                  : filter === 'public'
                  ? "No public study sets available."
                  : "No study sets available."
                }
              </p>
              {filter === 'my' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Create Your First Set</span>
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Create Study Set Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Create New Study Set</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); createStudySet(); }}>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Study Set Title</label>
                  <input
                    type="text"
                    value={newSetForm.title}
                    onChange={(e) => setNewSetForm({...newSetForm, title: e.target.value})}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 text-lg"
                    placeholder="Enter a title for your study set..."
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newSetForm.description}
                    onChange={(e) => setNewSetForm({...newSetForm, description: e.target.value})}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Describe what this study set covers..."
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={newSetForm.category}
                    onChange={(e) => setNewSetForm({...newSetForm, category: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                    placeholder="e.g., Programming, Math, History, Science..."
                    required
                  />
                </div>

                {/* Public/Private Toggle */}
                <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newSetForm.isPublic}
                    onChange={(e) => setNewSetForm({...newSetForm, isPublic: e.target.checked})}
                    className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded bg-white"
                  />
                  <label htmlFor="isPublic" className="ml-3 block text-sm text-gray-700">
                    <span className="font-semibold">Make this set public</span>
                    <span className="block text-gray-500 mt-1">Other users can discover and use this study set</span>
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg shadow-green-500/25"
                >
                  Create Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Flashcard Modal */}
      {showCreateCardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Add New Flashcard</h2>
              <button
                onClick={() => setShowCreateCardModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); createFlashcard(); }}>
              <div className="space-y-6">
                {/* Question Side */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                      Q
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900">Question</h3>
                  </div>
                  <textarea
                    value={newCardForm.front}
                    onChange={(e) => setNewCardForm({...newCardForm, front: e.target.value})}
                    className="w-full px-4 py-4 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                    rows={4}
                    placeholder="Enter your question here..."
                    required
                  />
                </div>

                {/* Answer Side */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                      A
                    </div>
                    <h3 className="text-lg font-semibold text-green-900">Answer</h3>
                  </div>
                  <textarea
                    value={newCardForm.back}
                    onChange={(e) => setNewCardForm({...newCardForm, back: e.target.value})}
                    className="w-full px-4 py-4 bg-white border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                    rows={4}
                    placeholder="Enter the answer here..."
                    required
                  />
                </div>

                {/* Additional Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={newCardForm.category}
                      onChange={(e) => setNewCardForm({...newCardForm, category: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder="e.g., Basics, Advanced, Concepts"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={newCardForm.difficulty}
                      onChange={(e) => setNewCardForm({...newCardForm, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Public/Private Toggle */}
                <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="cardIsPublic"
                    checked={newCardForm.isPublic}
                    onChange={(e) => setNewCardForm({...newCardForm, isPublic: e.target.checked})}
                    className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded bg-white"
                  />
                  <label htmlFor="cardIsPublic" className="ml-3 block text-sm text-gray-700">
                    <span className="font-semibold">Make this card public</span>
                    <span className="block text-gray-500 mt-1">Other users can discover and use this card</span>
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateCardModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg shadow-green-500/25"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Study;
