import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
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
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { setDoc } from "firebase/firestore";
import SignInModal from "./SignInModal";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ResumePdfPreview from "./ResumePdfPreview";
import ResumeShell from "./resume/ResumeShell";
import AtsCheckPanel from "./resume/AtsCheckPanel";
import {
  isResumeTemplateId,
  ivyForTemplate,
  ivyLeagueOptions,
  normalizeTemplateId,
  templatesForIvy,
  RESUME_TEMPLATE_STORAGE_KEY,
  type IvyLeagueId,
  type ResumeTemplateId,
} from "../constants/resumeTemplates";
import { initialResumeData } from "../constants/resumeDefaults";
import { templateDiscouragesSummary } from "../utils/resumeHygiene";
import { postParseResume } from "../utils/aiApi";
import { normalizeParsedResume } from "@shared/normalizeParsedResume.js";
import {
  buildCloudPayload,
  fetchUserResume,
  isPristineNewResumeDraft,
  resumeDocRef,
  resumeEditorFingerprint,
  resumeLocalEditAtKey,
  resumeLocalStorageKey,
  resumeTitleFromData,
  stripResumeDocument,
} from "../utils/resumeFirestore";

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

const formatExperienceRangeLabel = (startDate: string, endDate: string) => {
  const formatMonthYear = (value: string) => {
    if (!value) return "";
    const parsed = parseDate(value);
    if (!parsed) return value;
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };
  const start = formatMonthYear(startDate);
  if (!start && !endDate) return "Dates not set";
  const end = endDate ? formatMonthYear(endDate) : "Present";
  if (!start) return end;
  return `${start} – ${end}`;
};

type ResumeBuilderProps = {
  guestOnly?: boolean;
};

