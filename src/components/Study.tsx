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
  arrayUnion,
  writeBatch,
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
  // PauseIcon,
  // ChartBarIcon,
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
  publicCode?: string; // Generated when made public
  publicPassword?: string; // Generated when made public
  borrowedFrom?: string; // UID of original creator
  isBorrowed?: boolean; // True if borrowed from another user
  originalSetId?: string; // Reference to original set
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
  const [studyMode, setStudyMode] = useState<"flashcards" | "quiz">(
    "flashcards"
  );
  const [isStudying, setIsStudying] = useState(false);

  // Quiz mode state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  // Batched updates state
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);
  // const [isOnline, setIsOnline] = useState(navigator.onLine);
  // const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  // unused UI toggles removed for build
  // const [showCreateCardForm, setShowCreateCardForm] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "my" | "public" | "borrowed">(
    "all"
  );
  // const [isEditingSet, setIsEditingSet] = useState(false);
  // const [editingSet, setEditingSet] = useState<StudySet | null>(null);
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

  // Public set states
  const [showMakePublicModal, setShowMakePublicModal] = useState(false);
  const [showImportPublicModal, setShowImportPublicModal] = useState(false);
  // const [selectedSetForPublic, setSelectedSetForPublic] =
    useState<StudySet | null>(null);
  const [publicSetCredentials, setPublicSetCredentials] = useState<{
    code: string;
    password: string;
  } | null>(null);
  const [importForm, setImportForm] = useState({
    code: "",
    password: "",
  });

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
        // Stay on Study to show public landing when not signed in
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // Redirect removed: show public landing when not signed in

  // Load study sets with localStorage caching - NO real-time listeners
  useEffect(() => {
    if (!memoizedUser) return;

    const loadStudySets = async () => {
      try {
        // Check localStorage first
        const cacheKey = `studySets_${memoizedUser.uid}`;
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);

        // Use cache if it's less than 10 minutes old
        const isCacheValid =
          cacheTimestamp &&
          Date.now() - parseInt(cacheTimestamp) < 10 * 60 * 1000;

        if (cachedData && isCacheValid) {
          console.log("Using cached study sets");
          const rawSets = JSON.parse(cachedData);
          const revivedSets: StudySet[] = (rawSets || []).map((set: any) => ({
            ...set,
            createdAt:
              set.createdAt instanceof Date
                ? set.createdAt
                : new Date(set.createdAt),
            lastStudied: set.lastStudied
              ? set.lastStudied instanceof Date
                ? set.lastStudied
                : new Date(set.lastStudied)
              : undefined,
            flashcards: (set.flashcards || []).map((card: any) => ({
              ...card,
              createdAt:
                card.createdAt instanceof Date
                  ? card.createdAt
                  : new Date(card.createdAt),
              lastReviewed: card.lastReviewed
                ? card.lastReviewed instanceof Date
                  ? card.lastReviewed
                  : new Date(card.lastReviewed)
                : undefined,
            })),
          }));
          setStudySets(revivedSets);
          return;
        }

        // Load from Firebase only if cache is invalid
        console.log("Loading study sets from Firebase (one-time load)");
        let q;
        if (memoizedFilter === "my") {
          q = query(
            collection(db, "studySets"),
            where("createdBy", "==", memoizedUser.uid)
          );
        } else if (memoizedFilter === "public") {
          q = query(collection(db, "studySets"), where("isPublic", "==", true));
        } else if (memoizedFilter === "borrowed") {
          q = query(
            collection(db, "studySets"),
            where("isBorrowed", "==", true)
          );
        } else {
          q = query(collection(db, "studySets"));
        }

        // Single getDocs call instead of onSnapshot listener
        const snapshot = await getDocs(q);
        // const sets: StudySet[] = [];

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
          let progress: "not_started" | "started" | "completed" = "not_started";
          if (setData.lastStudied) {
            const lastStudiedDate = setData.lastStudied.toDate
              ? setData.lastStudied.toDate()
              : new Date(setData.lastStudied);
            const today = new Date();
            const daysSinceLastStudy = Math.floor(
              (today.getTime() - lastStudiedDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

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

        // Client-side sorting
        resolvedSets.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        // Cache the results
        localStorage.setItem(cacheKey, JSON.stringify(resolvedSets));
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

        setStudySets(resolvedSets);
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
    // setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
    setTimer(0);
    setIsTimerRunning(true);

    // Clear any pending card updates from previous session
    setPendingCardUpdates([]);

    // Initialize quiz mode if selected
    if (studyMode === "quiz") {
      const firstCard = set.flashcards[0];
      if (firstCard) {
        // Only use answers from the current study set
        const currentSetAnswers = set.flashcards.map((c) => c.back);
        setQuizOptions(generateQuizOptions(firstCard.back, currentSetAnswers));
      }
    }

    // Scroll to top when study session starts
    window.scrollTo({ top: 0, behavior: "smooth" });

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
      // setShowAnswer(false);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      // setShowAnswer(false);
    }
  };

  // Batch update state to reduce Firebase calls
  const [pendingCardUpdates, setPendingCardUpdates] = useState<
    Array<{
      cardId: string;
      mastery: number;
      lastReviewed: Date;
    }>
  >([]);

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

      // Add to batched updates instead of immediate Firebase call
      addPendingUpdate({
        type: "card",
        setId: currentSet.id,
        cardId: currentCard.id,
        mastery: newMastery,
        lastReviewed: new Date(),
      });

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

  const makeSetPublic = async (set: StudySet) => {
    if (!memoizedUser) return;

    try {
      const publicCode = generatePublicCode();
      const publicPassword = generatePublicPassword();

      // Update the study set to be public
      await updateDoc(doc(db, "studySets", set.id), {
        isPublic: true,
        publicCode,
        publicPassword,
      });

      // Store in publicSets collection for easy lookup
      await setDoc(doc(db, "publicSets", publicCode), {
        originalSetId: set.id,
        publicCode,
        publicPassword,
        createdBy: set.createdBy,
        title: set.title,
        description: set.description,
        category: set.category,
        cardCount: set.cardCount,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      setPublicSetCredentials({ code: publicCode, password: publicPassword });
      setShowMakePublicModal(true);
    } catch (error) {
      console.error("Error making set public:", error);
    }
  };

  const importPublicSet = async () => {
    if (!memoizedUser || !importForm.code || !importForm.password) return;

    try {
      // Find the public set by code
      const publicSetQuery = query(
        collection(db, "publicSets"),
        where("publicCode", "==", importForm.code.toUpperCase()),
        where("isActive", "==", true)
      );
      const publicSetSnapshot = await getDocs(publicSetQuery);

      if (publicSetSnapshot.empty) {
        alert("Invalid code or set not found.");
        return;
      }

      const publicSetDoc = publicSetSnapshot.docs[0];
      const publicSetData = publicSetDoc.data();

      // Verify password
      if (publicSetData.publicPassword !== importForm.password.toUpperCase()) {
        alert("Invalid password.");
        return;
      }

      // Get the original study set
      const originalSetDoc = await getDoc(
        doc(db, "studySets", publicSetData.originalSetId)
      );
      if (!originalSetDoc.exists()) {
        alert("Original study set not found.");
        return;
      }

      const originalSetData = originalSetDoc.data();

      // Get all flashcards from the original set
      const flashcardsQuery = query(
        collection(db, "studySets", publicSetData.originalSetId, "flashcards"),
        orderBy("createdAt", "asc")
      );
      const flashcardsSnapshot = await getDocs(flashcardsQuery);
      const flashcards = flashcardsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastReviewed: doc.data().lastReviewed?.toDate(),
      })) as Flashcard[];

      // Create new borrowed study set
      const newSetRef = await addDoc(collection(db, "studySets"), {
        title: `${originalSetData.title} (Borrowed)`,
        description: originalSetData.description,
        category: originalSetData.category,
        createdBy: memoizedUser.uid,
        isPublic: false,
        isBorrowed: true,
        borrowedFrom: originalSetData.createdBy,
        originalSetId: publicSetData.originalSetId,
        createdAt: serverTimestamp(),
        lastStudied: null,
        cardCount: flashcards.length,
      });

      // Add all flashcards to the new set
      const addFlashcardPromises = flashcards.map((flashcard) =>
        addDoc(collection(db, "studySets", newSetRef.id, "flashcards"), {
          front: flashcard.front,
          back: flashcard.back,
          category: flashcard.category,
          difficulty: flashcard.difficulty,
          mastery: 0, // Reset mastery for borrowed set
          createdBy: memoizedUser.uid,
          isPublic: false,
          createdAt: serverTimestamp(),
          lastReviewed: null,
        })
      );

      await Promise.all(addFlashcardPromises);

      // Reset import form
      setImportForm({ code: "", password: "" });
      setShowImportPublicModal(false);
      alert("Study set imported successfully!");
    } catch (error) {
      console.error("Error importing public set:", error);
      alert("Error importing study set. Please try again.");
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

  // Utility functions for public sets
  const generatePublicCode = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generatePublicPassword = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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

  // Quiz mode functions
  const generateQuizOptions = (
    correctAnswer: string,
    currentSetAnswers: string[]
  ) => {
    const options = [correctAnswer];
    const otherAnswers = currentSetAnswers.filter(
      (answer) => answer !== correctAnswer
    );

    // Shuffle and take up to 3 wrong answers from the current set only
    const shuffled = otherAnswers.sort(() => Math.random() - 0.5);
    options.push(...shuffled.slice(0, 3));

    // Shuffle the final options
    return options.sort(() => Math.random() - 0.5);
  };

  const handleQuizAnswerSelect = (selectedOption: string) => {
    setSelectedAnswer(selectedOption);
    const correct =
      selectedOption === currentSet?.flashcards[currentCardIndex]?.back;
    setIsAnswerCorrect(correct);

    if (correct) {
      markCard("easy");
    } else {
      markCard("hard");
    }
  };

  const nextQuizQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);

    if (currentCardIndex < currentSet!.flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      const nextCard = currentSet!.flashcards[currentCardIndex + 1];
      // Only use answers from the current study set
      const currentSetAnswers = currentSet!.flashcards.map((c) => c.back);
      setQuizOptions(generateQuizOptions(nextCard.back, currentSetAnswers));
    } else {
      // Quiz completed
      endStudySession();
    }
  };

  // Batched update functions
  const addPendingUpdate = (update: any) => {
    setPendingUpdates((prev) => [
      ...prev,
      { ...update, timestamp: Date.now() },
    ]);
  };

  const syncPendingUpdates = async () => {
    if (pendingUpdates.length === 0 || !memoizedUser) return;

    try {
      console.log(
        `Syncing ${pendingUpdates.length} pending updates to Firebase`
      );

      // Group updates by type and batch them
      const cardUpdates = pendingUpdates.filter((u) => u.type === "card");
      const setUpdates = pendingUpdates.filter((u) => u.type === "set");
      const userUpdates = pendingUpdates.filter((u) => u.type === "user");

      // Batch card updates
      if (cardUpdates.length > 0) {
        const batch = writeBatch(db);
        cardUpdates.forEach((update) => {
          const cardRef = doc(
            db,
            "studySets",
            update.setId,
            "flashcards",
            update.cardId
          );
          batch.update(cardRef, { mastery: update.mastery });
        });
        await batch.commit();
      }

      // Batch set updates
      if (setUpdates.length > 0) {
        const batch = writeBatch(db);
        setUpdates.forEach((update) => {
          const setRef = doc(db, "studySets", update.setId);
          batch.update(setRef, update.data);
        });
        await batch.commit();
      }

      // User updates (usually single)
      if (userUpdates.length > 0) {
        const userRef = doc(db, "users", memoizedUser.uid);
        const latestUserUpdate = userUpdates[userUpdates.length - 1];
        await updateDoc(userRef, latestUserUpdate.data);
      }

      // Clear pending updates and update cache
      setPendingUpdates([]);

      // Update localStorage cache
      const cacheKey = `studySets_${memoizedUser.uid}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_timestamp`);

      console.log("Successfully synced all pending updates");
    } catch (error) {
      console.error("Error syncing pending updates:", error);
    }
  };

  // Window focus/blur event handlers
  useEffect(() => {
    const handleWindowBlur = () => {
      console.log("Window lost focus - syncing pending updates");
      syncPendingUpdates();
    };

    const handleOnline = () => {
      // setIsOnline(true);
      console.log("Back online - syncing pending updates");
      syncPendingUpdates();
    };

    const handleOffline = () => {
      // setIsOnline(false);
      console.log("Gone offline - updates will be queued");
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [pendingUpdates, memoizedUser]);

  // Sync on component unmount
  useEffect(() => {
    return () => {
      if (pendingUpdates.length > 0) {
        console.log("Component unmounting - syncing pending updates");
        syncPendingUpdates();
      }
    };
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Public landing when not signed in
  if (!memoizedUser) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white flex flex-col">
          <div className="flex-1">
            <div className="relative overflow-visible max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="pt-32 pb-16 text-center">
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <span>🧠</span>
                  <span>→</span>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-semibold">AI</span>
                  <span>→</span>
                  <span>🎓</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                  Study smarter with Brightfolio
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
                  Build flashcards fast, quiz yourself, and track progress with a clean, modern UI.
                </p>
                <div className="mt-2 flex justify-center gap-3">
                  <a
                    href="/account"
                    className="inline-block px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 duration-300 shadow-lg text-base font-semibold"
                  >
                    Sign in to get started
                  </a>
                  <a
                    href="#features"
                    className="inline-block px-6 py-3 bg-white text-gray-900 rounded-full border-2 border-gray-200 hover:bg-gray-50 transition-all text-base font-semibold"
                  >
                    Explore features
                  </a>
                </div>
              </div>

              {/* Promo Card (blurred green like home tab) */}
              <div
                className="mt-4 max-w-2xl mx-auto bg-green-50/60 backdrop-blur-md border border-green-200/70 rounded-xl p-8 pb-10 flex flex-col items-center text-center shadow-lg"
              >
                <div className="flex items-center mb-3 justify-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-100 text-green-700 mr-2">✓</span>
                  <h2 className="text-2xl font-bold text-green-700">Flashcards & Quiz Mode</h2>
                </div>
                <p className="text-gray-700 mb-3">
                  Switch between classic flashcards and multiple‑choice quizzes using answers from your set.
                </p>
                <a
                  href="#features"
                  className="px-6 py-2.5 bg-white text-gray-900 rounded-full border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all shadow-sm"
                >
                  See how it works
                </a>
              </div>

              {/* Features */}
              <div id="features" className="max-w-6xl mx-auto py-20">
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to learn faster</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    A focused, flat UI with no distractions. Designed to help you retain more.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center mb-4">
                      <span className="text-green-600">🗂️</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Fast Set Builder</h4>
                    <p className="text-sm text-gray-600">Create sets in seconds, organize by category, and keep it tidy.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center mb-4">
                      <span className="text-green-600">🧩</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Quiz Mode</h4>
                    <p className="text-sm text-gray-600">Multiple‑choice answers generated from your own set; no noise.</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center mb-4">
                      <span className="text-green-600">📈</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Progress Tracking</h4>
                    <p className="text-sm text-gray-600">Streaks, time studied, XP, and mastery—saved locally and synced smartly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
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
              <p className="text-gray-600 mb-8">
                No flashcards found in this study set.
              </p>
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
            <div className="flex items-center justify-between bg-white rounded-xl p-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentSet.title}
                </h1>
                <p className="text-gray-600">
                  Card {currentCardIndex + 1} of{" "}
                  {currentSet?.flashcards?.length || 0}
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
            <div className="mt-4 bg-white rounded-xl p-4">
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

          {/* Study Interface - Conditional Rendering for Flashcards vs Quiz */}
          {studyMode === "flashcards" ? (
            /* Flashcard Mode */
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-6">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {currentCard?.category || "General"}
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
          ) : (
            /* Quiz Mode */
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="p-8">
                  <div className="text-center mb-6">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      Quiz Mode
                    </span>
                  </div>

                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {currentCard?.front}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Choose the correct answer
                    </p>
                  </div>

                  <div className="space-y-3">
                    {quizOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuizAnswerSelect(option)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          selectedAnswer === option
                            ? isAnswerCorrect
                              ? "border-green-500 bg-green-50 text-green-700"
                              : "border-red-500 bg-red-50 text-red-700"
                            : selectedAnswer !== null &&
                              option === currentCard?.back
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium mr-3">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-lg">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedAnswer !== null && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={nextQuizQuestion}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                      >
                        {currentCardIndex + 1 < currentSet.flashcards.length
                          ? "Next Question"
                          : "Finish Quiz"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation and Difficulty Buttons - Only for Flashcard Mode */}
          {studyMode === "flashcards" && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between bg-white rounded-xl p-6">
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
                  disabled={
                    currentCardIndex ===
                    (currentSet?.flashcards?.length || 0) - 1
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-32 px-4">
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
          <div className="bg-white rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Study Stats & Progress
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left: Study Stats Cards */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Study Streak */}
                  <div className="rounded-lg p-4 bg-orange-50 text-orange-700 border border-orange-200 border-l-4 border-l-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-orange-600">
                          Current Streak
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {userStats.currentStreak}
                        </p>
                        <p className="text-xs text-gray-500">days</p>
                      </div>
                      <div className="text-xl" aria-hidden>
                        🔥
                      </div>
                    </div>
                  </div>

                  {/* Total Study Time */}
                  <div className="rounded-lg p-4 bg-blue-50 text-blue-700 border border-blue-200 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-blue-600">
                          Total Study Time
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {Math.floor(userStats.totalStudyTime / 3600)}
                        </p>
                        <p className="text-xs text-gray-500">hours</p>
                      </div>
                      <div className="text-xl" aria-hidden>
                        ⏱️
                      </div>
                    </div>
                  </div>

                  {/* Total XP */}
                  <div className="rounded-lg p-4 bg-purple-50 text-purple-700 border border-purple-200 border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-purple-600">
                          Total XP
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {userStats.totalXP}
                        </p>
                        <p className="text-xs text-gray-500">
                          Level {userStats.level}
                        </p>
                      </div>
                      <div className="text-xl" aria-hidden>
                        ⭐
                      </div>
                    </div>
                  </div>

                  {/* Total Sessions */}
                  <div className="rounded-lg p-4 bg-green-50 text-green-700 border border-green-200 border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-green-600">
                          Study Sessions
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {userStats.totalSessions}
                        </p>
                        <p className="text-xs text-gray-500">completed</p>
                      </div>
                      <div className="text-xl" aria-hidden>
                        📚
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Study Time Progress Graph */}
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Study Time Progress
                </h4>
                {(() => {
                  // Process study history to get daily study time
                  const dailyStudyTime = new Map<string, number>();

                  userStats.studyHistory.forEach((session) => {
                    const startTime =
                      session.startTime instanceof Date
                        ? session.startTime
                        : new Date(session.startTime);
                    const dateKey = startTime.toISOString().split("T")[0]; // YYYY-MM-DD format

                    dailyStudyTime.set(
                      dateKey,
                      (dailyStudyTime.get(dateKey) || 0) + session.duration
                    );
                  });

                  // Convert to sorted array of [date, minutes] pairs
                  const sortedData: [string, number][] = Array.from(
                    dailyStudyTime.entries()
                  )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, seconds]) => [date, Math.round(seconds / 60)]); // Convert to minutes

                  if (sortedData.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📊</div>
                        <p>
                          No study data yet. Start studying to see your
                          progress!
                        </p>
                      </div>
                    );
                  }

                  const maxMinutes = Math.max(
                    ...sortedData.map(([, minutes]) => minutes)
                  );
                  const chartHeight = 200;
                  const chartWidth = Math.max(400, sortedData.length * 60);

                  // Padding to keep line within bounds
                  const paddingLeft = 48; // room for y-axis labels
                  const paddingRight = 16;
                  const paddingTop = 8;
                  const paddingBottom = 24; // room for x-axis labels
                  const innerWidth = Math.max(
                    1,
                    chartWidth - paddingLeft - paddingRight
                  );
                  const innerHeight = Math.max(
                    1,
                    chartHeight - paddingTop - paddingBottom
                  );

                  // Avoid divide-by-zero; render flat line if all minutes are 0
                  const safeMax = maxMinutes > 0 ? maxMinutes : 1;
                  const xDenominator = Math.max(1, sortedData.length - 1);

                  return (
                    <div className="overflow-x-auto">
                      <div
                        className="relative"
                        style={{ width: chartWidth, height: chartHeight }}
                      >
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
                          {[
                            maxMinutes,
                            Math.round(maxMinutes * 0.75),
                            Math.round(maxMinutes * 0.5),
                            Math.round(maxMinutes * 0.25),
                            0,
                          ].map((value, index) => (
                            <div key={index} className="flex items-center">
                              <span>{value}m</span>
                              <div className="ml-2 w-2 h-px bg-gray-200"></div>
                            </div>
                          ))}
                        </div>

                        {/* Grid lines */}
                        <svg
                          className="absolute inset-0 w-full h-full"
                          style={{ left: `${paddingLeft}px` }}
                        >
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                            <line
                              key={index}
                              x1={0}
                              y1={paddingTop + innerHeight * ratio}
                              x2={innerWidth}
                              y2={paddingTop + innerHeight * ratio}
                              stroke="#e5e7eb"
                              strokeWidth="1"
                            />
                          ))}
                        </svg>

                        {/* Line graph */}
                        <svg
                          className="absolute inset-0 w-full h-full"
                          style={{ left: `${paddingLeft}px` }}
                        >
                          <polyline
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            points={sortedData
                              .map(([_, minutes], index) => {
                                const x = (index / xDenominator) * innerWidth;
                                const y =
                                  paddingTop +
                                  innerHeight -
                                  (minutes / safeMax) * innerHeight;
                                return `${x},${y}`;
                              })
                              .join(" ")}
                          />

                          {/* Data points */}
                          {sortedData.map(([_, minutes], index) => {
                            const x = (index / xDenominator) * innerWidth;
                            const y =
                              paddingTop +
                              innerHeight -
                              (minutes / safeMax) * innerHeight;
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
                        <div
                          className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500"
                          style={{
                            left: `${paddingLeft}px`,
                            right: `${paddingRight}px`,
                          }}
                        >
                          {sortedData.map(([date], index) => {
                            const displayDate = new Date(
                              date
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            });
                            return (
                              <div
                                key={index}
                                className="text-center transform -rotate-45 origin-bottom-left"
                              >
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
                          <div className="text-sm text-gray-600">
                            Days Studied
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(
                              sortedData.reduce(
                                (sum, [, minutes]) => sum + minutes,
                                0
                              ) / sortedData.length
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Avg Minutes/Day
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.max(
                              ...sortedData.map(([, minutes]) => minutes)
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Max Minutes
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
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
                        className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer transition-colors duration-200"
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
                    {
                      studySets.filter((set) => set.progress === "started")
                        .length
                    }
                  </span>
                </div>
                <div className="space-y-3">
                  {studySets
                    .filter((set) => set.progress === "started")
                    .slice(0, 3)
                    .map((set) => (
                      <div
                        key={set.id}
                        className="bg-white rounded-lg p-3 border border-blue-200 cursor-pointer transition-colors duration-200"
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
                  {studySets.filter((set) => set.progress === "started")
                    .length > 3 && (
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
                        className="bg-white rounded-lg p-3 border border-green-200 cursor-pointer transition-colors duration-200"
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
              <button
                onClick={() => setFilter("borrowed")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === "borrowed"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Borrowed Sets
              </button>
            </div>

            {filter === "public" && (
              <button
                onClick={() => setShowImportPublicModal(true)}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Public Set</span>
              </button>
            )}
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
                className="bg-white rounded-2xl transition-colors duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {set.category}
                      </span>
                      {set.isBorrowed && (
                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          Borrowed
                        </span>
                      )}
                    </div>
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

                  <div className="space-y-3">
                    {/* Study Mode Selector */}
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">Study Mode:</span>
                      <button
                        onClick={() => setStudyMode("flashcards")}
                        className={`px-3 py-1 rounded ${
                          studyMode === "flashcards"
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        📝 Flashcards
                      </button>
                      <button
                        onClick={() => setStudyMode("quiz")}
                        className={`px-3 py-1 rounded ${
                          studyMode === "quiz"
                            ? "bg-purple-100 text-purple-700 font-medium"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        ❓ Quiz
                      </button>
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
                            {!set.isPublic && (
                              <button
                                onClick={() => makeSetPublic(set)}
                                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                                title="Make Public"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            )}
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
                  : filter === "borrowed"
                  ? "You haven't borrowed any study sets yet."
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
          <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-2xl">
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold"
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
          <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-2xl">
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make Public Modal */}
      {showMakePublicModal && publicSetCredentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md">
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Set Made Public!
              </h2>
              <p className="text-gray-600 mb-6">
                Your study set is now public. Share these credentials with
                others to let them import your set.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Public Code
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={publicSetCredentials.code}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-lg text-center"
                    />
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(publicSetCredentials.code)
                      }
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={publicSetCredentials.password}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-lg text-center"
                    />
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          publicSetCredentials.password
                        )
                      }
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowMakePublicModal(false);
                  setPublicSetCredentials(null);
                }}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Public Set Modal */}
      {showImportPublicModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Import Public Set
              </h2>
              <button
                onClick={() => setShowImportPublicModal(false)}
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
                importPublicSet();
              }}
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Public Code
                  </label>
                  <input
                    type="text"
                    value={importForm.code}
                    onChange={(e) =>
                      setImportForm({
                        ...importForm,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 font-mono text-center"
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="text"
                    value={importForm.password}
                    onChange={(e) =>
                      setImportForm({
                        ...importForm,
                        password: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 font-mono text-center"
                    placeholder="Enter 4-character password"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowImportPublicModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
                >
                  Import Set
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
