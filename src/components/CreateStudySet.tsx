import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import Cookies from "js-cookie";

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
  category: string;
  isPublic: boolean;
  publicCode?: string;
  publicPassword?: string;
  createdBy?: string;
  createdAt?: Date;
  lastStudied?: Date;
  cardCount: number;
  flashcards: Flashcard[];
}

const COOKIE_KEY = "study_set_draft";

export default function CreateStudySet() {
  const navigate = useNavigate();
  const { studySetId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Study set form
  const [studySet, setStudySet] = useState<StudySet>({
    title: "",
    description: "",
    category: "",
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

  // Cookie management functions
  const saveToCookies = (data: StudySet) => {
    try {
      Cookies.set(COOKIE_KEY, JSON.stringify(data), { expires: 7 }); // 7 days
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Error saving to cookies:", error);
    }
  };

  // Utility functions for public sets
  const generatePublicCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generatePublicPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
      console.error("Error loading from cookies:", error);
    }
    return null;
  };

  const clearCookies = () => {
    try {
      Cookies.remove(COOKIE_KEY);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error clearing cookies:", error);
    }
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

        const loadedSet: StudySet = {
          id: setId,
          title: setData.title,
          description: setData.description,
          category: setData.category,
          isPublic: setData.isPublic,
          publicCode: setData.publicCode,
          publicPassword: setData.publicPassword,
          createdBy: setData.createdBy,
          createdAt: setData.createdAt?.toDate() || new Date(),
          lastStudied: setData.lastStudied?.toDate(),
          cardCount: flashcards.length,
          flashcards: flashcards,
        };

        // Set public credentials if the set is public
        if (setData.isPublic && setData.publicCode && setData.publicPassword) {
          setPublicCredentials({
            code: setData.publicCode,
            password: setData.publicPassword,
          });
        }

        setStudySet(loadedSet);
        setIsEditMode(true);
      }
    } catch (error) {
      console.error("Error loading study set for editing:", error);
    }
  };

  // Auto-save effect (only for create mode)
  useEffect(() => {
    if (
      !isEditMode &&
      (studySet.title ||
        studySet.description ||
        studySet.category ||
        studySet.flashcards.length > 0)
    ) {
      saveToCookies(studySet);
    }
  }, [studySet, isEditMode]);

  // Load data from cookies on mount (only for create mode)
  useEffect(() => {
    if (!isEditMode) {
      const savedData = loadFromCookies();
      if (savedData) {
        setStudySet(savedData);
      }
    }
  }, [isEditMode]);

  // Load study set for editing if studySetId is provided
  useEffect(() => {
    if (studySetId && user) {
      loadStudySetForEditing(studySetId);
    }
  }, [studySetId, user]);

  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isEditMode) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isEditMode]);

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
    if (hasUnsavedChanges && !isEditMode) {
      setShowExitModal(true);
    } else {
      navigate("/study");
    }
  };

  const confirmExit = () => {
    clearCookies();
    navigate("/study");
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

  const makeSetPublic = async () => {
    if (!user) return;

    try {
      const publicCode = generatePublicCode();
      const publicPassword = generatePublicPassword();

      // Update the study set to be public
      if (studySet.id) {
        await updateDoc(doc(db, "studySets", studySet.id), {
          isPublic: true,
          publicCode,
          publicPassword,
        });
      }

      // Store in publicSets collection for easy lookup
      await setDoc(doc(db, "publicSets", publicCode), {
        originalSetId: studySet.id,
        publicCode,
        publicPassword,
        createdBy: user.uid,
        title: studySet.title,
        description: studySet.description,
        category: studySet.category,
        cardCount: studySet.flashcards.length,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      setPublicCredentials({ code: publicCode, password: publicPassword });
      setStudySet(prev => ({ ...prev, isPublic: true }));
      
      alert("Study set made public successfully!");
    } catch (error) {
      console.error("Error making set public:", error);
      alert("Error making set public. Please try again.");
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
          category: studySet.category,
          isPublic: studySet.isPublic,
        });

        // Get existing flashcards to compare
        const existingFlashcardsSnapshot = await getDocs(
          collection(db, "studySets", setId, "flashcards")
        );
        const existingFlashcardIds = existingFlashcardsSnapshot.docs.map(
          (doc) => doc.id
        );
        const currentFlashcardIds = studySet.flashcards
          .map((card) => card.id)
          .filter((id) => id && !id.startsWith("temp_"));

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

        // Navigate back to study page
        navigate("/study");
      } else {
        // Create new study set
        const docRef = await addDoc(collection(db, "studySets"), {
          title: studySet.title,
          description: studySet.description,
          category: studySet.category,
          isPublic: studySet.isPublic,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          lastStudied: null,
        });

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

        // Clear cookies after successful save
        clearCookies();

        // Navigate to the study set page
        navigate(`/study/${docRef.id}`);
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditMode ? "Edit Study Set" : "Create Study Set"}
                </h1>
                <p className="text-gray-600">
                  {isEditMode
                    ? "Modify your flashcards and settings"
                    : "Build your flashcards and share knowledge"}
                </p>
                {hasUnsavedChanges && !isEditMode && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Auto-saved progress
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Study Set Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Study Set Details
                </h2>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={studySet.title}
                      onChange={(e) =>
                        setStudySet({ ...studySet, title: e.target.value })
                      }
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
                      onChange={(e) =>
                        setStudySet({
                          ...studySet,
                          description: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setStudySet({ ...studySet, category: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder="e.g., Programming, Math, History..."
                    />
                  </div>

                  {/* Visibility */}
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={studySet.isPublic}
                        onChange={(e) =>
                          setStudySet({ ...studySet, isPublic: e.target.checked })
                        }
                        className="h-5 w-5 text-green-500 focus:ring-green-500 border-gray-300 rounded bg-white"
                      />
                      <label
                        htmlFor="isPublic"
                        className="ml-3 block text-sm text-gray-700"
                      >
                        <span className="font-semibold">
                          Make this set public
                        </span>
                        <span className="block text-gray-500 mt-1">
                          Other users can discover and use this study set
                        </span>
                      </label>
                    </div>

                    {/* Make Public Button */}
                    {!studySet.isPublic && studySet.id && (
                      <button
                        onClick={makeSetPublic}
                        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                      >
                        Make This Set Public
                      </button>
                    )}

                    {/* Public Credentials Display */}
                    {(studySet.isPublic || publicCredentials) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-green-800 mb-3">
                          Public Set Credentials
                        </h3>
                        <p className="text-sm text-green-700 mb-4">
                          Share these credentials with others to let them import your study set:
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

              {/* Create Button */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <button
                  onClick={createStudySet}
                  disabled={
                    !studySet.title.trim() ||
                    (!isEditMode && studySet.flashcards.length === 0)
                  }
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg shadow-green-500/25"
                >
                  {isEditMode
                    ? "Save Changes"
                    : `Create Study Set (${studySet.flashcards.length} cards)`}
                </button>
              </div>
            </div>

            {/* Right Column - Add Cards */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Add Cards
                </h2>

                {/* Current Card Form */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-700">
                      New Card
                    </span>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200">
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                        className="w-full px-4 py-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
                        rows={4}
                        placeholder="Enter your question here..."
                      />
                    </div>

                    {/* Definition Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    disabled={
                      !currentCard.front.trim() || !currentCard.back.trim()
                    }
                    className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold border border-gray-700"
                  >
                    Add a card.
                  </button>
                </div>
              </div>

              {/* Added Cards List */}
              {studySet.flashcards.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Added Cards ({studySet.flashcards.length})
                  </h3>

                  <div className="space-y-3">
                    {studySet.flashcards.map((card, index) => (
                      <div
                        key={card.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">
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
                            <span className="font-semibold text-gray-700">
                              Term:
                            </span>
                            <p className="text-gray-600 mt-1">{card.front}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">
                              Definition:
                            </span>
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Unsaved Changes
              </h3>
              <p className="text-gray-600 mb-6">
                You have {studySet.flashcards.length} card
                {studySet.flashcards.length !== 1 ? "s" : ""} that haven't been
                saved. Are you sure you want to leave without creating the study
                set?
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
