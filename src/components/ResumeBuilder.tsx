import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  PrinterIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ResumePDF from "./ResumePDF";
import { PDFDownloadLink } from "@react-pdf/renderer";
import AIResumeAssistant from "./AIResumeAssistant";
import type { ResumeData } from "../types/ResumeData";
import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  arrayUnion,
} from "firebase/firestore";
import SignInModal from "./SignInModal";
import bunny1 from "../bunny1.png";
import ResumePreview from "./ResumePreview";
// import TemplatesPage from "./TemplatesPage";

const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: "David St. Peter",
    title: "UX Designer",
    email: "david@example.com",
    phone: "+000 123 456 789",
    location: "New York, USA",
    photo: "https://ui-avatars.com/api/?name=David+St.+Peter&size=128",
  },
  profile:
    "For more Sales, Leads, Customer Engagement. Become an Author, Create Information Products. All done quickly and easily. No Design or Technical skills necessary",
  experience: [
    {
      title: "Senior UX Designer",
      company: "Company Name",
      startDate: "2020-01",
      endDate: "",
      description: [
        "Led the redesign of the company's flagship product, resulting in a 40% increase in user engagement",
      ],
    },
  ],
  education: [
    {
      degree: "Degree Name",
      school: "University name here",
      startDate: "2014",
      endDate: "2016",
    },
  ],
  websites: [
    {
      label: "Portfolio",
      url: "https://portfolio.com",
    },
  ],
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date;
};

