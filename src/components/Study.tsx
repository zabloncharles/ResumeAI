import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SignInModal from "./SignInModal";
import OfflineIndicator from "./OfflineIndicator";
import { db } from "../firebase";
import { useOfflineSupport } from "../hooks/useOfflineSupport";
import {
  StudySet,
  Flashcard,
  StudySession,
  UserStats,
  UNCATEGORIZED_FOLDER_ID,
} from "../types/study";
import { useStudyFolders } from "../hooks/useStudyFolders";
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
import {
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
  Link,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BookOpenIcon,
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
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  StudyHubQuickActions,
  StudyHubJumpBack,
  StudyHubRecents,
  pickJumpBackSet,
  getRecentSets,
  filterSetsBySearch,
  touchRecentSet,
} from "./study/StudyHubSections";
import StudyShell from "./study/StudyShell";
import StudySessionShell from "./study/StudySessionShell";
import StudyFolderView, {
  getSetsForFolderId,
} from "./study/StudyFolderView";
import StudyLibraryView from "./study/StudyLibraryView";
import NewFolderModal from "./study/NewFolderModal";
import StudyPerformanceView from "./study/StudyPerformanceView";
import StudyCategorySelect from "./study/StudyCategorySelect";
import {
  DEFAULT_STUDY_CATEGORY_ID,
  displayStudySetCategory,
  studyCategoryFirestoreFields,
} from "../constants/studyCategories";
import StudySectionHeader from "./study/StudySectionHeader";
import { streakAfterCalendarGap } from "../utils/studyStreak";
import {
  issuePrivateShareCredentials,
  resolvePrivateShareImport,
} from "../utils/studyPublicSet";

const STUDY_IDLE_MS = 60_000;

