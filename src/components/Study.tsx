import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
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
  TrashIcon,
} from "@heroicons/react/24/outline";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  lastReviewed?: Date;
  mastery: number; // 0-100
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
}

interface StudySession {
  id: string;
  studySetId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  cardsReviewed: number;
  correctAnswers: number;
  xpEarned: number;
}

interface UserStats {
  totalStudyTime: number; // in seconds
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: Date;
  totalXP: number;
  level: number;
  studyHistory: StudySession[];
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
  progress?: "not_started" | "started" | "completed";
  totalStudyTime: number; // in seconds
  totalSessions: number;
  averageScore: number; // percentage
}

const Study = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<
    "flashcards" | "quiz" | "matching"
  >("flashcards");
  const [isStudying, setIsStudying] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [showCreateCardForm, setShowCreateCardForm] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "my" | "public">("all");
  const [isEditingSet, setIsEditingSet] = useState(false);
  const [editingSet, setEditingSet] = useState<StudySet | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalStudyTime: 0,
    totalSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    level: 1,
    studyHistory: [],
  });
  const [currentSession, setCurrentSession] = useState<StudySession | null>(
    null
  );
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Form states
  const [newSetForm, setNewSetForm] = useState({
    title: "",
    description: "",
    category: "",
    isPublic: false,
  });

  const [newCardForm, setNewCardForm] = useState({
    front: "",
    back: "",
    category: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    isPublic: false,
  });

  // Memoized values to prevent unnecessary re-renders
  const memoizedUser = useMemo(() => user, [user?.uid]);
  const memoizedFilter = useMemo(() => filter, [filter]);

  // Authentication effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log(
        "Auth state changed:",
        firebaseUser ? "User logged in" : "No user"
      );
      if (firebaseUser) {
        console.log("User UID:", firebaseUser.uid);
        console.log("User email:", firebaseUser.email);
      }
      setUser(firebaseUser);
      if (firebaseUser) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          })
        );
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

  // Load study sets from Firebase - OPTIMIZED with single listener
  useEffect(() => {
    if (!memoizedUser) return;

    const loadStudySets = async () => {
      try {
        let q;
        if (memoizedFilter === "my") {
          q = query(
            collection(db, "studySets"),
            where("createdBy", "==", memoizedUser.uid),
            orderBy("createdAt", "desc")
          );
        } else if (memoizedFilter === "public") {
          q = query(
            collection(db, "studySets"),
            where("isPublic", "==", true),
            orderBy("createdAt", "desc")
          );
        } else {
          q = query(collection(db, "studySets"), orderBy("createdAt", "desc"));
        }

        // Single onSnapshot listener instead of multiple getDocs calls
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const sets: StudySet[] = [];
          
          // Batch load flashcards for all sets at once
          const flashcardPromises = snapshot.docs.map(async (doc) => {
            const setData = doc.data();
            const flashcardsQuery = query(
              collection(db, "studySets", doc.id, "flashcards"),
              orderBy("createdAt", "asc")
            );
            const flashcardsSnapshot = await getDocs(flashcardsQuery);
            const flashcards = flashcardsSnapshot.docs.map((cardDoc) => ({
              id: cardDoc.id,
              ...cardDoc.data(),
              createdAt: cardDoc.data().createdAt?.toDate() || new Date(),
              lastReviewed: cardDoc.data().lastReviewed?.toDate(),
            })) as Flashcard[];

            // Determine progress based on study activity and mastery
            let progress: "not_started" | "started" | "completed" =
              "not_started";
            if (setData.lastStudied) {
              const lastStudiedDate = setData.lastStudied.toDate ? setData.lastStudied.toDate() : new Date(setData.lastStudied);
              const today = new Date();
              const daysSinceLastStudy = Math.floor((today.getTime() - lastStudiedDate.getTime()) / (1000 * 60 * 60 * 24));
              
              const avgMastery =
                flashcards.length > 0
                  ? flashcards.reduce((acc, card) => acc + card.mastery, 0) /
                    flashcards.length
                  : 0;
              
              // If completed (80%+ mastery), stay completed
              if (avgMastery >= 80) {
                progress = "completed";
              }
              // If studied within last day, stay started
              else if (daysSinceLastStudy <= 1) {
                progress = "started";
              }
              // If more than 1 day since last study, go back to not started
              else {
                progress = "not_started";
              }
            }

            return {
              id: doc.id,
              ...setData,
              flashcards,
              cardCount: flashcards.length,
              createdAt: setData.createdAt?.toDate() || new Date(),
              lastStudied: setData.lastStudied?.toDate(),
              progress,
            } as StudySet;
          });

          // Wait for all flashcard loading to complete
          const resolvedSets = await Promise.all(flashcardPromises);
          setStudySets(resolvedSets);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error loading study sets:", error);
      }
    };

    loadStudySets();
  }, [memoizedUser, memoizedFilter]);

  // Debounced user stats loading to prevent excessive calls
  const loadUserStats = useCallback(async () => {
    if (!memoizedUser) return;

    try {
      const userDoc = await getDoc(doc(db, "users", memoizedUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserStats({
          totalStudyTime: data.totalStudyTime || 0,
          totalSessions: data.totalSessions || 0,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastStudyDate: data.lastStudyDate?.toDate(),
          totalXP: data.totalXP || 0,
          level: data.level || 1,
          studyHistory: (data.studyHistory || []).map((session: any) => ({
            ...session,
            startTime: session.startTime?.toDate
              ? session.startTime.toDate()
              : new Date(session.startTime),
            endTime: session.endTime?.toDate
              ? session.endTime.toDate()
              : session.endTime
              ? new Date(session.endTime)
              : undefined,
          })),
        });
      } else {
        // Create user stats document if it doesn't exist
        await setDoc(doc(db, "users", memoizedUser.uid), {
          totalStudyTime: 0,
          totalSessions: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalXP: 0,
          level: 1,
          studyHistory: [],
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  }, [memoizedUser]);

  // Load user stats only once when user changes
  useEffect(() => {
    if (memoizedUser) {
      loadUserStats();
    }
  }, [memoizedUser, loadUserStats]);

  const calculateXP = (
    sessionDuration: number,
    cardsReviewed: number,
    correctAnswers: number
  ): number => {
    // Base XP for time spent (1 XP per minute)
    const timeXP = Math.floor(sessionDuration / 60);

    // XP for cards reviewed (2 XP per card)
    const reviewXP = cardsReviewed * 2;

    // Bonus XP for accuracy (5 XP per correct answer)
    const accuracyXP = correctAnswers * 5;

    // Streak bonus (10 XP per day in current streak)
    const streakBonus = userStats.currentStreak * 10;

    return timeXP + reviewXP + accuracyXP + streakBonus;
  };



  const updateStreak = async (): Promise<number> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = userStats.lastStudyDate;
    const lastStudyDate = lastStudy ? new Date(lastStudy) : null;
    if (lastStudyDate) {
      lastStudyDate.setHours(0, 0, 0, 0);
    }

    let newStreak = userStats.currentStreak;

    if (!lastStudyDate) {
      // First study session
      newStreak = 1;
    } else if (lastStudyDate.getTime() === today.getTime()) {
      // Already studied today
      newStreak = userStats.currentStreak;
    } else if (
      lastStudyDate.getTime() ===
      today.getTime() - 24 * 60 * 60 * 1000
    ) {
      // Studied yesterday, continue streak
      newStreak = userStats.currentStreak + 1;
    } else {
      // Break in streak, reset to 1
      newStreak = 1;
    }

    return newStreak;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);



  const startStudySession = async (set: StudySet) => {
    const startTime = new Date();
    setSessionStartTime(startTime);

    setCurrentSet(set);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsStudying(true);
    setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
    setTimer(0);
    setIsTimerRunning(true);

    // Clear any pending card updates from previous session
    setPendingCardUpdates([]);

    // Scroll to top when study session starts
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Create new study session
    const newSession: StudySession = {
      id: `session_${Date.now()}`,
      studySetId: set.id,
      startTime,
      duration: 0,
      cardsReviewed: 0,
      correctAnswers: 0,
      xpEarned: 0,
    };
    setCurrentSession(newSession);

    // Update progress to 'started' if it's not already started or completed
    if (set.progress === "not_started" || !set.progress) {
      try {
        await updateDoc(doc(db, "studySets", set.id), {
          progress: "started",
        });
      } catch (error) {
        console.error("Error updating study set progress:", error);
      }
    }
  };

  const endStudySession = async () => {
    if (currentSet && currentSession && sessionStartTime) {
      const endTime = new Date();
      const sessionDuration = Math.floor(
        (endTime.getTime() - sessionStartTime.getTime()) / 1000
      );

      // Calculate session stats
      const cardsReviewed = currentCardIndex + 1;
      const correctAnswers = score.correct;
      const xpEarned = calculateXP(
        sessionDuration,
        cardsReviewed,
        correctAnswers
      );

      // Update session with final data
      const completedSession: StudySession = {
        ...currentSession,
        endTime,
        duration: sessionDuration,
        cardsReviewed,
        correctAnswers,
        xpEarned,
      };



      // Update streak
      const newStreak = await updateStreak();

      // Calculate new user stats
      const newTotalStudyTime = userStats.totalStudyTime + sessionDuration;
      const newTotalSessions = userStats.totalSessions + 1;
      const newTotalXP = userStats.totalXP + xpEarned;
      const newLevel = Math.floor(newTotalXP / 1000) + 1;

      // Batch update all Firebase operations
      try {
        // 1. Batch update cards first
        await batchUpdateCards();

        // 2. Update user stats
        await updateDoc(doc(db, "users", memoizedUser!.uid), {
          totalStudyTime: newTotalStudyTime,
          totalSessions: newTotalSessions,
          currentStreak: newStreak,
          longestStreak: Math.max(userStats.longestStreak, newStreak),
          lastStudyDate: serverTimestamp(),
          totalXP: newTotalXP,
          level: newLevel,
          studyHistory: arrayUnion(completedSession),
        });

        // 3. Update study set stats (progress already updated in batchUpdateCards)
        await updateDoc(doc(db, "studySets", currentSet.id), {
          lastStudied: serverTimestamp(),
          totalStudyTime: (currentSet.totalStudyTime || 0) + sessionDuration,
          totalSessions: (currentSet.totalSessions || 0) + 1,
          averageScore:
            ((currentSet.averageScore || 0) * (currentSet.totalSessions || 0) +
              (correctAnswers / cardsReviewed) * 100) /
            ((currentSet.totalSessions || 0) + 1),
        });

        // Update local state
        setUserStats((prev) => ({
          ...prev,
          totalStudyTime: newTotalStudyTime,
          totalSessions: newTotalSessions,
          currentStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak),
          lastStudyDate: endTime,
          totalXP: newTotalXP,
          level: newLevel,
          studyHistory: [...prev.studyHistory, completedSession],
        }));
      } catch (error) {
        console.error("Error updating session data:", error);
      }
    }

    setIsStudying(false);
    setCurrentSet(null);
    setCurrentSession(null);
    setSessionStartTime(null);
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

  // Batch update state to reduce Firebase calls
  const [pendingCardUpdates, setPendingCardUpdates] = useState<Array<{
    cardId: string;
    mastery: number;
    lastReviewed: Date;
  }>>([]);

  const markCard = async (difficulty: "easy" | "medium" | "hard") => {
    if (currentSet && memoizedUser) {
      const currentCard = currentSet.flashcards[currentCardIndex];
      let newMastery = currentCard.mastery;
      if (difficulty === "easy")
        newMastery = Math.min(100, currentCard.mastery + 10);
      else if (difficulty === "medium")
        newMastery = Math.min(100, currentCard.mastery + 5);
      else newMastery = Math.max(0, currentCard.mastery - 5);

      // Update score for session tracking
      const isCorrect = difficulty === "easy" || difficulty === "medium";
      setScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));

      // Add to pending updates instead of immediate Firebase call
      setPendingCardUpdates((prev) => [
        ...prev,
        {
          cardId: currentCard.id,
          mastery: newMastery,
          lastReviewed: new Date(),
        },
      ]);

      // Update local state immediately for better UX
      setCurrentSet((prev) => {
        if (!prev) return prev;
        const updatedFlashcards = prev.flashcards.map((card) =>
          card.id === currentCard.id ? { ...card, mastery: newMastery } : card
        );
        return { ...prev, flashcards: updatedFlashcards };
      });

      nextCard();
    }
  };

  // Batch update cards to Firebase when session ends
  const batchUpdateCards = async () => {
    if (pendingCardUpdates.length === 0 || !currentSet) return;

    try {
      // Batch update all card masteries
      const updatePromises = pendingCardUpdates.map((update) =>
        updateDoc(
          doc(db, "studySets", currentSet.id, "flashcards", update.cardId),
          {
            mastery: update.mastery,
            lastReviewed: serverTimestamp(),
          }
        )
      );

      await Promise.all(updatePromises);

      // Update study set progress once after all cards are updated
      const avgMastery =
        currentSet.flashcards.reduce((acc, card) => acc + card.mastery, 0) /
        currentSet.flashcards.length;
      
      let newProgress: "not_started" | "started" | "completed";
      if (avgMastery >= 80) {
        newProgress = "completed";
      } else {
        newProgress = "started";
      }

      await updateDoc(doc(db, "studySets", currentSet.id), {
        progress: newProgress,
      });

      // Clear pending updates
      setPendingCardUpdates([]);
    } catch (error) {
      console.error("Error batch updating cards:", error);
    }
  };

  const createStudySet = async () => {
    if (!memoizedUser) {
      console.error("No user found for study set creation");
      return;
    }

    console.log("Creating study set with user:", memoizedUser.uid);

    try {
      const docRef = await addDoc(collection(db, "studySets"), {
        title: newSetForm.title,
        description: newSetForm.description,
        category: newSetForm.category,
        createdBy: memoizedUser.uid,
        isPublic: newSetForm.isPublic,
        createdAt: serverTimestamp(),
        lastStudied: null,
      });

      console.log("Study set created successfully:", docRef.id);

      setNewSetForm({
        title: "",
        description: "",
        category: "",
        isPublic: false,
      });
      setShowCreateModal(false);
      setSelectedSetId(docRef.id);
      setShowCreateCardModal(true);
    } catch (error) {
      console.error("Error creating study set:", error);
    }
  };

  const createFlashcard = async () => {
    if (!memoizedUser || !selectedSetId) return;

    try {
      await addDoc(collection(db, "studySets", selectedSetId, "flashcards"), {
        front: newCardForm.front,
        back: newCardForm.back,
        category: newCardForm.category,
        difficulty: newCardForm.difficulty,
        mastery: 0,
        createdBy: memoizedUser.uid,
        isPublic: newCardForm.isPublic,
        createdAt: serverTimestamp(),
        lastReviewed: null,
      });

      setNewCardForm({
        front: "",
        back: "",
        category: "",
        difficulty: "medium",
        isPublic: false,
      });
      setShowCreateCardModal(false);
      setSelectedSetId(null);
    } catch (error) {
      console.error("Error creating flashcard:", error);
    }
  };

  const deleteStudySet = async (setId: string) => {
    if (!memoizedUser) return;

    try {
      // Delete all flashcards first
      const flashcardsSnapshot = await getDocs(
        collection(db, "studySets", setId, "flashcards")
      );
      const deletePromises = flashcardsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Delete the study set
      await deleteDoc(doc(db, "studySets", setId));
    } catch (error) {
      console.error("Error deleting study set:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    if (!currentSet) return 0;
    return ((currentCardIndex + 1) / currentSet.flashcards.length) * 100;
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return "text-green-600";
    if (mastery >= 60) return "text-yellow-600";
    return "text-red-600";
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
  if (!memoizedUser) {
    return null;
  }



  if (isStudying && currentSet) {
    // Check if we have flashcards and a valid current card
      if (!currentSet.flashcards || currentSet.flashcards.length === 0) {
      return (
        <>
          <Navbar />
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {currentSet.title}
              </h1>
              <p className="text-gray-600 mb-8">No flashcards found in this study set.</p>
              <button
                onClick={() => setIsStudying(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Study Hub
              </button>
            </div>
          </div>
        </>
      );
    }
    
    const currentCard = currentSet.flashcards[currentCardIndex];

    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 px-4">
          {/* Study Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-lg">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentSet.title}
                </h1>
                <p className="text-gray-600">
                  Card {currentCardIndex + 1} of {currentSet?.flashcards?.length || 0}
                </p>
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
                <span className="text-sm font-medium text-gray-700">
                  Progress
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(getProgressPercentage())}%
                </span>
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
                    {currentCard?.category || 'General'}
                  </span>
                </div>

                <div
                  className="min-h-[300px] flex items-center justify-center cursor-pointer"
                  onClick={flipCard}
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {isFlipped ? currentCard?.back : currentCard?.front}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Click to {isFlipped ? "show question" : "show answer"}
                    </p>
                  </div>
                </div>

                {/* Mastery Level */}
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm text-gray-600">Mastery:</span>
                    <span
                      className={`text-sm font-medium ${getMasteryColor(
                        currentCard?.mastery || 0
                      )}`}
                    >
                      {currentCard?.mastery || 0}%
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
                  onClick={() => markCard("hard")}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <XCircleIcon className="h-5 w-5" />
                  <span>Hard</span>
                </button>
                <button
                  onClick={() => markCard("medium")}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  <span>Medium</span>
                </button>
                <button
                  onClick={() => markCard("easy")}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Easy</span>
                </button>
              </div>

              <button
                onClick={nextCard}
                disabled={currentCardIndex === (currentSet?.flashcards?.length || 0) - 1}
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
      <style>{`
        @keyframes fly {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(5deg); }
          50% { transform: translateY(-5px) rotate(0deg); }
          75% { transform: translateY(-15px) rotate(-5deg); }
        }
        @keyframes wingFlap {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes wingFlapRight {
          0%, 100% { transform: rotate(12deg); }
          50% { transform: rotate(-12deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes villageGrow {
          0% { transform: scale(0.9); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .flying-bird {
          animation: fly 3s ease-in-out infinite;
        }
        .wing-left {
          animation: wingFlap 0.5s ease-in-out infinite;
        }
        .wing-right {
          animation: wingFlapRight 0.5s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        .village-container {
          animation: villageGrow 1s ease-out;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 px-4">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <AcademicCapIcon className="h-16 w-16 text-blue-600 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Study Hub
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Master new skills with interactive flashcards, quizzes, and study
            sessions. Track your progress and improve your knowledge retention.
          </p>

          {/* Study Stats and Progress Graph */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Study Stats & Progress
            </h3>
            
            {/* Study Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {/* Study Streak */}
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs">Current Streak</p>
                    <p className="text-2xl font-bold">
                      {userStats.currentStreak}
                    </p>
                    <p className="text-orange-100 text-xs">days</p>
                  </div>
                  <div className="text-2xl">🔥</div>
                </div>
              </div>

              {/* Total Study Time */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs">Total Study Time</p>
                    <p className="text-2xl font-bold">
                      {Math.floor(userStats.totalStudyTime / 3600)}
                    </p>
                    <p className="text-blue-100 text-xs">hours</p>
                  </div>
                  <div className="text-2xl">⏱️</div>
                </div>
              </div>

              {/* Total XP */}
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs">Total XP</p>
                    <p className="text-2xl font-bold">{userStats.totalXP}</p>
                    <p className="text-purple-100 text-xs">
                      Level {userStats.level}
                    </p>
                  </div>
                  <div className="text-2xl">⭐</div>
                </div>
              </div>

              {/* Total Sessions */}
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs">Study Sessions</p>
                    <p className="text-2xl font-bold">
                      {userStats.totalSessions}
                    </p>
                    <p className="text-green-100 text-xs">completed</p>
                  </div>
                  <div className="text-2xl">📚</div>
                </div>
              </div>
            </div>
            
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Study Time Progress
            </h4>
            {(() => {
              // Process study history to get daily study time
              const dailyStudyTime = new Map<string, number>();
              
              userStats.studyHistory.forEach(session => {
                const startTime = session.startTime instanceof Date 
                  ? session.startTime 
                  : new Date(session.startTime);
                const dateKey = startTime.toISOString().split('T')[0]; // YYYY-MM-DD format
                
                dailyStudyTime.set(dateKey, (dailyStudyTime.get(dateKey) || 0) + session.duration);
              });
              
              // Convert to sorted array of [date, minutes] pairs
              const sortedData: [string, number][] = Array.from(dailyStudyTime.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, seconds]) => [date, Math.round(seconds / 60)]); // Convert to minutes
              
              if (sortedData.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <p>No study data yet. Start studying to see your progress!</p>
                  </div>
                );
              }
              
              const maxMinutes = Math.max(...sortedData.map(([, minutes]) => minutes));
              const chartHeight = 200;
              const chartWidth = Math.max(400, sortedData.length * 60);
              
              return (
                <div className="overflow-x-auto">
                  <div className="relative" style={{ width: chartWidth, height: chartHeight }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
                      {[maxMinutes, Math.round(maxMinutes * 0.75), Math.round(maxMinutes * 0.5), Math.round(maxMinutes * 0.25), 0].map((value, index) => (
                        <div key={index} className="flex items-center">
                          <span>{value}m</span>
                          <div className="ml-2 w-2 h-px bg-gray-200"></div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Grid lines */}
                    <svg className="absolute inset-0 w-full h-full" style={{ left: '40px' }}>
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                        <line
                          key={index}
                          x1="0"
                          y1={chartHeight * ratio}
                          x2={chartWidth - 40}
                          y2={chartHeight * ratio}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                      ))}
                    </svg>
                    
                    {/* Line graph */}
                    <svg className="absolute inset-0 w-full h-full" style={{ left: '40px' }}>
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        points={sortedData.map(([date, minutes], index) => {
                          const x = (index / (sortedData.length - 1)) * (chartWidth - 40);
                          const y = chartHeight - (minutes / maxMinutes) * chartHeight;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                      
                      {/* Data points */}
                      {sortedData.map(([date, minutes], index) => {
                        const x = (index / (sortedData.length - 1)) * (chartWidth - 40);
                        const y = chartHeight - (minutes / maxMinutes) * chartHeight;
                        return (
                          <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#10b981"
                            className="hover:r-6 transition-all duration-200"
                          />
                        );
                      })}
                    </svg>
                    
                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500" style={{ left: '40px' }}>
                      {sortedData.map(([date], index) => {
                        const displayDate = new Date(date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        });
                        return (
                          <div key={index} className="text-center transform -rotate-45 origin-bottom-left">
                            {displayDate}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Summary stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">
                        {sortedData.length}
                      </div>
                      <div className="text-sm text-gray-600">Days Studied</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(sortedData.reduce((sum, [, minutes]) => sum + minutes, 0) / sortedData.length)}
                      </div>
                      <div className="text-sm text-gray-600">Avg Minutes/Day</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.max(...sortedData.map(([, minutes]) => minutes))}
                      </div>
                      <div className="text-sm text-gray-600">Max Minutes</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>



        {/* Kanban Board */}
        <section className="max-w-7xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Study Progress
          </h2>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-300">
              {/* Not Started */}
              <div className="px-4 first:pl-0 last:pr-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Not Started
                </h3>
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                  {
                    studySets.filter(
                      (set) => !set.progress || set.progress === "not_started"
                    ).length
                  }
                </span>
              </div>
              <div className="space-y-3">
                {studySets
                  .filter(
                    (set) => !set.progress || set.progress === "not_started"
                  )
                  .slice(0, 3)
                  .map((set) => (
                    <div
                      key={set.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
                      onClick={() => startStudySession(set)}
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {set.title}
                      </h4>
                      <p className="text-gray-500 text-xs">
                        {set.cardCount} cards
                      </p>
                    </div>
                  ))}
                {studySets.filter(
                  (set) => !set.progress || set.progress === "not_started"
                ).length > 3 && (
                  <div className="text-center text-gray-500 text-sm">
                    +
                    {studySets.filter(
                      (set) => !set.progress || set.progress === "not_started"
                    ).length - 3}{" "}
                    more
                  </div>
                )}
              </div>
              </div>

              {/* Started Studying */}
              <div className="px-4 first:pl-0 last:pr-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-700">
                  Started Studying
                </h3>
                <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
                  {studySets.filter((set) => set.progress === "started").length}
                </span>
              </div>
              <div className="space-y-3">
                {studySets
                  .filter((set) => set.progress === "started")
                  .slice(0, 3)
                  .map((set) => (
                    <div
                      key={set.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-blue-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
                      onClick={() => startStudySession(set)}
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {set.title}
                      </h4>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-xs">
                          {set.cardCount} cards
                        </p>
                        <div className="w-16 bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full"
                            style={{
                              width: `${
                                set.flashcards.length > 0
                                  ? Math.round(
                                      set.flashcards.reduce(
                                        (acc, card) => acc + card.mastery,
                                        0
                                      ) / set.flashcards.length
                                    )
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                {studySets.filter((set) => set.progress === "started").length >
                  3 && (
                  <div className="text-center text-blue-500 text-sm">
                    +
                    {studySets.filter((set) => set.progress === "started")
                      .length - 3}{" "}
                    more
                  </div>
                )}
              </div>
              </div>

              {/* Completed */}
              <div className="px-4 first:pl-0 last:pr-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-700">
                    Completed
                  </h3>
                  <span className="bg-green-200 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
                    {
                      studySets.filter((set) => set.progress === "completed")
                        .length
                    }
                  </span>
                </div>
                <div className="space-y-3">
                  {studySets
                    .filter((set) => set.progress === "completed")
                    .slice(0, 3)
                    .map((set) => (
                      <div
                        key={set.id}
                        className="bg-white rounded-lg p-3 shadow-sm border border-green-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
                        onClick={() => startStudySession(set)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {set.title}
                          </h4>
                          <svg
                            className="h-4 w-4 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-xs">
                          {set.cardCount} cards
                        </p>
                      </div>
                    ))}
                  {studySets.filter((set) => set.progress === "completed")
                    .length > 3 && (
                    <div className="text-center text-green-500 text-sm">
                      +
                      {studySets.filter((set) => set.progress === "completed")
                        .length - 3}{" "}
                      more
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Create Button */}
        <section className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                All Sets
              </button>
              <button
                onClick={() => setFilter("my")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "my"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                My Sets
              </button>
              <button
                onClick={() => setFilter("public")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "public"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Public Sets
              </button>
            </div>

            <button
              onClick={() => navigate("/create")}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create New Set</span>
            </button>
          </div>
        </section>

        {/* Study Sets Grid */}
        <section className="max-w-7xl mx-auto pb-20">
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
                        <EyeIcon
                          className="h-4 w-4 text-green-600"
                          title="Public"
                        />
                      ) : (
                        <EyeSlashIcon
                          className="h-4 w-4 text-gray-400"
                          title="Private"
                        />
                      )}
                      <div className="flex items-center space-x-2 text-gray-500">
                        <BookOpenIcon className="h-4 w-4" />
                        <span className="text-sm">{set.cardCount} cards</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {set.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{set.description}</p>

                  {/* Progress Overview */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Average Mastery</span>
                      <span className="font-medium">
                        {set.flashcards.length > 0
                          ? Math.round(
                              set.flashcards.reduce(
                                (acc, card) => acc + card.mastery,
                                0
                              ) / set.flashcards.length
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            set.flashcards.length > 0
                              ? set.flashcards.reduce(
                                  (acc, card) => acc + card.mastery,
                                  0
                                ) / set.flashcards.length
                              : 0
                          }%`,
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
                      {set.createdBy === memoizedUser?.uid && (
                        <>
                          <button
                            onClick={() => navigate(`/edit/${set.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Edit Set"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No study sets found
              </h3>
              <p className="text-gray-600 mb-4">
                {filter === "my"
                  ? "You haven't created any study sets yet."
                  : filter === "public"
                  ? "No public study sets available."
                  : "No study sets available."}
              </p>
              {filter === "my" && (
                <button
                  onClick={() => navigate("/create")}
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
              <h2 className="text-3xl font-bold text-gray-900">
                Create New Study Set
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createStudySet();
              }}
            >
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Study Set Title
                  </label>
                  <input
                    type="text"
                    value={newSetForm.title}
                    onChange={(e) =>
                      setNewSetForm({ ...newSetForm, title: e.target.value })
                    }
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 text-lg"
                    placeholder="Enter a title for your study set..."
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newSetForm.description}
                    onChange={(e) =>
                      setNewSetForm({
                        ...newSetForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Describe what this study set covers..."
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newSetForm.category}
                    onChange={(e) =>
                      setNewSetForm({ ...newSetForm, category: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewSetForm({
                        ...newSetForm,
                        isPublic: e.target.checked,
                      })
                    }
                    className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="isPublic"
                    className="ml-3 block text-sm text-gray-700"
                  >
                    <span className="font-semibold">Make this set public</span>
                    <span className="block text-gray-500 mt-1">
                      Other users can discover and use this study set
                    </span>
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
              <h2 className="text-3xl font-bold text-gray-900">
                Add New Flashcard
              </h2>
              <button
                onClick={() => setShowCreateCardModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createFlashcard();
              }}
            >
              <div className="space-y-6">
                {/* Question Side */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                      Q
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      Question
                    </h3>
                  </div>
                  <textarea
                    value={newCardForm.front}
                    onChange={(e) =>
                      setNewCardForm({ ...newCardForm, front: e.target.value })
                    }
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
                    <h3 className="text-lg font-semibold text-green-900">
                      Answer
                    </h3>
                  </div>
                  <textarea
                    value={newCardForm.back}
                    onChange={(e) =>
                      setNewCardForm({ ...newCardForm, back: e.target.value })
                    }
                    className="w-full px-4 py-4 bg-white border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                    rows={4}
                    placeholder="Enter the answer here..."
                    required
                  />
                </div>

                {/* Additional Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={newCardForm.category}
                      onChange={(e) =>
                        setNewCardForm({
                          ...newCardForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder="e.g., Basics, Advanced, Concepts"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={newCardForm.difficulty}
                      onChange={(e) =>
                        setNewCardForm({
                          ...newCardForm,
                          difficulty: e.target.value as
                            | "easy"
                            | "medium"
                            | "hard",
                        })
                      }
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
                    onChange={(e) =>
                      setNewCardForm({
                        ...newCardForm,
                        isPublic: e.target.checked,
                      })
                    }
                    className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="cardIsPublic"
                    className="ml-3 block text-sm text-gray-700"
                  >
                    <span className="font-semibold">Make this card public</span>
                    <span className="block text-gray-500 mt-1">
                      Other users can discover and use this card
                    </span>
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