const formatDateForState = (date: Date | null): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const ResumeBuilder = () => {
  // Consolidate related state into a single object
  const [uiState, setUiState] = useState({
    activeSection: "personal" as string | null,
    selectedTemplate: "modern",
    showTemplates: false,
    activeTopTab: "myResumes" as
      | "myResumes"
      | "templates"
      | "settings"
      | "help",
    showPasteModal: false,
    showSignInModal: false,
  });

  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [pastedResume, setPastedResume] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Add auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const lastSyncedAtRef = useRef<number>(0);

  // Lock body scroll when paste modal is open
  useEffect(() => {
    if (uiState.showPasteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [uiState.showPasteModal]);

  // Memoize resume templates
  const resumeTemplates = useMemo(
    () => [
      {
        id: "modern",
        name: "Modern Professional",
        description: "Clean and modern design with a focus on readability",
        preview: "/templates/modern.png",
      },
      {
        id: "executive",
        name: "Executive",
        description: "Traditional layout perfect for senior positions",
        preview: "/templates/executive.png",
      },
      {
        id: "minimal",
        name: "Minimal",
        description: "Simple and elegant design that lets your content shine",
        preview: "/templates/minimal.png",
      },
      {
        id: "creative",
        name: "Creative Professional",
        description: "Modern design with a creative touch",
        preview: "/templates/creative.png",
      },
    ],
    []
  );

  // Memoize handlers
  const handlePersonalInfoChange = useCallback(
    (field: keyof typeof resumeData.personalInfo, value: string) => {
      setResumeData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value,
        },
      }));
    },
    []
  );

  const handleProfileChange = useCallback((value: string) => {
    setResumeData((prev) => ({
      ...prev,
      profile: value,
    }));
  }, []);

  const handleExperienceChange = useCallback(
    (
      index: number,
      field: keyof (typeof resumeData.experience)[0],
      value: string | string[]
    ) => {
      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp, i) =>
          i === index ? { ...exp, [field]: value } : exp
        ),
      }));
    },
    []
  );

  const handleBulletPointChange = (
    expIndex: number,
    bulletIndex: number,
    value: string
  ) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) => {
        if (i !== expIndex) return exp;
        const newDescription = [...exp.description];
        newDescription[bulletIndex] = value;
        return { ...exp, description: newDescription };
      }),
    }));
  };

  const addBulletPoint = (expIndex: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) => {
        if (i !== expIndex) return exp;
        if (exp.description.length >= 5) return exp;
        return { ...exp, description: [...exp.description, ""] };
      }),
    }));
  };

  const removeBulletPoint = (expIndex: number, bulletIndex: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) => {
        if (i !== expIndex) return exp;
        const newDescription = exp.description.filter(
          (_, idx) => idx !== bulletIndex
        );
        return { ...exp, description: newDescription };
      }),
    }));
  };

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: "",
          company: "",
          startDate: "",
          endDate: "",
          description: [],
        },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const handleEducationChange = (
    index: number,
    field: keyof (typeof resumeData.education)[0],
    value: string
  ) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: "",
          school: "",
          startDate: "",
          endDate: "",
        },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const handleSuggestionSelect = (suggestion: string) => {
    console.log("Active Section:", uiState.activeSection);
    switch (uiState.activeSection) {
      case "personal":
        // Handle personal section suggestions
        break;
      case "summary":
      case "profile":
        setResumeData((prev) => ({
          ...prev,
          profile: suggestion,
        }));
        break;
      case "experience":
        if (resumeData.experience.length > 0) {
          setResumeData((prev) => ({
            ...prev,
            experience: prev.experience.map((exp, index) =>
              index === 0
                ? {
                    ...exp,
                    description: [...exp.description, suggestion],
                  }
                : exp
            ),
          }));
        }
        break;
      default:
        break;
    }
  };

  const handlePasteResume = () => {
    if (!user) {
      setUiState((prev) => ({ ...prev, showSignInModal: true }));
      return;
    }
    setUiState((prev) => ({ ...prev, showPasteModal: true }));
  };

  // On mount: seed user from localStorage for UI, then always subscribe to auth state
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {}
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
        // Store a minimal snapshot; don't persist the full Firebase user object
        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          })
        );
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("user");
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // On mount/update: prefer localStorage resume; only fetch after authReady and real Firebase user
  useEffect(() => {
    const storedResume = localStorage.getItem("resume");
    if (storedResume) {
      setResumeData(JSON.parse(storedResume));
      setLoading(false);
      return;
    }

    if (authReady && auth.currentUser) {
      setLoading(true);
      loadResumeData(auth.currentUser.uid).then((data) => {
        if (data) {
          setResumeData(data);
          localStorage.setItem("resume", JSON.stringify(data));
        }
        setLoading(false);
      });
    } else if (authReady && !auth.currentUser) {
      // Auth resolved and no user; stop loading
      setLoading(false);
    }
  }, [authReady, isAuthenticated]);

  // On save: push localStorage resume to Firebase
  const handleManualSave = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setUiState((prev) => ({ ...prev, showSignInModal: true }));
      // setPendingAction(() => handleManualSave);
      return;
    }
    setSaving(true);
    setSaveStatus(null);
    setFirestoreError(null);
    try {
      const resumeStr = localStorage.getItem("resume");
      if (!resumeStr) throw new Error("No resume data in localStorage");
      const resume = JSON.parse(resumeStr);
      // const token = await user.getIdToken(true);
      const resumeDataToSave = {
        ...resume,
        lastUpdated: new Date().toISOString(),
        userId: user.uid,
        updatedBy: user.uid,
      };
      // Always overwrite a single resume document keyed by user ID
      const resumeDocRef = doc(db, "resumes", user.uid);
      await setDoc(resumeDocRef, resumeDataToSave, { merge: true });
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
      // Update localStorage with latest
      localStorage.setItem("resume", JSON.stringify(resumeDataToSave));
    } catch (error) {
      let message = "Failed to save resume. Please try again.";
      if (error instanceof Error) message = error.message;
      setFirestoreError(message);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [user, isAuthenticated, currentResumeId]);

  // Auto-save resume changes to localStorage (debounced)
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem("resume", JSON.stringify(resumeData));
        setHasPendingSync(true);
      } catch {}
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [resumeData]);

  // Internal save to Firestore without UI prompts; throttled to avoid excess writes
  const syncLocalResumeToFirestore = useCallback(async () => {
    try {
      if (!isAuthenticated || !auth.currentUser) return;
      if (!navigator.onLine) return;
      if (!hasPendingSync) return;

      const now = Date.now();
      // Throttle: at most one write every 8s
      if (now - lastSyncedAtRef.current < 8000) return;

      const resumeStr = localStorage.getItem("resume");
      if (!resumeStr) return;
      const resume = JSON.parse(resumeStr);

      const resumeDataToSave = {
        ...resume,
        lastUpdated: new Date().toISOString(),
        userId: auth.currentUser.uid,
        updatedBy: auth.currentUser.uid,
      };

      if (currentResumeId) {
        const resumeDocRef = doc(db, "resumes", currentResumeId);
        await setDoc(resumeDocRef, resumeDataToSave, { merge: true });
      } else {
        const resumesCol = collection(db, "resumes");
        const docRef = await addDoc(resumesCol, resumeDataToSave);
        const resumeId = docRef.id;
        setCurrentResumeId(resumeId);
        // Best-effort link to user document; ignore permission errors
        try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, { resumeIds: arrayUnion(resumeId) });
        } catch {}
      }

      lastSyncedAtRef.current = now;
      setHasPendingSync(false);
    } catch (e) {
      // Keep pending flag so we retry on next safe event
    }
  }, [isAuthenticated, currentResumeId, hasPendingSync]);

  // Flush pending changes on safe lifecycle/network events
  useEffect(() => {
    const onBlur = () => syncLocalResumeToFirestore();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        syncLocalResumeToFirestore();
      }
    };
    const onOnline = () => syncLocalResumeToFirestore();

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      // Best-effort flush on unmount
      void syncLocalResumeToFirestore();
    };
  }, [syncLocalResumeToFirestore]);

  // Improve the load resume data function with auth handling
  const loadResumeData = useCallback(
    async (userId: string) => {
      if (!isAuthenticated) {
        setFirestoreError("Please sign in to load your resume");
        setUiState((prev) => ({ ...prev, showSignInModal: true }));
        return;
      }

      setLoading(true);
      setFirestoreError(null);

      try {
        // Ensure user is a Firebase User object
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          throw new Error("No authenticated user found");
        }
        // const token = await firebaseUser.getIdToken(true);

        // Ensure Firestore is initialized
        if (!db) {
          throw new Error("Firestore is not initialized");
        }

        const docRef = doc(db, "users", userId, "resume", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as ResumeData;
          // Validate the loaded data
          if (data && typeof data === "object") {
            return data;
          } else {
            throw new Error("Invalid resume data format");
          }
        }
      } catch (error: any) {
        console.error("[Firebase] Error loading resume:", error);
        if (error.code === "permission-denied") {
          setFirestoreError(
            "You don't have permission to load this resume. Using local data if available."
          );
          const cached = localStorage.getItem("resume");
          if (cached) {
            try {
              setResumeData(JSON.parse(cached));
            } catch {}
          }
        } else if (error.message === "Firestore is not initialized") {
          setFirestoreError(
            "Database connection error. Please try again later."
          );
        } else {
          setFirestoreError(error.message || "Failed to load resume data");
        }
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    const fetchAndLoadResume = async () => {
      // Skip if a cached resume exists
      const cached = localStorage.getItem("resume");
      if (cached) return;

      // Wait until auth is ready and we have a real Firebase user
      if (!authReady || !auth.currentUser) return;

      setLoading(true);
      try {
        // Load the single resume doc keyed by user ID
        const resumeRef = doc(db, "resumes", auth.currentUser.uid);
        const resumeSnap = await getDoc(resumeRef);
        if (resumeSnap.exists()) {
          setResumeData(resumeSnap.data() as ResumeData);
          localStorage.setItem("resume", JSON.stringify(resumeSnap.data()));
        }
      } catch (error) {
        setFirestoreError("Failed to load resume from resumes collection");
      } finally {
        setLoading(false);
      }
    };
    fetchAndLoadResume();
  }, [authReady]);

  const renderEditSection = useCallback(() => {
    switch (uiState.activeSection) {
      case "personal":
        // Debug log for job title and active section
        console.log(
          "Job Title:",
          resumeData.personalInfo.title,
          "Active Section:",
          uiState.activeSection
        );
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.fullName}
                  onChange={(e) =>
                    handlePersonalInfoChange("fullName", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.title}
                  onChange={(e) =>
                    handlePersonalInfoChange("title", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.email}
                  onChange={(e) =>
                    handlePersonalInfoChange("email", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) =>
                    handlePersonalInfoChange("phone", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.location}
                  onChange={(e) =>
                    handlePersonalInfoChange("location", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Professional Summary
            </h3>
            <textarea
              className="resume-textarea"
              value={resumeData.profile}
              onChange={(e) => handleProfileChange(e.target.value)}
              placeholder="Write a professional summary..."
            />
            <AIResumeAssistant
              profession={resumeData.personalInfo.title}
              onSuggestionSelect={handleSuggestionSelect}
              section="profile"
              onSuggestionsChange={() => {}}
            />
          </div>
        );

      case "experience":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Experience</h3>
              <button
                onClick={addExperience}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Experience</span>
              </button>
            </div>
            {resumeData.experience.map((exp: any, expIndex: number) => (
              <div
                key={expIndex}
                className="space-y-4 p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Job Title
                  </label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={exp.title}
                    onChange={(e) =>
                      handleExperienceChange(expIndex, "title", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={exp.company}
                    onChange={(e) =>
                      handleExperienceChange(
                        expIndex,
                        "company",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <div className="relative mt-1">
                      <DatePicker
                        selected={parseDate(exp.startDate)}
                        onChange={(date) =>
                          handleExperienceChange(
                            expIndex,
                            "startDate",
                            formatDateForState(date)
                          )
                        }
                        dateFormat="MMMM yyyy"
                        showMonthYearPicker
                        className="resume-input pl-3 pr-10 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholderText="Select start date"
                        showFourColumnMonthYearPicker
                        fixedHeight
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <div className="relative mt-1">
                      <DatePicker
                        selected={parseDate(exp.endDate)}
                        onChange={(date) =>
                          handleExperienceChange(
                            expIndex,
                            "endDate",
                            formatDateForState(date)
                          )
                        }
                        dateFormat="MMMM yyyy"
                        showMonthYearPicker
                        isClearable
                        className="resume-input pl-3 pr-10 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholderText="Present"
                        showFourColumnMonthYearPicker
                        fixedHeight
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Key Achievements
                    </label>
                    {exp.description.length < 5 && (
                      <button
                        onClick={() => addBulletPoint(expIndex)}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add bullet point</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {exp.description.map(
                      (bullet: string, bulletIndex: number) => (
                        <div
                          key={bulletIndex}
                          className="flex items-start space-x-2"
                        >
                          <span className="mt-2.5 text-gray-500">•</span>
                          <textarea
                            className="flex-1 resume-textarea mt-1"
                            value={bullet}
                            onChange={(e) =>
                              handleBulletPointChange(
                                expIndex,
                                bulletIndex,
                                e.target.value
                              )
                            }
                            placeholder="Describe your achievement..."
                            rows={2}
                          />
                          <button
                            onClick={() =>
                              removeBulletPoint(expIndex, bulletIndex)
                            }
                            className="mt-2 text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                  <div className="mt-2">
                    <AIResumeAssistant
                      profession={exp.title}
                      onSuggestionSelect={(suggestion) => {
                        handleExperienceChange(expIndex, "description", [
                          ...exp.description,
                          suggestion,
                        ]);
                      }}
                      disabled={!exp.title || exp.title.trim() === ""}
                      section="employment"
                    />
                    {!exp.title || exp.title.trim() === "" ? (
                      <div className="text-xs text-gray-400 mt-1">
                        Enter a job title to get AI suggestions.
                      </div>
                    ) : null}
                  </div>
                </div>
                <button
                  onClick={() => removeExperience(expIndex)}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
          </div>
        );

      case "education":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Education</h3>
              <button
                onClick={addEducation}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Education</span>
              </button>
            </div>
            {resumeData.education.map((edu: any, index: number) => (
              <div key={index} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Degree
                  </label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={edu.degree}
                    onChange={(e) =>
                      handleEducationChange(index, "degree", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    School
                  </label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={edu.school}
                    onChange={(e) =>
                      handleEducationChange(index, "school", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Year
                    </label>
                    <div className="relative mt-1">
                      <DatePicker
                        selected={parseDate(edu.startDate)}
                        onChange={(date) =>
                          handleEducationChange(
                            index,
                            "startDate",
                            formatDateForState(date)
                          )
                        }
                        dateFormat="yyyy"
                        showYearPicker
                        className="resume-input pl-3 pr-10 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholderText="Select start year"
                        showFourColumnMonthYearPicker
                        fixedHeight
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Year
                    </label>
                    <div className="relative mt-1">
                      <DatePicker
                        selected={parseDate(edu.endDate)}
                        onChange={(date) =>
                          handleEducationChange(
                            index,
                            "endDate",
                            formatDateForState(date)
                          )
                        }
                        dateFormat="yyyy"
                        showYearPicker
                        isClearable
                        className="resume-input pl-3 pr-10 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholderText="Present"
                        showFourColumnMonthYearPicker
                        fixedHeight
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeEducation(index)}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
          </div>
        );

      case "websites":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Websites & Social Links
              </h3>
              <button
                onClick={() => {
                  setResumeData((prev) => ({
                    ...prev,
                    websites: [
                      ...prev.websites,
                      {
                        label: "",
                        url: "",
                      },
                    ],
                  }));
                }}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Website</span>
              </button>
            </div>
            {resumeData.websites.map((website, index) => (
              <div key={index} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Label
                  </label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={website.label}
                    onChange={(e) => {
                      setResumeData((prev) => ({
                        ...prev,
                        websites: prev.websites.map((w, i) =>
                          i === index ? { ...w, label: e.target.value } : w
                        ),
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={website.url}
                    onChange={(e) => {
                      setResumeData((prev) => ({
                        ...prev,
                        websites: prev.websites.map((w, i) =>
                          i === index ? { ...w, url: e.target.value } : w
                        ),
                      }));
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    setResumeData((prev) => ({
                      ...prev,
                      websites: prev.websites.filter((_, i) => i !== index),
                    }));
                  }}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  }, [
    uiState.activeSection,
    resumeData,
    handlePersonalInfoChange,
    handleProfileChange,
    handleExperienceChange,
  ]);

  // Memoize the section title
  // const sectionTitle = useMemo(() => {
  //   switch (uiState.activeSection) {
  //     case "personal":
  //       return "Personal Information";
  //     case "profile":
  //       return "Professional Summary";
  //     case "experience":
  //       return "Work Experience";
  //     case "education":
  //       return "Education History";
  //     case "websites":
  //       return "Website Links";
  //     default:
  //       return "";
  //   }
  // }, [uiState.activeSection]);

  // Memoize the PDF document
  const pdfDocument = useMemo(
    () => (
      <ResumePDF resumeData={resumeData} template={uiState.selectedTemplate} />
    ),
    [resumeData, uiState.selectedTemplate]
  );

  // Add error display component
  const ErrorDisplay = useCallback(() => {
    if (!firestoreError) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
        <div className="flex items-center">
          <div className="py-1">
            <svg
              className="h-6 w-6 text-red-500 mr-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold">Error</p>
            <p className="text-sm">{firestoreError}</p>
          </div>
          <button
            onClick={() => setFirestoreError(null)}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }, [firestoreError]);

  // const navigate = useNavigate();

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen sticky z-[1000] backdrop-blur">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Back"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-gray-700"
                  >
                    <polyline points="15 6 9 12 15 18" />
                  </svg>
                </Link>
                <img
                  src={bunny1}
                  alt="ResumeAI Logo"
                  className="h-8 w-8 mr-2"
                />
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#16aeac] to-black bg-clip-text text-transparent mr-6">
                  Brightfolio
                </h1>
                <nav className="flex space-x-1 bg-transparent">
                  <button
                    className={`px-4 py-2 border border-gray-200 rounded-t-md bg-white text-gray-800 font-semibold ${
                      uiState.activeTopTab === "myResumes"
                        ? "border-b-0 font-bold"
                        : "opacity-70"
                    }`}
                    onClick={() =>
                      setUiState((prev) => ({
                        ...prev,
                        activeTopTab: "myResumes",
                      }))
                    }
                  >
                    My Resumes
                  </button>
                  <button
                    className={`px-4 py-2 border border-gray-200 rounded-t-md bg-white text-gray-800 font-semibold ${
                      uiState.activeTopTab === "help"
                        ? "border-b-0 font-bold"
                        : "opacity-70"
                    }`}
                    onClick={() =>
                      setUiState((prev) => ({ ...prev, activeTopTab: "help" }))
                    }
                  >
                    Help
                  </button>
                </nav>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => (window.location.href = "/cover-letter")}
                className="inline-flex items-center px-3 py-2 rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac]"
                title="Cover Letter"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span className="ml-2 text-sm">Cover Letter</span>
              </button>
              <button
                onClick={handleManualSave}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac] transition-all duration-200 ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title={saveStatus || "Save Resume"}
                disabled={saving}
              >
                {saving ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  if (!user)
                    setUiState((prev) => ({ ...prev, showSignInModal: true }));
                  else window.location.href = "/account";
                }}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#16aeac] flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
                title="Account"
              >
                <span className="text-[#16aeac] font-semibold text-sm">
                  {user?.displayName?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "?"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="backdrop-blur rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Resume Builder
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePasteResume}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac]"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Paste Resume
                </button>
                <PDFDownloadLink
                  document={pdfDocument}
                  fileName="resume.pdf"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac]"
                >
                  {({ loading }) => (
                    <>
                      <PrinterIcon className="w-5 h-5 mr-2" />
                      {loading ? "Preparing PDF..." : "Download PDF"}
                    </>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </div>

          {/* Content Area */}
          {uiState.activeTopTab === "help" ? (
            <div className="p-6">
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Resume Builder Help
                </h2>
                <p className="text-gray-600 mb-8">
                  Quick guide to building and saving your resume efficiently.
                </p>

                <div className="space-y-6">
                  <section className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Getting Started
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>
                        Choose a template in "Choose a Template" on the left.
                      </li>
                      <li>
                        Open each section (Personal, Summary, Experience,
                        Education, Websites) and fill in fields.
                      </li>
                      <li>
                        Use the AI Suggestions buttons for summaries and bullet
                        points.
                      </li>
                    </ul>
                  </section>

                  <section className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      AI Suggestions
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>
                        Profile: generates 5 concise professional summaries for
                        your title.
                      </li>
                      <li>
                        Experience: generates achievement bullets for the job
                        title in that card.
                      </li>
                      <li>
                        Click + on a suggestion to insert it into your resume.
                      </li>
                    </ul>
                  </section>

                  <section className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Saving & Sync
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>
                        Auto‑save: changes are saved to your browser
                        automatically after a short pause.
                      </li>
                      <li>
                        Cloud sync: if you are signed in, changes are synced to
                        Firebase during safe moments (when you switch
                        tabs/windows, the tab becomes hidden, you come back
                        online, or when leaving the page). Writes are throttled
                        to minimize calls.
                      </li>
                      <li>
                        Manual save: click the disk icon in the header to
                        immediately push to the cloud.
                      </li>
                    </ul>
                  </section>

                  <section className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Download PDF
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>
                        Use the "Download PDF" button in the header to export
                        your resume as a PDF.
                      </li>
                      <li>The PDF uses the currently selected template.</li>
                    </ul>
                  </section>

                  <section className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Tips
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                      <li>
                        Keep bullet points action‑oriented and quantify results
                        where possible.
                      </li>
                      <li>
                        Use at most 4–5 bullets per experience for readability.
                      </li>
                      <li>
                        Switch templates anytime; your content remains the same.
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-12 gap-6">
                {/* Left Side - Edit Sections */}
                <div className="col-span-5">
                  <div className="space-y-6">
                    {/* Templates Section */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <h2 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
                        Choose a Template
                      </h2>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {resumeTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() =>
                                setUiState((prev) => ({
                                  ...prev,
                                  selectedTemplate: template.id,
                                }))
                              }
                              className={`p-4 rounded-lg border ${
                                uiState.selectedTemplate === template.id
                                  ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {/* PNG Icon for each template */}
                              {template.id === "modern" && (
                                <img
                                  src="/svg/Businessprofessional.png"
                                  alt="Modern Professional"
                                  className="w-16 h-16 mx-auto mb-3 object-contain"
                                />
                              )}
                              {template.id === "executive" && (
                                <img
                                  src="/svg/Executive.png"
                                  alt="Executive"
                                  className="w-16 h-16 mx-auto mb-3 object-contain"
                                />
                              )}
                              {template.id === "minimal" && (
                                <img
                                  src="/svg/minimal.png"
                                  alt="Minimal"
                                  className="w-16 h-16 mx-auto mb-3 object-contain"
                                />
                              )}
                              {template.id === "creative" && (
                                <img
                                  src="/svg/Creativethinking.png"
                                  alt="Creative Professional"
                                  className="w-16 h-16 mx-auto mb-3 object-contain"
                                />
                              )}
                              <div className="text-xs font-medium text-center mt-2">
                                {template.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() =>
                          setUiState((prev) => ({
                            ...prev,
                            activeSection:
                              uiState.activeSection === "personal"
                                ? null
                                : "personal",
                          }))
                        }
                        className="w-full p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-gray-900">
                          Personal Information
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            uiState.activeSection === "personal"
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                      {uiState.activeSection === "personal" && (
                        <div className="p-6">{renderEditSection()}</div>
                      )}
                    </div>

                    {/* Professional Summary Section */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() =>
                          setUiState((prev) => ({
                            ...prev,
                            activeSection:
                              uiState.activeSection === "profile"
                                ? null
                                : "profile",
                          }))
                        }
                        className="w-full p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-gray-900">
                          Professional Summary
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            uiState.activeSection === "profile"
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                      {uiState.activeSection === "profile" && (
                        <div className="p-6">{renderEditSection()}</div>
                      )}
                    </div>

                    {/* Work Experience Section */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() =>
                          setUiState((prev) => ({
                            ...prev,
                            activeSection:
                              uiState.activeSection === "experience"
                                ? null
                                : "experience",
                          }))
                        }
                        className="w-full p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-gray-900">
                          Work Experience
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            uiState.activeSection === "experience"
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                      {uiState.activeSection === "experience" && (
                        <div className="p-6">{renderEditSection()}</div>
                      )}
                    </div>

                    {/* Education Section */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() =>
                          setUiState((prev) => ({
                            ...prev,
                            activeSection:
                              uiState.activeSection === "education"
                                ? null
                                : "education",
                          }))
                        }
                        className="w-full p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-gray-900">
                          Education
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            uiState.activeSection === "education"
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                      {uiState.activeSection === "education" && (
                        <div className="p-6">{renderEditSection()}</div>
                      )}
                    </div>

                    {/* Websites Section */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() =>
                          setUiState((prev) => ({
                            ...prev,
                            activeSection:
                              uiState.activeSection === "websites"
                                ? null
                                : "websites",
                          }))
                        }
                        className="w-full p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-gray-900">
                          Websites & Social Links
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            uiState.activeSection === "websites"
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                      {uiState.activeSection === "websites" && (
                        <div className="p-6">{renderEditSection()}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Resume Preview */}
                <div className="col-span-7">
                  <div className="sticky top-6 z-[1000]">
                    <ResumePreview
                      resumeData={resumeData}
                      template={uiState.selectedTemplate}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sign In Modal */}
          <SignInModal
            isOpen={uiState.showSignInModal}
            onClose={() =>
              setUiState((prev) => ({ ...prev, showSignInModal: false }))
            }
            onSuccess={() =>
              setUiState((prev) => ({ ...prev, showSignInModal: false }))
            }
          />

          {/* Paste Resume Modal */}
          {uiState.showPasteModal && (
            <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
                <button
                  onClick={() =>
                    setUiState((prev) => ({ ...prev, showPasteModal: false }))
                  }
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Paste Your Resume
                </h3>
                <textarea
                  ref={textareaRef}
                  value={pastedResume}
                  onChange={(e) => setPastedResume(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste your resume text here..."
                />
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() =>
                      setUiState((prev) => ({ ...prev, showPasteModal: false }))
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasteResume}
                    disabled={!pastedResume.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {"Parse Resume"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ErrorDisplay />
    </div>
  );
};

export default ResumeBuilder;