const Study = () => {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId?: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isOnline, isOfflineMode } = useOfflineSupport();

  // Log offline status for debugging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Study: Online status changed:", { isOnline, isOfflineMode });
    }
  }, [isOnline, isOfflineMode]);
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
  const [isTimerIdlePaused, setIsTimerIdlePaused] = useState(false);
  const [idlePauseSecondsRemaining, setIdlePauseSecondsRemaining] = useState(
    STUDY_IDLE_MS / 1000
  );
  const lastStudyActivityRef = useRef(Date.now());
  const timerIdlePausedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  // unused UI toggles removed for build
  // const [showCreateCardForm, setShowCreateCardForm] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "my" | "public" | "borrowed">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionSidebarOpen, setSessionSidebarOpen] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  // const [isEditingSet, setIsEditingSet] = useState(false);
  // const [editingSet, setEditingSet] = useState<StudySet | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalStudyTime: 0,
    totalSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    bestContinuousStudySeconds: 0,
    totalXP: 0,
    level: 1,
    studyHistory: [],
  });
  const sessionContinuousRef = useRef(0);
  const sessionContinuousBestRef = useRef(0);
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
    categoryId: DEFAULT_STUDY_CATEGORY_ID,
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

  const { folders, createFolder, touchFolder } = useStudyFolders(
    memoizedUser?.uid
  );

  const pathNorm = location.pathname.replace(/\/$/, "") || "/";
  const isStudyLibrary = pathNorm === "/study/library";
  const isStudyPerformance = pathNorm === "/study/performance";
  const isStudyFolder = Boolean(folderId);

  useEffect(() => {
    if (!isStudyLibrary) return;
    const urlFilter = searchParams.get("filter");
    if (
      urlFilter === "public" ||
      urlFilter === "borrowed" ||
      urlFilter === "my" ||
      urlFilter === "all"
    ) {
      setFilter(urlFilter);
    } else {
      setFilter("all");
    }
  }, [isStudyLibrary, searchParams]);

  const uncategorizedCount = useMemo(
    () => studySets.filter((s) => !s.folderId).length,
    [studySets]
  );

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === folderId) ?? null,
    [folders, folderId]
  );

  const folderPageSets = useMemo(() => {
    if (!folderId) return [];
    return filterSetsBySearch(
      getSetsForFolderId(studySets, folderId),
      searchQuery
    );
  }, [studySets, folderId, searchQuery]);

  const libraryPageSets = useMemo(
    () => filterSetsBySearch(studySets, searchQuery),
    [studySets, searchQuery]
  );

  const goCreateSet = (targetFolderId?: string) => {
    if (targetFolderId && targetFolderId !== UNCATEGORIZED_FOLDER_ID) {
      navigate(`/create?folder=${targetFolderId}`);
    } else {
      navigate("/create");
    }
  };

  const handleLibraryFilter = (next: typeof filter) => {
    setFilter(next);
    if (next === "all") {
      navigate("/study/library");
    } else {
      navigate(`/study/library?filter=${next}`);
    }
  };

  const handleCreateFolder = async (title: string, description: string) => {
    const id = await createFolder(title, description);
    if (id) navigate(`/study/folder/${id}`);
  };

  const jumpBackSet = useMemo(
    () => pickJumpBackSet(studySets),
    [studySets]
  );

  const recentSets = useMemo(() => {
    if (!memoizedUser) return [];
    return getRecentSets(
      studySets,
      memoizedUser.uid,
      jumpBackSet?.id
    );
  }, [studySets, memoizedUser, jumpBackSet?.id]);

  const displayedStudySets = useMemo(
    () => filterSetsBySearch(studySets, searchQuery),
    [studySets, searchQuery]
  );

  // Use centralized auth context - no duplicate listener needed
  useEffect(() => {
    if (import.meta.env.DEV && user) {
      console.log("Study: User authenticated:", user.uid);
    }
    setIsLoading(false);
  }, [user]);

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
          if (import.meta.env.DEV) console.log("Using cached study sets");
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
        if (import.meta.env.DEV)
          console.log("Loading study sets from Firebase (one-time load)");
        let q;
        if (memoizedFilter === "my") {
          q = query(
            collection(db, "studySets"),
            where("createdBy", "==", memoizedUser.uid)
          );
        } else if (memoizedFilter === "public") {
          // Show user's own public sets
          q = query(
            collection(db, "studySets"),
            where("createdBy", "==", memoizedUser.uid),
            where("isPublic", "==", true)
          );
        } else if (memoizedFilter === "borrowed") {
          // Show sets borrowed by this user
          q = query(
            collection(db, "studySets"),
            where("createdBy", "==", memoizedUser.uid),
            where("isBorrowed", "==", true)
          );
        } else {
          // For "all" filter, only show user's own sets
          q = query(
            collection(db, "studySets"),
            where("createdBy", "==", memoizedUser.uid)
          );
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
            folderId: setData.folderId ?? null,
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
        const lastStudyDate = data.lastStudyDate?.toDate() as Date | undefined;
        const storedStreak = data.currentStreak || 0;
        const currentStreak = streakAfterCalendarGap(lastStudyDate, storedStreak);

        if (currentStreak !== storedStreak) {
          await updateDoc(doc(db, "users", memoizedUser.uid), {
            currentStreak,
          });
        }

        setUserStats({
          totalStudyTime: data.totalStudyTime || 0,
          totalSessions: data.totalSessions || 0,
          currentStreak,
          longestStreak: data.longestStreak || 0,
          lastStudyDate,
          bestContinuousStudySeconds: data.bestContinuousStudySeconds || 0,
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
        sessionContinuousRef.current += 1;
        if (
          sessionContinuousRef.current > sessionContinuousBestRef.current
        ) {
          sessionContinuousBestRef.current = sessionContinuousRef.current;
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    if (!isStudying) return;

    lastStudyActivityRef.current = Date.now();
    timerIdlePausedRef.current = false;
    setIsTimerIdlePaused(false);
    setIdlePauseSecondsRemaining(STUDY_IDLE_MS / 1000);

    const markActive = () => {
      lastStudyActivityRef.current = Date.now();
      setIdlePauseSecondsRemaining(STUDY_IDLE_MS / 1000);
      if (timerIdlePausedRef.current) {
        timerIdlePausedRef.current = false;
        setIsTimerIdlePaused(false);
        setIsTimerRunning(true);
      }
    };

    const activityEvents = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ] as const;

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markActive, { passive: true });
    }

    const idleCheck = window.setInterval(() => {
      const elapsed = Date.now() - lastStudyActivityRef.current;
      const remainingSec = Math.max(
        0,
        Math.ceil((STUDY_IDLE_MS - elapsed) / 1000)
      );
      setIdlePauseSecondsRemaining(remainingSec);

      if (elapsed < STUDY_IDLE_MS) return;
      if (timerIdlePausedRef.current) return;
      timerIdlePausedRef.current = true;
      setIsTimerIdlePaused(true);
      setIsTimerRunning(false);
      setIdlePauseSecondsRemaining(0);
      sessionContinuousRef.current = 0;
    }, 1000);

    return () => {
      window.clearInterval(idleCheck);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markActive);
      }
    };
  }, [isStudying]);

  const startStudySession = async (set: StudySet) => {
    const startTime = new Date();
    setSessionStartTime(startTime);

    setStudyMode("flashcards");
    setSessionSidebarOpen(false);
    setCurrentSet(set);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsStudying(true);
    // setShowAnswer(false);
    setScore({ correct: 0, total: 0 });
    setTimer(0);
    setIsTimerRunning(true);
    setIsTimerIdlePaused(false);
    timerIdlePausedRef.current = false;
    lastStudyActivityRef.current = Date.now();
    setIdlePauseSecondsRemaining(STUDY_IDLE_MS / 1000);
    sessionContinuousRef.current = 0;
    sessionContinuousBestRef.current = 0;

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

    if (memoizedUser) {
      touchRecentSet(memoizedUser.uid, set.id);
    }
    if (set.folderId) {
      touchFolder(set.folderId);
    }

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
      const sessionDuration = timer;

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
      const newBestContinuous = Math.max(
        userStats.bestContinuousStudySeconds,
        sessionContinuousBestRef.current
      );

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
          bestContinuousStudySeconds: newBestContinuous,
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
          bestContinuousStudySeconds: newBestContinuous,
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
    setIsTimerIdlePaused(false);
    timerIdlePausedRef.current = false;
    setTimer(0);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const goToCardIndex = (index: number) => {
    setCurrentCardIndex(index);
    setIsFlipped(false);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
  };

  const nextCard = () => {
    if (currentSet && currentCardIndex < currentSet.flashcards.length - 1) {
      goToCardIndex(currentCardIndex + 1);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      goToCardIndex(currentCardIndex - 1);
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

  const markCard = (
    difficulty: "easy" | "medium" | "hard",
    options?: { advance?: boolean }
  ) => {
    if (!currentSet || !memoizedUser) return;

    const currentCard = currentSet.flashcards[currentCardIndex];
    if (!currentCard) return;

    let newMastery = currentCard.mastery;
    if (difficulty === "easy")
      newMastery = Math.min(100, currentCard.mastery + 10);
    else if (difficulty === "medium")
      newMastery = Math.min(100, currentCard.mastery + 5);
    else newMastery = Math.max(0, currentCard.mastery - 5);

    const isCorrect = difficulty === "easy" || difficulty === "medium";
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    addPendingUpdate({
      type: "card",
      setId: currentSet.id,
      cardId: currentCard.id,
      mastery: newMastery,
      lastReviewed: new Date(),
    });

    setCurrentSet((prev) => {
      if (!prev) return prev;
      const updatedFlashcards = prev.flashcards.map((card) =>
        card.id === currentCard.id ? { ...card, mastery: newMastery } : card
      );
      return { ...prev, flashcards: updatedFlashcards };
    });

    if (options?.advance !== false) {
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

    if (import.meta.env.DEV)
      console.log("Creating study set with user:", memoizedUser.uid);

    try {
      const docRef = await addDoc(collection(db, "studySets"), {
        title: newSetForm.title,
        description: newSetForm.description,
        ...studyCategoryFirestoreFields(newSetForm.categoryId),
        createdBy: memoizedUser.uid,
        isPublic: newSetForm.isPublic,
        createdAt: serverTimestamp(),
        lastStudied: null,
      });

      if (import.meta.env.DEV)
        console.log("Study set created successfully:", docRef.id);

      setNewSetForm({
        title: "",
        description: "",
        categoryId: DEFAULT_STUDY_CATEGORY_ID,
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

  const sharePrivateSet = async (set: StudySet) => {
    if (!memoizedUser || set.isPublic) return;

    try {
      const { shareCode, sharePassword } = await issuePrivateShareCredentials(
        set.id,
        {
          title: set.title,
          description: set.description,
          category: set.category,
          cardCount: set.cardCount,
          createdBy: set.createdBy,
        }
      );

      setPublicSetCredentials({ code: shareCode, password: sharePassword });
      setShowMakePublicModal(true);
    } catch (error) {
      console.error("Error creating share link:", error);
    }
  };

  const importPublicSet = async () => {
    if (!memoizedUser || !importForm.code || !importForm.password) return;

    try {
      const originalSetId = await resolvePrivateShareImport(
        importForm.code,
        importForm.password
      );
      if (!originalSetId) {
        alert("Invalid code or password.");
        return;
      }

      const originalSetDoc = await getDoc(doc(db, "studySets", originalSetId));
      if (!originalSetDoc.exists()) {
        alert("Original study set not found.");
        return;
      }

      const originalSetData = originalSetDoc.data();

      // Get all flashcards from the original set
      const flashcardsQuery = query(
        collection(db, "studySets", originalSetId, "flashcards"),
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
        originalSetId,
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

  const changeStudyMode = (mode: "flashcards" | "quiz") => {
    setStudyMode(mode);
    if (mode === "quiz" && currentSet?.flashcards.length) {
      const card = currentSet.flashcards[currentCardIndex];
      if (card) {
        const answers = currentSet.flashcards.map((c) => c.back);
        setQuizOptions(generateQuizOptions(card.back, answers));
      }
      setIsFlipped(false);
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
    }
  };

  const handleQuizAnswerSelect = (selectedOption: string) => {
    if (selectedAnswer !== null) return;

    const correct =
      selectedOption === currentSet?.flashcards[currentCardIndex]?.back;
    setSelectedAnswer(selectedOption);
    setIsAnswerCorrect(correct);

    if (correct) {
      markCard("easy", { advance: false });
    } else {
      markCard("hard", { advance: false });
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
      if (import.meta.env.DEV) {
        console.log(
          `Syncing ${pendingUpdates.length} pending updates to Firebase`
        );
      }

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

      if (import.meta.env.DEV)
        console.log("Successfully synced all pending updates");
    } catch (error) {
      console.error("Error syncing pending updates:", error);
    }
  };

  // Window focus/blur event handlers
  useEffect(() => {
    const handleWindowBlur = () => {
      if (import.meta.env.DEV)
        console.log("Window lost focus - syncing pending updates");
      syncPendingUpdates();
    };

    const handleOnline = () => {
      // setIsOnline(true);
      if (import.meta.env.DEV)
        console.log("Back online - syncing pending updates");
      syncPendingUpdates();
    };

    const handleOffline = () => {
      // setIsOnline(false);
      if (import.meta.env.DEV)
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
        if (import.meta.env.DEV)
          console.log("Component unmounting - syncing pending updates");
        syncPendingUpdates();
      }
    };
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 dark:border-green-400"></div>
      </div>
    );
  }

  // Public landing when not signed in
  if (!memoizedUser) {
    return (
      <>
        <Navbar />
        <OfflineIndicator />
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
          <div className="flex-1">
            <div className="relative overflow-visible max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="pt-32 pb-16 text-center">
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <span>🧠</span>
                  <span>→</span>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-semibold">
                    AI
                  </span>
                  <span>→</span>
                  <span>🎓</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-6">
                  Study smarter with Brightfolio
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto mb-10">
                  Build flashcards fast, quiz yourself, and track progress with
                  a clean, modern UI.
                </p>
                <div className="mt-2 flex justify-center gap-3">
                  {!memoizedUser && (
                    <button
                      onClick={() => setShowSignInModal(true)}
                      className="inline-block px-8 py-3 bg-black dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-full hover:bg-gray-800 dark:hover:bg-white transition-all transform hover:scale-105 duration-300 shadow-lg text-base font-semibold"
                    >
                      Sign in to get started
                    </button>
                  )}
                  <a
                    href="#features"
                    className="inline-block px-6 py-3 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-full border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all text-base font-semibold"
                  >
                    Explore features
                  </a>
                </div>
              </div>

              <div className="mt-4 max-w-2xl mx-auto bg-green-50/60 dark:bg-green-950/40 backdrop-blur-md border border-green-200/70 dark:border-green-800/50 rounded-xl p-8 pb-10 flex flex-col items-center text-center shadow-lg">
                <div className="flex items-center mb-3 justify-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 mr-2">
                    ✓
                  </span>
                  <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
                    Flashcards & Quiz Mode
                  </h2>
                </div>
                <p className="text-gray-700 dark:text-zinc-300 mb-3">
                  Switch between classic flashcards and multiple‑choice quizzes
                  using answers from your set.
                </p>
                <a
                  href="#features"
                  className="px-6 py-2.5 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-full border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/50 hover:border-green-300 dark:hover:border-green-700 transition-all shadow-sm"
                >
                  See how it works
                </a>
              </div>

              <div id="features" className="max-w-6xl mx-auto py-20">
                <div className="text-center mb-10">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-3">
                    Everything you need to learn faster
                  </h3>
                  <p className="text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
                    A focused, flat UI with no distractions. Designed to help
                    you retain more.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                  <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 flex items-center justify-center mb-4">
                      <span className="text-green-600 dark:text-green-400">🗂️</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                      Fast Set Builder
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Create sets in seconds, organize by category, and keep it
                      tidy.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 flex items-center justify-center mb-4">
                      <span className="text-green-600 dark:text-green-400">🧩</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                      Quiz Mode
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Multiple‑choice answers generated from your own set; no
                      noise.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 flex items-center justify-center mb-4">
                      <span className="text-green-600 dark:text-green-400">📈</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                      Progress Tracking
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Streaks, time studied, XP, and mastery—saved locally and
                      synced smartly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>

        {/* Sign In Modal */}
        <SignInModal
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          onSuccess={() => setShowSignInModal(false)}
        />
      </>
    );
  }

  if (isStudying && currentSet) {
    // Check if we have flashcards and a valid current card
    if (!currentSet.flashcards || currentSet.flashcards.length === 0) {
      return (
        <>
          <OfflineIndicator />
          <StudySessionShell
            setTitle={currentSet.title}
            cardLabel="No cards in this set"
            timerLabel={formatTime(timer)}
            timerIdlePaused={isTimerIdlePaused}
            idlePauseCountdownActive={false}
            idlePauseSecondsRemaining={STUDY_IDLE_MS / 1000}
            studyMode={studyMode}
            onStudyModeChange={changeStudyMode}
            onEndSession={() => setIsStudying(false)}
            sidebarOpen={sessionSidebarOpen}
            onSidebarOpen={() => setSessionSidebarOpen(true)}
            onSidebarClose={() => setSessionSidebarOpen(false)}
          >
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-zinc-400 mb-6">
                No flashcards found in this study set.
              </p>
              <button
                type="button"
                onClick={() => setIsStudying(false)}
                className="study-btn px-4 py-2 text-sm font-medium"
              >
                Back to Study Hub
              </button>
            </div>
          </StudySessionShell>
        </>
      );
    }

    const currentCard = currentSet?.flashcards?.[currentCardIndex];
    const sessionCardLabel = `Card ${currentCardIndex + 1} of ${currentSet.flashcards.length}`;
    const idlePauseCountdownActive =
      !isTimerIdlePaused &&
      idlePauseSecondsRemaining < STUDY_IDLE_MS / 1000;

    return (
      <>
        <OfflineIndicator />
        <StudySessionShell
          setTitle={currentSet.title}
          cardLabel={sessionCardLabel}
          timerLabel={formatTime(timer)}
          timerIdlePaused={isTimerIdlePaused}
          idlePauseCountdownActive={idlePauseCountdownActive}
          idlePauseSecondsRemaining={idlePauseSecondsRemaining}
          studyMode={studyMode}
          onStudyModeChange={changeStudyMode}
          onEndSession={endStudySession}
          sidebarOpen={sessionSidebarOpen}
          onSidebarOpen={() => setSessionSidebarOpen(true)}
          onSidebarClose={() => setSessionSidebarOpen(false)}
        >
          <div className="mb-8">
            <div className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-zinc-500">
                  {Math.round(getProgressPercentage())}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-sky-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Study Interface - Conditional Rendering for Flashcards vs Quiz */}
          {studyMode === "flashcards" ? (
            /* Flashcard Mode */
            <div className="w-full mb-8">
              <div className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 w-full">
                <div className="p-8">
                  <div className="text-center mb-6">
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-sky-950 text-blue-800 dark:text-sky-200 rounded-full text-sm font-medium">
                      {currentCard?.category || "General"}
                    </span>
                  </div>

                  <div
                    className="study-flip-scene mx-auto w-full max-w-xl cursor-pointer select-none"
                    onClick={flipCard}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        flipCard();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={
                      isFlipped
                        ? "Showing answer. Activate to show term."
                        : "Showing term. Activate to reveal answer."
                    }
                  >
                    <div
                      key={currentCard?.id ?? currentCardIndex}
                      className={`study-flip-card relative h-[280px] sm:h-[300px] w-full ${
                        isFlipped ? "is-flipped" : ""
                      }`}
                    >
                      <div className="study-flip-face absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-950 px-6 py-10 text-center shadow-sm dark:shadow-none">
                        <span className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#16aeac] dark:text-study-accent">
                          Term
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-4">
                          {currentCard?.front}
                        </h2>
                        <p className="text-gray-500 dark:text-zinc-500 text-sm">
                          Tap to reveal answer
                        </p>
                      </div>
                      <div className="study-flip-face study-flip-face-back absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-sky-200 dark:border-zinc-600 bg-gradient-to-br from-sky-50 to-white dark:from-zinc-800 dark:to-zinc-900 px-6 py-10 text-center shadow-sm dark:shadow-none">
                        <span className="mb-3 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                          Definition
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-4">
                          {currentCard?.back}
                        </h2>
                        <p className="text-gray-500 dark:text-zinc-500 text-sm">
                          Tap to show term
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mastery Level */}
                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-zinc-400">Mastery:</span>
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
            <div className="w-full mb-8">
              <div className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 overflow-hidden w-full">
                <div className="p-8">
                  <div className="text-center mb-6">
                    <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                      Quiz Mode
                    </span>
                  </div>

                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-4">
                      {currentCard?.front}
                    </h2>
                    <p className="text-gray-500 dark:text-zinc-500 text-sm">
                      Choose the correct answer
                    </p>
                  </div>

                  <div className="space-y-3">
                    {quizOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuizAnswerSelect(option)}
                        disabled={selectedAnswer !== null}
                        className={`w-full p-4 text-left rounded-study border transition-all ${
                          selectedAnswer === option
                            ? isAnswerCorrect
                              ? "border-green-500 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300"
                              : "border-red-500 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                            : selectedAnswer !== null &&
                              option === currentCard?.back
                            ? "border-green-500 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300"
                            : "border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-700 dark:text-zinc-200 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium mr-3">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-lg">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedAnswer !== null && (
                    <div className="mt-6 space-y-4">
                      <div
                        className={`rounded-study border px-4 py-3 text-center ${
                          isAnswerCorrect
                            ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                            : "border-red-500 bg-red-50 dark:bg-red-950/40"
                        }`}
                        role="status"
                      >
                        <p
                          className={`text-lg font-semibold ${
                            isAnswerCorrect
                              ? "text-green-700 dark:text-green-300"
                              : "text-red-700 dark:text-red-300"
                          }`}
                        >
                          {isAnswerCorrect ? "Correct!" : "Incorrect"}
                        </p>
                        {!isAnswerCorrect && currentCard?.back ? (
                          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                            The answer is:{" "}
                            <span className="font-medium text-gray-900 dark:text-zinc-100">
                              {currentCard.back}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={nextQuizQuestion}
                          className="study-btn px-6 py-3 font-semibold"
                        >
                          {currentCardIndex + 1 < currentSet.flashcards.length
                            ? "Next Question"
                            : "Finish Quiz"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation and Difficulty Buttons - Only for Flashcard Mode */}
          {studyMode === "flashcards" && (
            <div className="w-full">
              <div className="flex flex-wrap items-center justify-between gap-3 study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 w-full">
                <button
                  onClick={previousCard}
                  disabled={currentCardIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-study hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Previous</span>
                </button>

                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => markCard("hard")}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-study hover:bg-red-200 dark:hover:bg-red-950 transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    <span>Hard</span>
                  </button>
                  <button
                    onClick={() => markCard("medium")}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300 rounded-study hover:bg-yellow-200 dark:hover:bg-yellow-950 transition-colors"
                  >
                    <span>Medium</span>
                  </button>
                  <button
                    onClick={() => markCard("easy")}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 rounded-study hover:bg-green-200 dark:hover:bg-green-950 transition-colors"
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
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-study hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Quizlet-style Question/Answer List */}
          <div className="w-full mt-8">
            <div className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                Study Set: {currentSet.title}
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {currentSet.flashcards.map((card, index) => (
                  <div
                    key={card.id}
                    className={`p-4 rounded-study border transition-all cursor-pointer ${
                      index === currentCardIndex
                        ? "border-blue-500 dark:border-sky-500 bg-blue-50 dark:bg-sky-950/40"
                        : "border-gray-200 dark:border-zinc-800 bg-transparent dark:bg-zinc-950/40 hover:border-gray-300 dark:hover:border-zinc-600"
                    }`}
                    onClick={() => goToCardIndex(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-zinc-500">
                            {index + 1}
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              card.mastery >= 80
                                ? "bg-green-500"
                                : card.mastery >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          />
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                              Question
                            </span>
                            <p className="text-gray-900 dark:text-zinc-100 font-medium">
                              {card.front}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                              Answer
                            </span>
                            <p className="text-gray-700 dark:text-zinc-300">{card.back}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            card.difficulty === "easy"
                              ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                              : card.difficulty === "medium"
                              ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
                              : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {card.difficulty}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-zinc-500">
                          {card.mastery}% mastery
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </StudySessionShell>
      </>
    );
  }

  const shellWrapper = (
    content: ReactNode,
    options?: {
      pageHeader?: {
        title: string;
        description?: string;
        onBack: () => void;
      };
    }
  ) => (
    <>
      <OfflineIndicator />
      <StudyShell
        folders={folders}
        uncategorizedCount={uncategorizedCount}
        libraryFilter={filter}
        onLibraryFilter={handleLibraryFilter}
        onNewFolder={() => setShowNewFolderModal(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateSet={() => goCreateSet(folderId)}
        sidebarOpen={sidebarOpen}
        onSidebarOpen={() => setSidebarOpen(true)}
        onSidebarClose={() => setSidebarOpen(false)}
        pageHeader={options?.pageHeader}
      >
        {content}
      </StudyShell>
      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        onCreate={handleCreateFolder}
      />
    </>
  );

  if (isStudyFolder) {
    const isUncategorized = folderId === UNCATEGORIZED_FOLDER_ID;
    const folderMissing =
      !isUncategorized && folderId && !activeFolder && folders.length >= 0;

    return shellWrapper(
      folderMissing ? (
        <p className="text-gray-600">Folder not found.</p>
      ) : (
        <StudyFolderView
          folder={activeFolder}
          isUncategorized={isUncategorized}
          sets={folderPageSets}
          onStartSet={(set) => startStudySession(set)}
          onCreateInFolder={() => goCreateSet(folderId)}
        />
      )
    );
  }

  if (isStudyLibrary) {
    return shellWrapper(
      <StudyLibraryView
        filter={filter}
        sets={libraryPageSets}
        onStartSet={(set) => startStudySession(set)}
      />
    );
  }

  if (isStudyPerformance) {
    const resolveSetTitle = (studySetId: string) =>
      studySets.find((s) => s.id === studySetId)?.title ?? "Study set";

    return shellWrapper(
      <StudyPerformanceView
        userStats={userStats}
        resolveSetTitle={resolveSetTitle}
      />,
      {
        pageHeader: {
          title: "Performance",
          description:
            "Study time, streaks, and how consistently you show up.",
          onBack: () => navigate("/study"),
        },
      }
    );
  }

  const hubEmptyState = () => (
    <div className="flex w-full flex-1 flex-col items-center justify-center text-center px-4 min-h-[min(24rem,calc(100dvh-14rem))]">
      <BookOpenIcon className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">
        {searchQuery.trim()
          ? "No sets match your search"
          : "No study sets found"}
      </h3>
      <p className="text-gray-600 dark:text-zinc-400 mb-6 max-w-sm">
        {searchQuery.trim()
          ? "Try a different title, category, or description."
          : filter === "my"
          ? "You haven't created any study sets yet."
          : filter === "public"
          ? "No public study sets available."
          : filter === "borrowed"
          ? "You haven't borrowed any study sets yet."
          : "Create your first set to start studying."}
      </p>
      {!searchQuery.trim() && (
        <button
          type="button"
          onClick={() => goCreateSet()}
          className="study-btn inline-flex items-center gap-2 px-6 py-3 font-semibold"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Your First Set</span>
        </button>
      )}
    </div>
  );

  return shellWrapper(
    <>
    <div className="flex w-full flex-col flex-1 min-h-0">
        <StudyHubQuickActions
          onCreateSet={() => goCreateSet()}
          onAddPublicSet={() => setShowImportPublicModal(true)}
        />

        {jumpBackSet && (
          <StudyHubJumpBack
            set={jumpBackSet}
            onContinue={() => startStudySession(jumpBackSet)}
          />
        )}

        <StudyHubRecents
          sets={recentSets}
          onOpenSet={(set) => startStudySession(set)}
        />

        <Link
          to="/study/performance"
          className="study-round flex items-center justify-between w-full max-w-4xl self-start mb-10 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 px-5 py-4 shadow-sm hover:border-sky-200 dark:hover:border-sky-800 transition-colors"
        >
          <div className="min-w-0 text-left">
            <StudySectionHeader
              title="Performance"
              description="Charts, streaks, heatmaps, and your full session history."
            />
            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-2">
              {userStats.currentStreak} day streak · {userStats.totalSessions}{" "}
              sessions · Level {userStats.level}
            </p>
          </div>
          <ChevronDownIcon className="h-5 w-5 shrink-0 text-gray-400 rotate-[-90deg]" aria-hidden />
        </Link>

        <section className="w-full flex flex-col flex-1 min-h-0 pb-20">
          {displayedStudySets.length > 0 && (
            <>
          <StudySectionHeader
            className="mb-4 max-w-4xl w-full self-start min-w-0"
            title={
              searchQuery.trim()
                ? `Results (${displayedStudySets.length})`
                : "Your study sets"
            }
            description={
              searchQuery.trim()
                ? "Sets that match your search across title, description, and category."
                : "Sets you created or imported—open a card to study with flashcards or quiz."
            }
          />
          <div className="grid gap-4 max-w-4xl w-full self-start min-w-0 [grid-template-columns:repeat(auto-fill,minmax(min(100%,17.5rem),1fr))]">
            {displayedStudySets.map((set) => {
              const avgMastery =
                set.flashcards.length > 0
                  ? Math.round(
                      set.flashcards.reduce(
                        (acc, card) => acc + card.mastery,
                        0
                      ) / set.flashcards.length
                    )
                  : 0;

              return (
              <div
                key={set.id}
                className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 overflow-hidden h-full flex flex-col"
              >
                <div className="p-4 flex flex-col flex-1 min-h-0">
                  <div className="flex-1 min-h-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="inline-block px-2 py-0.5 bg-sky-50 text-sky-800 rounded-full text-xs font-medium">
                        {displayStudySetCategory(set)}
                      </span>
                      {set.isBorrowed ? (
                        <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-800 rounded-full text-xs font-medium">
                          Borrowed
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-gray-500">
                      {set.isPublic ? (
                        <EyeIcon className="h-4 w-4 text-green-600" title="Public" />
                      ) : (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" title="Private" />
                      )}
                      <span className="text-xs whitespace-nowrap">
                        {set.cardCount} cards
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-1 line-clamp-2 min-h-[2.75rem]">
                    {set.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2 min-h-[2.5rem]">
                    {set.description?.trim() ? set.description : "\u00a0"}
                  </p>
                  </div>

                  <div className="shrink-0 pt-3 space-y-2">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 min-h-[1.125rem]">
                    {set.lastStudied
                      ? `Last studied ${set.lastStudied.toLocaleDateString()}`
                      : null}
                  </p>

                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-zinc-400 mb-1">
                      <span>Mastery</span>
                      <span className="font-medium">{avgMastery}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
                      <div
                        className="bg-[#16aeac] h-1.5 rounded-full"
                        style={{ width: `${avgMastery}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startStudySession(set)}
                      disabled={set.flashcards.length === 0}
                      className="study-btn inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <PlayIcon className="h-4 w-4 shrink-0" />
                      Study
                    </button>

                    {set.createdBy === memoizedUser?.uid ? (
                      <div className="flex items-center gap-0.5 ml-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/edit/${set.id}`)}
                          className="p-1.5 text-gray-500 hover:text-[#16aeac] rounded-md hover:bg-gray-50 transition-colors"
                          title="Edit set"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {!set.isPublic ? (
                          <button
                            type="button"
                            onClick={() => sharePrivateSet(set)}
                            className="p-1.5 text-gray-500 hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            title="Share private set (code and password)"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => deleteStudySet(set.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-gray-50 transition-colors"
                          title="Delete set"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
            </>
          )}

          {displayedStudySets.length === 0 && hubEmptyState()}
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <StudyCategorySelect
                    value={newSetForm.categoryId}
                    onChange={(categoryId) =>
                      setNewSetForm({ ...newSetForm, categoryId })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                {/* Public/Private Toggle */}
                <div className="flex items-center p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800">
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
                    className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-950"
                  />
                  <label
                    htmlFor="isPublic"
                    className="ml-3 block text-sm"
                  >
                    <span className="font-semibold text-gray-900 dark:text-zinc-100">Make this set public</span>
                    <span className="block text-gray-500 dark:text-zinc-400 mt-1">
                      Listed for others to find—no import code. Private sets use
                      a code and password to share.
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
                <div className="flex items-center p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800">
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
                    className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-950"
                  />
                  <label
                    htmlFor="cardIsPublic"
                    className="ml-3 block text-sm"
                  >
                    <span className="font-semibold text-gray-900 dark:text-zinc-100">Make this card public</span>
                    <span className="block text-gray-500 dark:text-zinc-400 mt-1">
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

      {showMakePublicModal && publicSetCredentials && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-xl p-8 w-full max-w-md">
            <div className="text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-4">
                Private share link
              </h2>
              <p className="text-gray-600 dark:text-zinc-400 mb-6">
                This set stays private. Share the code and password so others
                can import a copy.
              </p>

              <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-4 mb-6 text-left">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                    Share code
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
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

      {showImportPublicModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="study-round bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                Import private set
              </h2>
              <button
                type="button"
                onClick={() => setShowImportPublicModal(false)}
                className="p-2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all duration-200"
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                    Share code
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-500 transition-all duration-200 font-mono text-center"
                    placeholder="Enter 6-character code"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-zinc-500 transition-all duration-200 font-mono text-center"
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
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-xl hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 dark:hover:bg-purple-500 transition-colors font-semibold"
                >
                  Import Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
};

export default Study;