const ResumeBuilder = ({ guestOnly = false }: ResumeBuilderProps) => {
  const { resumeId } = useParams<{ resumeId: string }>();
  // Consolidate related state into a single object
  const [uiState, setUiState] = useState({
    activeSection: "personal" as string | null,
    selectedTemplate: "harvard-mcs",
    selectedIvy: "harvard" as IvyLeagueId,
    showTemplates: false,
    activeTopTab: "myResumes" as "myResumes" | "templates" | "settings",
    showPasteModal: false,
    showSignInModal: false,
    sidebarOpen: false,
  });

  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [pastedResume, setPastedResume] = useState("");
  const [parsingResume, setParsingResume] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Add auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const [, setHasPendingSync] = useState(false);
  const lastSyncedAtRef = useRef<number>(0);
  const lastSyncedContentRef = useRef<string | null>(null);
  const loadedBaselineRef = useRef("");
  const cloudDocExistsRef = useRef(false);
  const isDirtyRef = useRef(false);
  const resumeDataRef = useRef(resumeData);
  const selectedTemplateRef = useRef(uiState.selectedTemplate);
  const [expandedExperienceIndex, setExpandedExperienceIndex] = useState<
    number | null
  >(0);

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

  useEffect(() => {
    const stored = localStorage.getItem(RESUME_TEMPLATE_STORAGE_KEY);
    if (stored && isResumeTemplateId(stored)) {
      const normalized = normalizeTemplateId(stored);
      setUiState((prev) => ({
        ...prev,
        selectedTemplate: normalized,
        selectedIvy: ivyForTemplate(normalized),
      }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      RESUME_TEMPLATE_STORAGE_KEY,
      uiState.selectedTemplate
    );
  }, [uiState.selectedTemplate]);

  useEffect(() => {
    setExpandedExperienceIndex(0);
  }, [resumeId]);

  useEffect(() => {
    resumeDataRef.current = resumeData;
  }, [resumeData]);

  useEffect(() => {
    selectedTemplateRef.current = uiState.selectedTemplate;
  }, [uiState.selectedTemplate]);

  const toggleExperienceExpanded = useCallback((index: number) => {
    setExpandedExperienceIndex((current) =>
      current === index ? null : index
    );
  }, []);

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
    setResumeData((prev) => {
      const nextIndex = prev.experience.length;
      setExpandedExperienceIndex(nextIndex);
      return {
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
      };
    });
  };

  const removeExperience = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
    setExpandedExperienceIndex((current) => {
      if (current === null) return null;
      if (current === index) {
        return Math.max(0, index - 1);
      }
      if (current > index) return current - 1;
      return current;
    });
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
    if (import.meta.env.DEV) console.log("Active Section:", uiState.activeSection);
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

  const openPasteResumeModal = () => {
    if (!user) {
      setUiState((prev) => ({ ...prev, showSignInModal: true }));
      return;
    }
    setParseError(null);
    setUiState((prev) => ({ ...prev, showPasteModal: true }));
  };

  const closePasteResumeModal = () => {
    if (parsingResume) return;
    setParseError(null);
    setUiState((prev) => ({ ...prev, showPasteModal: false }));
  };

  const submitPasteParse = async () => {
    const text = pastedResume.trim();
    if (!text || parsingResume) return;

    const currentUser = auth.currentUser ?? user;
    if (!currentUser) {
      setUiState((prev) => ({ ...prev, showSignInModal: true }));
      return;
    }

    setParsingResume(true);
    setParseError(null);
    setFirestoreError(null);

    try {
      const token = await currentUser.getIdToken();
      const { resume: raw } = await postParseResume(token, {
        text,
        templateId: uiState.selectedTemplate,
      });

      let parsed = normalizeParsedResume(raw);
      if (templateDiscouragesSummary(uiState.selectedTemplate)) {
        parsed = { ...parsed, profile: "" };
      }
      if (parsed.experience.length === 0) {
        parsed = {
          ...parsed,
          experience: [
            {
              title: "",
              company: "",
              startDate: "",
              endDate: "",
              description: [""],
            },
          ],
        };
      }

      setResumeData(parsed);
      setExpandedExperienceIndex(0);
      isDirtyRef.current = true;
      setHasPendingSync(true);
      setPastedResume("");
      setUiState((prev) => ({ ...prev, showPasteModal: false }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not parse this resume. Try again.";
      setParseError(message);
    } finally {
      setParsingResume(false);
    }
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

  const localStorageKey = resumeId ? resumeLocalStorageKey(resumeId) : "resume";
  const localEditAtKey = resumeId
    ? resumeLocalEditAtKey(resumeId)
    : "resume_local_edit_at";

  const flushResumeToLocalStorage = useCallback(() => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const blob = {
      ...resumeData,
      selectedTemplate: uiState.selectedTemplate,
      lastUpdated: new Date().toISOString(),
    };
    const str = JSON.stringify(blob);
    localStorage.setItem(localStorageKey, str);
    return str;
  }, [localStorageKey, resumeData, uiState.selectedTemplate]);

  const saveResumeToCloud = useCallback(
    async () => {
      const uid = auth.currentUser?.uid ?? user?.uid;
      if (!uid || !isAuthenticated) {
        throw new Error("Sign in to save your resume to the cloud");
      }
      if (!resumeId) {
        throw new Error("Missing resume id");
      }

      flushResumeToLocalStorage();

      const resumeDataToSave = buildCloudPayload(
        uid,
        resumeData,
        uiState.selectedTemplate
      );

      await setDoc(resumeDocRef(uid, resumeId), resumeDataToSave, {
        merge: true,
      });

      const fp = resumeEditorFingerprint(
        resumeData,
        uiState.selectedTemplate
      );
      lastSyncedAtRef.current = Date.now();
      lastSyncedContentRef.current = fp;
      loadedBaselineRef.current = fp;
      cloudDocExistsRef.current = true;
      isDirtyRef.current = false;
      setHasPendingSync(false);
      return resumeDataToSave;
    },
    [
      flushResumeToLocalStorage,
      isAuthenticated,
      resumeData,
      resumeId,
      uiState.selectedTemplate,
      user?.uid,
    ]
  );

  useEffect(() => {
    if (guestOnly || !authReady || !resumeId) return;

    const load = async () => {
      setLoading(true);
      setFirestoreError(null);

      try {
        let localRaw: Record<string, unknown> | null = null;
        let localUpdated: string | undefined;
        let storedResume = localStorage.getItem(localStorageKey);
        if (!storedResume) {
          const legacy = localStorage.getItem("resume");
          if (legacy) {
            storedResume = legacy;
            localStorage.setItem(localStorageKey, legacy);
          }
        }
        if (storedResume) {
          try {
            localRaw = JSON.parse(storedResume) as Record<string, unknown>;
            const parsed = stripResumeDocument(localRaw);
            localUpdated = parsed.lastUpdated;
          } catch {
            localRaw = null;
          }
        }

        if (!auth.currentUser) {
          if (localRaw) {
            const parsed = stripResumeDocument(localRaw);
            setResumeData(parsed.resume);
          }
          return;
        }

        const cloudDoc = await fetchUserResume(auth.currentUser.uid, resumeId);

        if (cloudDoc) {
          const cloudRaw = cloudDoc as unknown as Record<string, unknown>;
          const cloud = stripResumeDocument(cloudRaw);
          const cloudTime = cloud.lastUpdated
            ? Date.parse(cloud.lastUpdated)
            : 0;
          const localEditAt = localStorage.getItem(localEditAtKey);
          const localTime = localEditAt
            ? Date.parse(localEditAt)
            : localUpdated
              ? Date.parse(localUpdated)
              : 0;

          let useCloud = true;
          if (localRaw) {
            if (cloudTime > 0 && localTime > 0) {
              useCloud = cloudTime >= localTime;
            } else {
              useCloud = false;
            }
          }
          const chosen = useCloud ? cloudRaw : localRaw!;
          const parsed = stripResumeDocument(chosen);

          setResumeData(parsed.resume);
          if (
            parsed.selectedTemplate &&
            isResumeTemplateId(parsed.selectedTemplate)
          ) {
            const normalized = normalizeTemplateId(parsed.selectedTemplate);
            setUiState((prev) => ({
              ...prev,
              selectedTemplate: normalized,
              selectedIvy: ivyForTemplate(normalized),
            }));
            localStorage.setItem(
              RESUME_TEMPLATE_STORAGE_KEY,
              normalized
            );
          }

          localStorage.setItem(localStorageKey, JSON.stringify(chosen));
          const templateForFp =
            parsed.selectedTemplate &&
            isResumeTemplateId(parsed.selectedTemplate)
              ? normalizeTemplateId(parsed.selectedTemplate)
              : uiState.selectedTemplate;
          const fp = resumeEditorFingerprint(parsed.resume, templateForFp);
          loadedBaselineRef.current = fp;
          isDirtyRef.current = false;
          cloudDocExistsRef.current = true;
          lastSyncedContentRef.current = fp;
          lastSyncedAtRef.current = Date.now();
          setHasPendingSync(!useCloud);
        } else if (localRaw) {
          const parsed = stripResumeDocument(localRaw);
          setResumeData(parsed.resume);
          if (
            parsed.selectedTemplate &&
            isResumeTemplateId(parsed.selectedTemplate)
          ) {
            const normalized = normalizeTemplateId(parsed.selectedTemplate);
            setUiState((prev) => ({
              ...prev,
              selectedTemplate: normalized,
              selectedIvy: ivyForTemplate(normalized),
            }));
          }
          const templateForFp =
            parsed.selectedTemplate &&
            isResumeTemplateId(parsed.selectedTemplate)
              ? normalizeTemplateId(parsed.selectedTemplate)
              : uiState.selectedTemplate;
          const fp = resumeEditorFingerprint(parsed.resume, templateForFp);
          loadedBaselineRef.current = fp;
          isDirtyRef.current = false;
          cloudDocExistsRef.current = false;
          lastSyncedContentRef.current = null;
          setHasPendingSync(false);
        } else {
          setFirestoreError("This resume could not be found.");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load resume from the cloud";
        setFirestoreError(message);
        const cached = localStorage.getItem(localStorageKey);
        if (cached) {
          try {
            setResumeData(stripResumeDocument(JSON.parse(cached)).resume);
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [authReady, guestOnly, localEditAtKey, localStorageKey, resumeId]);

  const handleManualSave = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setUiState((prev) => ({ ...prev, showSignInModal: true }));
      return;
    }
    setSaving(true);
    setSaveStatus(null);
    setFirestoreError(null);
    try {
      await saveResumeToCloud();
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      let message = "Failed to save resume. Please try again.";
      if (error instanceof Error) message = error.message;
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: string }).code)
          : "";
      if (code === "permission-denied") {
        message =
          "Cloud save blocked by Firestore rules. Ensure rules are deployed and you are signed in.";
      }
      setFirestoreError(message);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [user, isAuthenticated, saveResumeToCloud]);

  // Auto-save resume changes to localStorage (debounced)
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      try {
        const fp = resumeEditorFingerprint(
          resumeData,
          uiState.selectedTemplate
        );
        flushResumeToLocalStorage();
        const dirty = fp !== loadedBaselineRef.current;
        isDirtyRef.current = dirty;
        setHasPendingSync(dirty);
        if (dirty) {
          localStorage.setItem(localEditAtKey, new Date().toISOString());
        }
      } catch {}
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    flushResumeToLocalStorage,
    localEditAtKey,
    localStorageKey,
    resumeData,
    uiState.selectedTemplate,
  ]);

  const syncLocalResumeToFirestore = useCallback(async () => {
    if (!isAuthenticated || !auth.currentUser) return;
    if (!navigator.onLine) return;
    if (!isDirtyRef.current) return;

    const now = Date.now();
    if (now - lastSyncedAtRef.current < 8000) return;

    const fp = resumeEditorFingerprint(
      resumeDataRef.current,
      selectedTemplateRef.current
    );
    if (lastSyncedContentRef.current === fp) {
      isDirtyRef.current = false;
      setHasPendingSync(false);
      return;
    }

    flushResumeToLocalStorage();

    try {
      await saveResumeToCloud();
    } catch (error) {
      console.error("[Resume] Background cloud sync failed:", error);
    }
  }, [flushResumeToLocalStorage, isAuthenticated, saveResumeToCloud]);

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
      void syncLocalResumeToFirestore();
    };
  }, [syncLocalResumeToFirestore]);

  useEffect(() => {
    if (guestOnly || !resumeId) return;

    return () => {
      const data = resumeDataRef.current;
      const template = selectedTemplateRef.current;
      const pristine = isPristineNewResumeDraft(data, template);

      if (!pristine || cloudDocExistsRef.current) return;

      localStorage.removeItem(resumeLocalStorageKey(resumeId));
      localStorage.removeItem(resumeLocalEditAtKey(resumeId));
    };
  }, [guestOnly, resumeId]);

  const renderEditSection = useCallback(() => {
    switch (uiState.activeSection) {
      case "personal":
        // Debug log for job title and active section (development only)
        if (import.meta.env.DEV) {
          console.log(
            "Job Title:",
            resumeData.personalInfo.title,
            "Active Section:",
            uiState.activeSection
          );
        }
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Professional Summary
            </h3>
            {templateDiscouragesSummary(uiState.selectedTemplate) ? (
              <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg px-3 py-2">
                For{" "}
                {uiState.selectedTemplate === "brown-standard"
                  ? "Brown CareerLAB"
                  : "Harvard MCS–style"}{" "}
                templates, early-career resumes usually omit a summary. Leave
                this blank unless an advisor asks for one.
              </p>
            ) : null}
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
              templateId={uiState.selectedTemplate}
            />
          </div>
        );

      case "experience":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Experience</h3>
              <button
                onClick={addExperience}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Experience</span>
              </button>
            </div>
            <div className="max-h-[min(70vh,720px)] overflow-y-auto space-y-3 pr-1">
              {resumeData.experience.map((exp: any, expIndex: number) => {
                const isExpanded = expandedExperienceIndex === expIndex;
                return (
                  <div
                    key={expIndex}
                    className="rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden bg-gray-50 dark:bg-zinc-900/50"
                  >
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => toggleExperienceExpanded(expIndex)}
                        className="flex flex-1 min-w-0 items-center gap-3 p-4 text-left hover:bg-gray-100/80 dark:hover:bg-zinc-800/80 transition-colors"
                      >
                        <ChevronDownIcon
                          className={`h-5 w-5 shrink-0 text-gray-500 dark:text-zinc-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {exp.title?.trim() || "Untitled role"}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                            {exp.company?.trim() || "Company not set"}
                            {" · "}
                            {formatExperienceRangeLabel(
                              exp.startDate,
                              exp.endDate
                            )}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExperience(expIndex)}
                        className="shrink-0 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-l border-gray-200 dark:border-zinc-700"
                        aria-label="Remove this job"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="space-y-4 border-t border-gray-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-950/40">
                        <div>
                          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            Job Title
                          </label>
                          <input
                            type="text"
                            className="resume-input mt-1"
                            value={exp.title}
                            onChange={(e) =>
                              handleExperienceChange(
                                expIndex,
                                "title",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                              Key Achievements
                            </label>
                            {exp.description.length < 5 && (
                              <button
                                type="button"
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
                                  <span className="mt-2.5 text-gray-500">
                                    •
                                  </span>
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
                                    type="button"
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
                              templateId={uiState.selectedTemplate}
                            />
                            {!exp.title || exp.title.trim() === "" ? (
                              <div className="text-xs text-gray-400 mt-1">
                                Enter a job title to get AI suggestions.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "education":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Education</h3>
              <button
                onClick={addEducation}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add Education</span>
              </button>
            </div>
            {resumeData.education.map((edu: any, index: number) => (
              <div
                key={index}
                className="space-y-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-lg"
              >
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
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
              <div
                key={index}
                className="space-y-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-lg"
              >
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
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

      case "atsCheck":
        return (
          <AtsCheckPanel
            resumeData={resumeData}
            templateId={uiState.selectedTemplate as ResumeTemplateId}
            onUpdateResume={setResumeData}
          />
        );

      default:
        return null;
    }
  }, [
    uiState.activeSection,
    uiState.selectedTemplate,
    resumeData,
    expandedExperienceIndex,
    toggleExperienceExpanded,
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

  useEffect(() => {
    if (guestOnly) {
      setLoading(false);
    }
  }, [guestOnly]);

  if (guestOnly && authReady && user) {
    return <Navigate to="/resume" replace />;
  }

  if (!guestOnly && loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 dark:text-teal-400 mb-4"
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
          <div className="text-xl font-semibold text-zinc-600 dark:text-zinc-300">
            Loading...
          </div>
        </div>
      </div>
    );

  if (guestOnly && !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-white dark:bg-black flex flex-col">
          <div className="flex-1">
            <div className="relative overflow-visible max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="pt-32 pb-16 text-center">
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <span>📄</span>
                  <span>→</span>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-semibold">AI</span>
                  <span>→</span>
                  <span>🚀</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">
                  Build Professional Resumes
                </h1>
                <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto mb-10">
                  Create stunning resumes with AI assistance. Choose from professional templates and get expert suggestions.
                </p>
                <div className="mt-2 flex justify-center gap-3 mb-16">
                  <button
                    onClick={() => setUiState((prev) => ({ ...prev, showSignInModal: true }))}
                    className="inline-block px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 duration-300 shadow-lg text-base font-semibold"
                  >
                    Start Building
                  </button>
                  <a
                    href="#preview"
                    className="inline-block px-6 py-3 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all text-base font-semibold"
                  >
                    See Preview
                  </a>
                </div>
              </div>

              {/* Resume Preview Demo */}
              <div id="preview" className="max-w-4xl mx-auto mb-16">
                <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 shadow-lg">
                  <div className="flex items-center gap-2 mb-6">
                    <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Resume Preview
                    </h2>
                  </div>

                  {/* Sample Resume Display */}
                  <div className="resume-preview-paper bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                    <div className="max-w-2xl mx-auto">
                      {/* Header */}
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">David St. Peter</h3>
                        <p className="text-lg text-green-600 font-medium">UX Designer</p>
                        <div className="text-sm text-gray-600 mt-2">
                          david@example.com • +000 123 456 789 • New York, USA
                        </div>
                      </div>

                      {/* Profile */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Profile</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          For more Sales, Leads, Customer Engagement. Become an Author, Create Information Products.
                          All done quickly and easily. No Design or Technical skills necessary.
                        </p>
                      </div>

                      {/* Experience */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Experience</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-gray-900">Senior UX Designer</h5>
                                <p className="text-green-600 text-sm">Company Name</p>
                              </div>
                              <span className="text-sm text-gray-500">2020 - Present</span>
                            </div>
                            <ul className="text-sm text-gray-700 mt-2 space-y-1">
                              <li>• Led the redesign of the company's flagship product, resulting in a 40% increase in user engagement</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* CTA Overlay */}
                      <div className="relative mt-8">
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent rounded-lg"></div>
                        <div className="relative bg-white border-2 border-green-200 rounded-lg p-6 text-center">
                          <div className="flex items-center justify-center mb-3">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-100 text-green-700 mr-2">✨</span>
                            <h3 className="text-lg font-bold text-green-700">Unlock Full Features</h3>
                          </div>
                          <p className="text-gray-700 mb-4">
                            Sign up to create unlimited resumes, access premium templates, and get AI-powered suggestions.
                          </p>
                          <button
                            onClick={() => setUiState((prev) => ({ ...prev, showSignInModal: true }))}
                            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                          >
                            Get Started Free
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="max-w-6xl mx-auto mt-16 mb-16">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
                    Why Choose Brightfolio?
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                    Everything you need to create professional resumes that get results.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 flex items-center justify-center mb-4">
                      <span className="text-green-600 dark:text-green-400">🎨</span>
                    </div>
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Professional Templates</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Choose from carefully designed templates that impress employers.</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 flex items-center justify-center mb-4">
                      <span className="text-green-600 dark:text-green-400">🤖</span>
                    </div>
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">AI-Powered Suggestions</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Get intelligent recommendations to improve your resume content.</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-200 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 flex items-center justify-center mb-4">
                      <span className="text-green-600 dark:text-green-400">📄</span>
                    </div>
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">PDF Export</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Download your resume as a professional PDF ready for applications.</p>
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <div className="max-w-3xl mx-auto mt-12 mb-16">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-zinc-950 dark:to-zinc-900 border border-green-200 dark:border-zinc-800 rounded-xl p-8 text-center">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Ready to Build Your Resume?</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 mb-6">
                    Join thousands of professionals who have created stunning resumes with Brightfolio.
                  </p>
                  <button
                    onClick={() => setUiState((prev) => ({ ...prev, showSignInModal: true }))}
                    className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                  >
                    Create Your Resume Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />

        {/* Sign In Modal */}
        <SignInModal
          isOpen={uiState.showSignInModal}
          onClose={() => setUiState((prev) => ({ ...prev, showSignInModal: false }))}
          onSuccess={() => setUiState((prev) => ({ ...prev, showSignInModal: false }))}
        />
      </>
    );
  }

  if (!resumeId) {
    return <Navigate to="/resume" replace />;
  }

  const editorTitle = resumeTitleFromData({
    ...resumeData,
    title: resumeData.personalInfo?.fullName,
  });

  const pdfDownloadButton = (
    <PDFDownloadLink
      document={pdfDocument}
      fileName={`${(resumeData.personalInfo.fullName || "resume").replace(/\s+/g, "-")}.pdf`}
      className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16aeac] dark:focus:ring-offset-zinc-950"
    >
      {({ loading }) => (
        <>
          <PrinterIcon className="w-5 h-5 mr-2 shrink-0" />
          <span className="hidden md:inline">
            {loading ? "Preparing PDF..." : "Download PDF"}
          </span>
          <span className="md:hidden">{loading ? "…" : "PDF"}</span>
        </>
      )}
    </PDFDownloadLink>
  );

  return (
    <>
      <ResumeShell
        activeTab="editor"
        mode="editor"
        titleOverride={editorTitle}
        sidebarOpen={uiState.sidebarOpen}
        onSidebarOpen={() =>
          setUiState((prev) => ({ ...prev, sidebarOpen: true }))
        }
        onSidebarClose={() =>
          setUiState((prev) => ({ ...prev, sidebarOpen: false }))
        }
        onPaste={openPasteResumeModal}
        onSave={handleManualSave}
        saving={saving}
        saveStatus={saveStatus}
        downloadAction={pdfDownloadButton}
      >
            <div className="p-6">
              <div className="grid grid-cols-12 gap-6">
                {/* Left Side - Edit Sections */}
                <div className="col-span-5 text-zinc-800 dark:text-zinc-200">
                  <div className="space-y-6">
                    {/* Ivy templates */}
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-zinc-800">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          Ivy templates
                        </h2>
                        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 shrink-0">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            School
                          </span>
                          <select
                            value={uiState.selectedIvy}
                            onChange={(e) => {
                              const nextIvy = e.target.value as IvyLeagueId;
                              const options = templatesForIvy(nextIvy);
                              setUiState((prev) => {
                                const keepCurrent = options.some(
                                  (t) => t.id === prev.selectedTemplate
                                );
                                return {
                                  ...prev,
                                  selectedIvy: nextIvy,
                                  selectedTemplate: keepCurrent
                                    ? prev.selectedTemplate
                                    : options[0]?.id ?? "harvard-mcs",
                                };
                              });
                            }}
                            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16aeac]/50"
                          >
                            {ivyLeagueOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="p-4 space-y-3">
                        {templatesForIvy(uiState.selectedIvy).map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() =>
                              setUiState((prev) => ({
                                ...prev,
                                selectedTemplate: template.id,
                              }))
                            }
                            className={`w-full p-4 rounded-lg border text-left bg-white dark:bg-zinc-900 ${
                              uiState.selectedTemplate === template.id
                                ? "border-[#16aeac] ring-2 ring-[#16aeac]/40"
                                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={template.thumbnail}
                                alt=""
                                className="w-12 h-12 shrink-0 object-contain"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  {template.name}
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  {template.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
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
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          Personal Information
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 dark:text-zinc-400 transition-transform ${
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
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
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
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          Professional Summary
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 dark:text-zinc-400 transition-transform ${
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
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
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
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          Work Experience
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 dark:text-zinc-400 transition-transform ${
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
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
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
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          Education
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 dark:text-zinc-400 transition-transform ${
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
                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
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
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          Websites & Social Links
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 dark:text-zinc-400 transition-transform ${
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

                    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                      <button
                        onClick={() =>
                          setUiState((prev) => ({
                            ...prev,
                            activeSection:
                              uiState.activeSection === "atsCheck"
                                ? null
                                : "atsCheck",
                          }))
                        }
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          ATS Check
                        </h2>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-500 dark:text-zinc-400 transition-transform ${
                            uiState.activeSection === "atsCheck"
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>
                      {uiState.activeSection === "atsCheck" && (
                        <div className="p-6">{renderEditSection()}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Resume Preview */}
                <div className="col-span-7">
                  <div className="sticky top-6 z-[10]">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Live preview
                    </p>
                    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-900/80 p-3 sm:p-4 shadow-sm">
                      <ResumePdfPreview
                        resumeData={resumeData}
                        template={uiState.selectedTemplate}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </ResumeShell>

      <SignInModal
        isOpen={uiState.showSignInModal}
        onClose={() =>
          setUiState((prev) => ({ ...prev, showSignInModal: false }))
        }
        onSuccess={() =>
          setUiState((prev) => ({ ...prev, showSignInModal: false }))
        }
      />

      {uiState.showPasteModal && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/55 dark:bg-black/75 backdrop-blur-xl p-4">
          <div className="bg-white/95 dark:bg-zinc-950/95 border border-gray-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg relative">
            <button
              type="button"
              onClick={closePasteResumeModal}
              disabled={parsingResume}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:text-zinc-500 disabled:opacity-40"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 pr-8">
              Import resume text
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              AI maps jobs (with dates), education, and contact info into your
              fields. Activities, sports, and other extras are dropped. Up to
              four Ivy-style bullets per role.
            </p>
            {parseError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {parseError}
              </p>
            )}
            <textarea
              ref={textareaRef}
              value={pastedResume}
              disabled={parsingResume}
              onChange={(e) => setPastedResume(e.target.value)}
              className="mt-4 w-full h-64 p-4 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#16aeac] focus:border-[#16aeac] disabled:opacity-60"
              placeholder="Paste plain text from a PDF, Word doc, or LinkedIn export…"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={closePasteResumeModal}
                disabled={parsingResume}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitPasteParse()}
                disabled={!pastedResume.trim() || parsingResume}
                className="px-4 py-2 bg-[#16aeac] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[8.5rem]"
              >
                {parsingResume ? "Importing…" : "Import resume"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ErrorDisplay />
    </>
  );
};

export default ResumeBuilder;
