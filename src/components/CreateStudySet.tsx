import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import StudyShell from "./study/StudyShell";
import StudySectionHeader from "./study/StudySectionHeader";
import NewFolderModal from "./study/NewFolderModal";
import StudyCategorySelect from "./study/StudyCategorySelect";
import {
  DEFAULT_STUDY_CATEGORY_ID,
  getStudyCategoryLabel,
  resolveStudyCategoryId,
  studyCategoryFirestoreFields,
} from "../constants/studyCategories";
import { useStudyFolders } from "../hooks/useStudyFolders";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  issuePrivateShareCredentials,
  markStudySetPublic,
} from "../utils/studyPublicSet";
import {
  clearStudySetDraft,
  loadStudySetDraft,
  migrateLegacyCookieDraftToLocalStorage,
  saveStudySetDraft,
  type StudySetDraftStudySet,
} from "../utils/studySetDraftStorage";

interface Flashcard {
  id?: string;
  front: string;
  back: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
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
  categoryId: string;
  folderId?: string | null;
  isPublic: boolean;
  shareCode?: string;
  sharePassword?: string;
  createdBy?: string;
  createdAt?: Date;
  lastStudied?: Date;
  cardCount: number;
  flashcards: Flashcard[];
}

const DRAFT_SAVE_MS = 400;
const CREATE_FOLDER_SELECT_VALUE = "__create_folder__";

export default function CreateStudySet() {
  const navigate = useNavigate();
  const { studySetId } = useParams();
  const [searchParams] = useSearchParams();
  const initialFolderId = searchParams.get("folder");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(
    initialFolderId || null
  );
  const { folders, createFolder, touchFolder } = useStudyFolders(user?.uid);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editLoadComplete, setEditLoadComplete] = useState(false);
  const createDraftHydrated = useRef(false);

  // Study set form
  const [studySet, setStudySet] = useState<StudySet>({
    title: "",
    description: "",
    categoryId: DEFAULT_STUDY_CATEGORY_ID,
    isPublic: false,
    cardCount: 0,
    flashcards: [],
  });

  // Current flashcard being edited
  const [currentCard, setCurrentCard] = useState<Flashcard>({
    front: "",
    back: "",
    category: "",
    difficulty: "medium",
    mastery: 0,
    isPublic: false,
  });

  // Public set credentials
  const [publicCredentials, setPublicCredentials] = useState<{
    code: string;
    password: string;
  } | null>(null);

  const draftScope = (): "new" | string =>
    isEditMode && studySet.id ? studySet.id : studySetId ?? "new";

  const clearLocalDraft = () => {
    if (!user) return;
    clearStudySetDraft(user.uid, draftScope());
    setHasUnsavedChanges(false);
  };

  const normalizeDraftStudySet = (raw: StudySetDraftStudySet): StudySet => {
    const categoryId = resolveStudyCategoryId({
      categoryId: raw.categoryId,
      category: raw.category,
    });
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      categoryId,
      folderId: raw.folderId,
      isPublic: raw.isPublic,
      shareCode: raw.shareCode,
      sharePassword: raw.sharePassword,
      createdBy: raw.createdBy,
      createdAt: raw.createdAt,
      lastStudied: raw.lastStudied,
      cardCount: raw.cardCount,
      flashcards: raw.flashcards as Flashcard[],
    };
  };

  const applyDraftSnapshot = (
    snapshot: ReturnType<typeof loadStudySetDraft>
  ) => {
    if (!snapshot) return;
    setStudySet(normalizeDraftStudySet(snapshot.studySet));
    setFolderId(snapshot.folderId);
    setCurrentCard(snapshot.currentCard as Flashcard);
    setHasUnsavedChanges(true);
  };

  // Load study set data for editing
  const loadStudySetForEditing = async (setId: string) => {
    try {
      const setDoc = await getDoc(doc(db, "studySets", setId));
      if (setDoc.exists()) {
        const setData = setDoc.data();

        // Load flashcards
        const flashcardsSnapshot = await getDocs(
          collection(db, "studySets", setId, "flashcards")
        );
        const flashcards = flashcardsSnapshot.docs.map((cardDoc) => ({
          id: cardDoc.id,
          ...cardDoc.data(),
          createdAt: cardDoc.data().createdAt?.toDate() || new Date(),
          lastReviewed: cardDoc.data().lastReviewed?.toDate(),
        })) as Flashcard[];

        setFolderId(setData.folderId ?? null);

        const loadedSet: StudySet = {
          id: setId,
          title: setData.title,
          description: setData.description,
          categoryId: resolveStudyCategoryId(setData),
          folderId: setData.folderId ?? null,
          isPublic: setData.isPublic,
          shareCode: setData.shareCode ?? setData.publicCode,
          sharePassword: setData.sharePassword ?? setData.publicPassword,
          createdBy: setData.createdBy,
          createdAt: setData.createdAt?.toDate() || new Date(),
          lastStudied: setData.lastStudied?.toDate(),
          cardCount: flashcards.length,
          flashcards: flashcards,
        };

        // Set public credentials if the set is public
        const shareCode = setData.shareCode ?? setData.publicCode;
        const sharePassword = setData.sharePassword ?? setData.publicPassword;
        if (!setData.isPublic && shareCode && sharePassword) {
          setPublicCredentials({
            code: shareCode,
            password: sharePassword,
          });
        }

        const localDraft =
          user && setId ? loadStudySetDraft(user.uid, setId) : null;
        if (localDraft) {
          setStudySet(localDraft.studySet as StudySet);
          setFolderId(localDraft.folderId);
          setCurrentCard(localDraft.currentCard as Flashcard);
          setHasUnsavedChanges(true);
        } else {
          setStudySet(loadedSet);
        }
        setIsEditMode(true);
      } else {
        navigate("/study");
      }
      setEditLoadComplete(true);
    } catch (error) {
      console.error("Error loading study set for editing:", error);
      setEditLoadComplete(true);
    }
  };

  useEffect(() => {
    if (!user || studySetId || createDraftHydrated.current) return;
    createDraftHydrated.current = true;
    const snapshot =
      loadStudySetDraft(user.uid, "new") ??
      migrateLegacyCookieDraftToLocalStorage(user.uid);
    applyDraftSnapshot(snapshot);
  }, [user, studySetId]);

  useEffect(() => {
    if (!user) return;
    const canPersist =
      (!studySetId && createDraftHydrated.current) ||
      (studySetId && editLoadComplete);
    if (!canPersist) return;

    const scope = draftScope();
    const hasContent =
      studySet.title.trim() ||
      studySet.description.trim() ||
      studySet.flashcards.length > 0 ||
      currentCard.front.trim() ||
      currentCard.back.trim() ||
      folderId;

    if (!hasContent && scope === "new") return;

    const timer = window.setTimeout(() => {
      saveStudySetDraft(user.uid, scope, {
        studySet: { ...studySet, folderId },
        folderId,
        currentCard,
      });
      setHasUnsavedChanges(true);
    }, DRAFT_SAVE_MS);

    return () => window.clearTimeout(timer);
  }, [
    user,
    studySet,
    folderId,
    currentCard,
    studySetId,
    editLoadComplete,
    isEditMode,
    studySet.id,
  ]);

  // Load study set for editing if studySetId is provided
  useEffect(() => {
    if (studySetId && user) {
      loadStudySetForEditing(studySetId);
    }
  }, [studySetId, user]);

  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Authentication effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowExitModal(true);
    } else {
      navigate("/study");
    }
  };

  const confirmExit = () => {
    navigate("/study");
  };

  const handleCreateFolder = async (title: string, description: string) => {
    const id = await createFolder(title, description);
    if (id) setFolderId(id);
  };

  const addCard = () => {
    if (currentCard.front.trim() && currentCard.back.trim()) {
      setStudySet((prev) => ({
        ...prev,
        flashcards: [
          ...prev.flashcards,
          { ...currentCard, id: `temp_${Date.now()}` },
        ],
        cardCount: prev.cardCount + 1,
      }));
      setCurrentCard({
        front: "",
        back: "",
        category: "",
        difficulty: "medium",
        mastery: 0,
        isPublic: false,
      });
    }
  };

  const removeCard = (cardId: string) => {
    setStudySet((prev) => ({
      ...prev,
      flashcards: prev.flashcards.filter((card) => card.id !== cardId),
      cardCount: prev.cardCount - 1,
    }));
  };

  const createPrivateShareLink = async () => {
    if (!user || !studySet.id || studySet.isPublic) return;

    try {
      const { shareCode, sharePassword } = await issuePrivateShareCredentials(
        studySet.id,
        {
          title: studySet.title,
          description: studySet.description,
          category: getStudyCategoryLabel(studySet.categoryId),
          cardCount: studySet.flashcards.length,
          createdBy: user.uid,
        }
      );
      setPublicCredentials({ code: shareCode, password: sharePassword });
      setStudySet((prev) => ({
        ...prev,
        isPublic: false,
        shareCode,
        sharePassword,
      }));
    } catch (error) {
      console.error("Error creating share link:", error);
      alert("Could not create a share link. Try again.");
    }
  };

  const createStudySet = async () => {
    if (!user || !studySet.title.trim()) return;

    try {
      if (isEditMode && studySet.id) {
        const setId = studySet.id;

        // Update existing study set details
        await updateDoc(doc(db, "studySets", setId), {
          title: studySet.title,
          description: studySet.description,
          ...studyCategoryFirestoreFields(studySet.categoryId),
          folderId: folderId || null,
          isPublic: studySet.isPublic,
        });
        if (studySet.isPublic) {
          await markStudySetPublic(setId);
        }
        if (folderId) await touchFolder(folderId);

        // Get existing flashcards to compare
        await getDocs(
          collection(db, "studySets", setId, "flashcards")
        );

        // Add new flashcards (those without Firebase IDs)
        const newFlashcards = studySet.flashcards.filter(
          (card) => !card.id || card.id.startsWith("temp_")
        );
        const addPromises = newFlashcards.map((card) =>
          addDoc(collection(db, "studySets", setId, "flashcards"), {
            front: card.front,
            back: card.back,
            category: card.category,
            difficulty: card.difficulty,
            mastery: card.mastery || 0,
            createdBy: user.uid,
            isPublic: card.isPublic,
            createdAt: serverTimestamp(),
            lastReviewed: card.lastReviewed || null,
          })
        );

        await Promise.all(addPromises);

        clearLocalDraft();

        navigate(
          folderId ? `/study/folder/${folderId}` : "/study"
        );
      } else {
        const docRef = await addDoc(collection(db, "studySets"), {
          title: studySet.title,
          description: studySet.description,
          ...studyCategoryFirestoreFields(studySet.categoryId),
          folderId: folderId || null,
          isPublic: studySet.isPublic,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          lastStudied: null,
        });
        if (folderId) await touchFolder(folderId);

        // Add all flashcards to the study set
        const flashcardPromises = studySet.flashcards.map((card) =>
          addDoc(collection(db, "studySets", docRef.id, "flashcards"), {
            front: card.front,
            back: card.back,
            category: card.category,
            difficulty: card.difficulty,
            mastery: 0,
            createdBy: user.uid,
            isPublic: card.isPublic,
            createdAt: serverTimestamp(),
            lastReviewed: null,
          })
        );

        await Promise.all(flashcardPromises);

        if (studySet.isPublic) {
          await markStudySetPublic(docRef.id);
        }

        clearLocalDraft();

        navigate(
          folderId ? `/study/folder/${folderId}` : "/study"
        );
      }
    } catch (error) {
      console.error("Error saving study set:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const saveDisabled =
    !studySet.title.trim() ||
    (!isEditMode && studySet.flashcards.length === 0);

  return (
    <StudyShell
      folders={folders}
      uncategorizedCount={0}
      libraryFilter="all"
      onLibraryFilter={() => navigate("/study/library")}
      onNewFolder={() => setShowNewFolderModal(true)}
      searchQuery=""
      onSearchChange={() => {}}
      onCreateSet={() => {}}
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      pageHeader={{
        title: isEditMode ? "Edit Study Set" : "Create Study Set",
        description: isEditMode
          ? "Modify your flashcards and settings"
          : "Build your flashcards and share knowledge",
        onBack: handleBackClick,
      }}
    >
        <div className="w-full">
          {hasUnsavedChanges && (
            <p className="text-sm text-green-600 dark:text-green-500 mb-6 max-w-4xl">
              Saved on this device. Click Done to save to your account.
            </p>
          )}

          <div className="flex flex-col gap-8 w-full">
            <div className="w-full">
                <StudySectionHeader
                  size="large"
                  className="mb-4"
                  title="Study Set Details"
                  description="Title, description, folder, and sharing settings for this set."
                />

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={studySet.title}
                      onChange={(e) =>
                        setStudySet({ ...studySet, title: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-500 transition-all duration-200"
                      placeholder="Enter study set title..."
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={studySet.description}
                      onChange={(e) =>
                        setStudySet({
                          ...studySet,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-500 transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="Describe what this study set covers..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                        Subject
                      </label>
                      <StudyCategorySelect
                        value={studySet.categoryId}
                        onChange={(categoryId) =>
                          setStudySet({ ...studySet, categoryId })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                        Folder
                      </label>
                      <select
                        value={folderId ?? ""}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next === CREATE_FOLDER_SELECT_VALUE) {
                            setShowNewFolderModal(true);
                            return;
                          }
                          setFolderId(next || null);
                        }}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-zinc-100"
                      >
                        <option value="">Uncategorized</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.title}
                          </option>
                        ))}
                        <option value={CREATE_FOLDER_SELECT_VALUE}>
                          + Create new folder…
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={studySet.isPublic}
                        onChange={(e) =>
                          setStudySet({ ...studySet, isPublic: e.target.checked })
                        }
                        className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-950 disabled:opacity-50"
                      />
                      <label
                        htmlFor="isPublic"
                        className="ml-3 block text-sm"
                      >
                        <span className="font-semibold text-gray-900 dark:text-zinc-100">
                          Make this set public
                        </span>
                        <span className="block text-gray-500 dark:text-zinc-400 mt-1">
                          Public sets are discoverable without a code. Private
                          sets use a code and password to share.
                        </span>
                      </label>
                    </div>

                    {!studySet.isPublic && isEditMode && studySet.id && (
                      <button
                        type="button"
                        onClick={() => void createPrivateShareLink()}
                        className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-semibold"
                      >
                        {publicCredentials?.code
                          ? "Regenerate share code"
                          : "Create share code and password"}
                      </button>
                    )}

                    {!studySet.isPublic && publicCredentials && (
                      <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-violet-900 dark:text-violet-200 mb-3">
                          Private share credentials
                        </h3>
                        <p className="text-sm text-violet-800 dark:text-violet-300/90 mb-4">
                          Share these with people you want to import this private
                          set:
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-semibold text-green-700 mb-2">
                              Public Code
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={publicCredentials?.code || "Generate code..."}
                                readOnly
                                className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg font-mono text-lg text-center text-green-800"
                              />
                              {publicCredentials?.code && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(publicCredentials.code)}
                                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Copy
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-green-700 mb-2">
                              Password
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={publicCredentials?.password || "Generate password..."}
                                readOnly
                                className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg font-mono text-lg text-center text-green-800"
                              />
                              {publicCredentials?.password && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(publicCredentials.password)}
                                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Copy
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            </div>

            <div className="w-full">
                <StudySectionHeader
                  size="large"
                  className="mb-4"
                  title="Add Cards"
                  description="Enter a term and definition for each flashcard in this set."
                />

                {/* Current Card Form */}
                <div className="bg-gray-50 dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-700 dark:text-zinc-300">
                      New Card
                    </span>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-zinc-400 hover:bg-gray-200 rounded-lg transition-all duration-200">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8h16M4 16h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Term Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                        TERM
                      </label>
                      <textarea
                        value={currentCard.front}
                        onChange={(e) =>
                          setCurrentCard({
                            ...currentCard,
                            front: e.target.value,
                          })
                        }
                        className="w-full px-4 py-4 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-500 transition-all duration-200 resize-none"
                        rows={4}
                        placeholder="Enter your question here..."
                      />
                    </div>

                    {/* Definition Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                        DEFINITION
                      </label>
                      <textarea
                        value={currentCard.back}
                        onChange={(e) =>
                          setCurrentCard({
                            ...currentCard,
                            back: e.target.value,
                          })
                        }
                        className="w-full px-4 py-4 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-500 transition-all duration-200 resize-none"
                        rows={4}
                        placeholder="Enter the answer here..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <button
                    type="button"
                    onClick={addCard}
                    disabled={
                      !currentCard.front.trim() || !currentCard.back.trim()
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-zinc-600 text-gray-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:border-study-accent hover:text-study-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                    Add a card
                  </button>
                  <button
                    type="button"
                    onClick={createStudySet}
                    disabled={saveDisabled}
                    className="shrink-0 px-5 py-2.5 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Done
                  </button>
                </div>

              {studySet.flashcards.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <StudySectionHeader
                    as="h3"
                    className="mb-4"
                    title={`Added Cards (${studySet.flashcards.length})`}
                    description="Review or remove cards before you save the set."
                  />

                  <div className="space-y-3">
                    {studySet.flashcards.map((card, index) => (
                      <div
                        key={card.id}
                        className="bg-gray-50 dark:bg-zinc-950/80 border border-gray-200 dark:border-zinc-800 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                            Card {index + 1}
                          </span>
                          <button
                            onClick={() => removeCard(card.id!)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-zinc-300">
                              Term:
                            </span>
                            <p className="text-gray-600 dark:text-zinc-400 mt-1">{card.front}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-zinc-300">
                              Definition:
                            </span>
                            <p className="text-gray-600 dark:text-zinc-400 mt-1">{card.back}</p>
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

      {/* Exit Confirmation Modal */}
      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        onCreate={handleCreateFolder}
      />

      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-4">
                Unsaved Changes
              </h3>
              <p className="text-gray-600 dark:text-zinc-400 mb-6">
                Your work is saved on this device, but it is not in your account
                until you click Done. Leave anyway?
              </p>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
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
    </StudyShell>
  );
}
