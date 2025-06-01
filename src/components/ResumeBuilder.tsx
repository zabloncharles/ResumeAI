import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CloudIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  PrinterIcon,
  UserIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LinkIcon,
  SwatchIcon,
  HomeIcon,
  DocumentIcon,
  CpuChipIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import ResumePDF from './ResumePDF'
import { PDFDownloadLink } from '@react-pdf/renderer'
import AIResumeAssistant from './AIResumeAssistant'
import type { ResumeData } from '../types/ResumeData'
import CoverLetterCreator from './CoverLetterCreator'
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import SignIn from './SignIn';

interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const resumeTemplates: ResumeTemplate[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean and modern design with a focus on readability',
    preview: '/templates/modern.png'
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Traditional layout perfect for senior positions',
    preview: '/templates/executive.png'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant design that lets your content shine',
    preview: '/templates/minimal.png'
  },
  {
    id: 'creative',
    name: 'Creative Professional',
    description: 'Modern design with a creative touch',
    preview: '/templates/creative.png'
  }
];

const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: 'David St. Peter',
    title: 'UX Designer',
    email: 'david@example.com',
    phone: '+000 123 456 789',
    location: 'New York, USA',
    photo: 'https://ui-avatars.com/api/?name=David+St.+Peter&size=128',
  },
  profile: 'For more Sales, Leads, Customer Engagement. Become an Author, Create Information Products. All done quickly and easily. No Design or Technical skills necessary',
  experience: [
    {
      title: 'Senior UX Designer',
      company: 'Company Name',
      startDate: '2020-01',
      endDate: '',
      description: ["Led the redesign of the company's flagship product, resulting in a 40% increase in user engagement"],
    }
  ],
  education: [
    {
      degree: 'Degree Name',
      school: 'University name here',
      startDate: '2014',
      endDate: '2016',
    }
  ],
  websites: [
    {
      label: 'Portfolio',
      url: 'https://portfolio.com',
    }
  ],
}

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date;
};

const formatDateForState = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Helper to display month and year correctly in preview
const formatMonthYear = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  if (!year || !month) return '';
  // Month is 1-based, so subtract 1 for Date constructor
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const ResumeBuilder = () => {
  const [activeSection, setActiveSection] = useState('personal')
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [showTemplates, setShowTemplates] = useState(false)
  const [isUploading, setIsUploading] = useState(false);
  const [activeTopTab, setActiveTopTab] = useState<'resume' | 'coverLetter'>('resume');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedResume, setPastedResume] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user and resume data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.debug('[Firebase] Auth state changed:', firebaseUser);
      setUser(firebaseUser);
      if (firebaseUser) {
        setLoading(true);
        try {
          const docRef = doc(db, 'resumes', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.debug('[Firebase] Loaded resume for user:', firebaseUser.uid, docSnap.data());
            setResumeData(docSnap.data() as ResumeData);
          } else {
            console.debug('[Firebase] No resume found for user:', firebaseUser.uid);
          }
        } catch (err) {
          console.debug('[Firebase] Error loading resume:', err);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleManualSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await setDoc(doc(db, 'resumes', user.uid), resumeData);
      setLastSaved(new Date());
      setSaveStatus('saved');
      console.debug('[Firebase] Resume saved for user:', user.uid, resumeData);
    } catch (e) {
      setSaveStatus('Error saving.');
      console.debug('[Firebase] Error saving resume:', e);
    }
    setSaving(false);
  };

  const handlePersonalInfoChange = (field: keyof typeof resumeData.personalInfo, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }))
  }

  const handleProfileChange = (value: string) => {
    setResumeData(prev => ({
      ...prev,
      profile: value
    }))
  }

  const handleExperienceChange = (index: number, field: keyof typeof resumeData.experience[0], value: string | string[]) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const handleBulletPointChange = (expIndex: number, bulletIndex: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => {
        if (i !== expIndex) return exp;
        const newDescription = [...exp.description];
        newDescription[bulletIndex] = value;
        return { ...exp, description: newDescription };
      })
    }));
  };

  const addBulletPoint = (expIndex: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => {
        if (i !== expIndex) return exp;
        if (exp.description.length >= 5) return exp;
        return { ...exp, description: [...exp.description, ''] };
      })
    }));
  };

  const removeBulletPoint = (expIndex: number, bulletIndex: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => {
        if (i !== expIndex) return exp;
        const newDescription = exp.description.filter((_, idx) => idx !== bulletIndex);
        return { ...exp, description: newDescription };
      })
    }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: []
      }]
    }))
  }

  const removeExperience = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const handleEducationChange = (index: number, field: keyof typeof resumeData.education[0], value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        school: '',
        startDate: '',
        endDate: ''
      }]
    }))
  }

  const removeEducation = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const handleSuggestionSelect = (suggestion: string) => {
    console.log('Active Section:', activeSection);
    switch (activeSection) {
      case 'personal':
        // Handle personal section suggestions
        break;
      case 'summary':
      case 'profile':
        setResumeData(prev => ({
          ...prev,
          profile: suggestion
        }));
        break;
      case 'experience':
        if (resumeData.experience.length > 0) {
          setResumeData(prev => ({
            ...prev,
            experience: prev.experience.map((exp, index) => 
              index === 0 ? {
                ...exp,
                description: [...exp.description, suggestion]
              } : exp
            )
          }));
        }
        break;
      default:
        break;
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      // Parse the resume text and update the form data
      // This is a simple implementation - you might want to use a more sophisticated parser
      const lines = text.split('\n');
      let currentSection = '';
      
      lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.toLowerCase().includes('experience')) {
          currentSection = 'experience';
        } else if (line.toLowerCase().includes('education')) {
          currentSection = 'education';
        } else if (line.toLowerCase().includes('skills')) {
          currentSection = 'skills';
        } else {
          // Add content to the appropriate section
          if (currentSection === 'experience') {
            setResumeData(prev => ({
              ...prev,
              experience: [...prev.experience, {
                title: line,
                company: '',
                startDate: '',
                endDate: '',
                description: []
              }]
            }));
          } else if (currentSection === 'education') {
            setResumeData(prev => ({
              ...prev,
              education: [...prev.education, {
                degree: line,
                school: '',
                startDate: '',
                endDate: ''
              }]
            }));
          }
        }
      });
    } catch (error) {
      console.error('Error parsing resume:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasteResume = async () => {
    setParsing(true);
    setParseError('');
    try {
      const response = await fetch('/.netlify/functions/parseResume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedResume }),
      });
      if (!response.ok) throw new Error('Failed to parse resume');
      const data = await response.json();
      setResumeData(data);
      setShowPasteModal(false);
      setPastedResume('');
    } catch (e: any) {
      setParseError('Could not parse resume. Please try again.');
    }
    setParsing(false);
  };

  const renderTemplates = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Choose a Template</h3>
      <div className="grid grid-cols-2 gap-4">
        {resumeTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            className={`p-4 rounded-lg border ${
              selectedTemplate === template.id
                ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <img
              src={template.preview}
              alt={template.name}
              className="w-full h-40 object-cover rounded-md mb-3"
            />
            <h4 className="font-medium text-gray-900">{template.name}</h4>
            <p className="text-sm text-gray-500">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderEditSection = () => {
    switch (activeSection) {
      case 'personal':
        // Debug log for job title and active section
        console.log('Job Title:', resumeData.personalInfo.title, 'Active Section:', activeSection);
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.fullName}
                  onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.title}
                  onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                />
              </div>
            </div>
            <AIResumeAssistant 
              profession={resumeData.personalInfo.title}
              onSuggestionSelect={handleSuggestionSelect}
              section={activeSection}
            />
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Professional Summary</h3>
            <textarea
              className="resume-textarea"
              value={resumeData.profile}
              onChange={(e) => handleProfileChange(e.target.value)}
              placeholder="Write a professional summary..."
            />
            <AIResumeAssistant 
              profession={resumeData.personalInfo.title}
              summary={resumeData.profile}
              onSuggestionSelect={handleSuggestionSelect}
              section={activeSection}
            />
          </div>
        );

      case 'experience':
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
              <div key={expIndex} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Title</label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={exp.title}
                    onChange={(e) => handleExperienceChange(expIndex, 'title', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={exp.company}
                    onChange={(e) => handleExperienceChange(expIndex, 'company', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <div className="relative mt-1">
                      <DatePicker
                        selected={parseDate(exp.startDate)}
                        onChange={(date) => handleExperienceChange(expIndex, 'startDate', formatDateForState(date))}
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
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <div className="relative mt-1">
                      <DatePicker
                        selected={parseDate(exp.endDate)}
                        onChange={(date) => handleExperienceChange(expIndex, 'endDate', formatDateForState(date))}
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
                    <label className="block text-sm font-medium text-gray-700">Key Achievements</label>
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
                    {exp.description.map((bullet: string, bulletIndex: number) => (
                      <div key={bulletIndex} className="flex items-start space-x-2">
                        <span className="mt-2.5 text-gray-500">•</span>
                        <textarea
                          className="flex-1 resume-textarea mt-1"
                          value={bullet}
                          onChange={(e) => handleBulletPointChange(expIndex, bulletIndex, e.target.value)}
                          placeholder="Describe your achievement..."
                          rows={2}
                        />
                        <button
                          onClick={() => removeBulletPoint(expIndex, bulletIndex)}
                          className="mt-2 text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <AIResumeAssistant
                      profession={exp.title}
                      summary={''}
                      onSuggestionSelect={(suggestion) => {
                        handleExperienceChange(expIndex, 'description', [...exp.description, suggestion]);
                      }}
                      disabled={!exp.title || exp.title.trim() === ''}
                      section="employment"
                    />
                    {!exp.title || exp.title.trim() === '' ? (
                      <div className="text-xs text-gray-400 mt-1">Enter a job title to get AI suggestions.</div>
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

      case 'education':
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
                  <label className="block text-sm font-medium text-gray-700">Degree</label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={edu.degree}
                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">School</label>
                  <input
                    type="text"
                    className="resume-input mt-1"
                    value={edu.school}
                    onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Year</label>
                    <div className="relative mt-1">
                      <DatePicker
                        selected={parseDate(edu.startDate)}
                        onChange={(date) => handleEducationChange(index, 'startDate', formatDateForState(date))}
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
                    <label className="block text-sm font-medium text-gray-700">End Year</label>
                    <div className="relative mt-1">
                      <DatePicker
                        selected={parseDate(edu.endDate)}
                        onChange={(date) => handleEducationChange(index, 'endDate', formatDateForState(date))}
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

      default:
        return null;
    }
  };

  function getFormattedTime(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  // Timer to update the relative time message
  useEffect(() => {
    if (!lastSaved) return;
    const interval = setInterval(() => {
      setSaveStatus('saved');
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [lastSaved]);

  // Track unsaved changes
  useEffect(() => {
    if (!lastSaved) return;
    setUnsaved(true);
  }, [resumeData]);

  // When saved, reset unsaved state
  useEffect(() => {
    if (saveStatus === 'saved') setUnsaved(false);
  }, [saveStatus]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    </div>
  );
  if (!user) return <SignIn />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Link to="/" className="flex items-center space-x-2">
                  <CpuChipIcon className="h-6 w-6 text-blue-600" />
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ResumeAI
                  </span>
                </Link>
              </div>
              <div className="hidden md:flex space-x-4">
                <Link to="/" className="text-gray-600 hover:text-gray-900 flex items-center space-x-2">
                  <HomeIcon className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                <button
                  onClick={() => setActiveTopTab('resume')}
                  className={`text-gray-600 hover:text-gray-900 flex items-center space-x-2 ${activeTopTab === 'resume' ? 'font-bold border-b-2 border-blue-500' : ''}`}
                >
                  <DocumentIcon className="h-5 w-5" />
                  <span>My Resume</span>
                </button>
                <button
                  onClick={() => setActiveTopTab('coverLetter')}
                  className={`text-gray-600 hover:text-gray-900 flex items-center space-x-2 ${activeTopTab === 'coverLetter' ? 'font-bold border-b-2 border-blue-500' : ''}`}
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  <span>Cover Letter</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => setShowPasteModal(true)}
              >
                <ArrowUpTrayIcon className="h-5 w-5" />
                <span>Paste Resume</span>
              </button>
              <button
                className={`flex items-center space-x-1 text-gray-600 disabled:opacity-50 ${unsaved ? 'bg-orange-100 border border-orange-400 text-orange-700' : ''} px-3 py-1 rounded`}
                onClick={handleManualSave}
                disabled={saving}
              >
                <CloudIcon className="h-5 w-5" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              {saveStatus === 'saved' && lastSaved && (
                <span className="ml-2 text-sm text-green-600">Saved at {getFormattedTime(lastSaved)}</span>
              )}
              {saveStatus && saveStatus !== 'saved' && (
                <span className={`ml-2 text-sm text-red-600`}>{saveStatus}</span>
              )}
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <ArrowRightIcon className="h-5 w-5 text-gray-600" />
                </button>
                <PDFDownloadLink
                  document={<ResumePDF resumeData={resumeData} />}
                  fileName={`${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {({ loading }) => (
                    <>
                      <PrinterIcon className="h-5 w-5" />
                      <span>{loading ? 'Preparing PDF...' : 'Download PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              </div>
              <Link to="/settings" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 ml-4">
                <Cog6ToothIcon className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {activeTopTab === 'coverLetter' ? (
            <CoverLetterCreator resumeData={resumeData} />
          ) : (
            // Resume builder UI (left and right side)
            <>
              {/* Left Side - Form */}
              <div className="w-1/3 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => setShowTemplates(false)}
                        className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                          !showTemplates 
                            ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                        <span>Create</span>
                      </button>
                      <button 
                        onClick={() => setShowTemplates(true)}
                        className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                          showTemplates
                            ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <SwatchIcon className="h-5 w-5" />
                        <span>Templates</span>
                      </button>
                    </div>
                  </div>

                  {showTemplates ? (
                    <div className="p-4">
                      {renderTemplates()}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {/* Personal Information Section */}
                      <div>
                        <button 
                          onClick={() => setActiveSection(activeSection === 'personal' ? '' : 'personal')}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-900 font-medium">Personal Information</span>
                          </div>
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${activeSection === 'personal' ? 'transform rotate-180' : ''}`} />
                        </button>
                        {activeSection === 'personal' && (
                          <div className="p-4 bg-gray-50">
                            {renderEditSection()}
                          </div>
                        )}
                      </div>

                      {/* Professional Summary Section */}
                      <div>
                        <button 
                          onClick={() => setActiveSection(activeSection === 'profile' ? '' : 'profile')}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-2">
                            <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-900 font-medium">Professional Summary</span>
                          </div>
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${activeSection === 'profile' ? 'transform rotate-180' : ''}`} />
                        </button>
                        {activeSection === 'profile' && (
                          <div className="p-4 bg-gray-50">
                            {renderEditSection()}
                          </div>
                        )}
                      </div>

                      {/* Experience Section */}
                      <div>
                        <button 
                          onClick={() => setActiveSection(activeSection === 'experience' ? '' : 'experience')}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-2">
                            <BriefcaseIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-900 font-medium">Employment History</span>
                          </div>
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${activeSection === 'experience' ? 'transform rotate-180' : ''}`} />
                        </button>
                        {activeSection === 'experience' && (
                          <div className="p-4 bg-gray-50">
                            {renderEditSection()}
                          </div>
                        )}
                      </div>

                      {/* Education Section */}
                      <div>
                        <button 
                          onClick={() => setActiveSection(activeSection === 'education' ? '' : 'education')}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-2">
                            <AcademicCapIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-900 font-medium">Education</span>
                          </div>
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${activeSection === 'education' ? 'transform rotate-180' : ''}`} />
                        </button>
                        {activeSection === 'education' && (
                          <div className="p-4 bg-gray-50">
                            {renderEditSection()}
                          </div>
                        )}
                      </div>

                      {/* Websites Section */}
                      <div>
                        <button 
                          onClick={() => setActiveSection(activeSection === 'websites' ? '' : 'websites')}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-2">
                            <LinkIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-900 font-medium">Websites & Social Links</span>
                          </div>
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${activeSection === 'websites' ? 'transform rotate-180' : ''}`} />
                        </button>
                        {activeSection === 'websites' && (
                          <div className="p-4 bg-gray-50">
                            {renderEditSection()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Preview */}
              <div className="w-2/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8">
                  <div
                    className="mx-auto bg-white shadow-lg overflow-x-auto"
                    style={{
                      width: '100%',
                      maxWidth: '8.5in',
                      aspectRatio: '8.5/11',
                      minHeight: '0',
                      height: 'auto',
                      boxSizing: 'border-box',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <div className="p-4 sm:p-8" style={{ fontFamily: 'Times New Roman, Times, serif', color: '#111' }}>
                      {/* Header */}
                      <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center" style={{ fontFamily: 'Times New Roman, Times, serif' }}>{resumeData.personalInfo.fullName}</h1>
                        <div className="w-full border-t border-t-[1px] border-gray-300 my-2" />
                        <div className="text-gray-800 text-xs sm:text-sm text-center pb-2 border-b-2 border-gray-400 mb-6" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                          Location: {resumeData.personalInfo.location} | Phone: {resumeData.personalInfo.phone} | Email: {resumeData.personalInfo.email}
                          {resumeData.websites && resumeData.websites.length > 0 ? ` | Portfolio: ${resumeData.websites[0].url}` : ''}
                        </div>
                      </div>
                      {/* Summary */}
                      <div className="mb-6">
                        <div className="text-base sm:text-lg font-bold pb-1 mb-2" style={{ fontFamily: 'Times New Roman, Times, serif' }}>Summary</div>
                        <div style={{ fontFamily: 'Times New Roman, Times, serif' }}>{resumeData.profile}</div>
                      </div>
                      {/* Experience */}
                      <div className="mb-6">
                        <div className="text-base sm:text-lg font-bold border-b-2 border-gray-400 pb-1 mb-2" style={{ fontFamily: 'Times New Roman, Times, serif' }}>Experience</div>
                        {resumeData.experience.map((exp: any, idx: number) => (
                          <div key={idx} className="mb-4">
                            <div>
                              <span className="font-bold" style={{ fontFamily: 'Times New Roman, Times, serif' }}>{exp.company}</span>
                              {exp.company && exp.title ? ', ' : ''}
                              <span className="italic" style={{ fontFamily: 'Times New Roman, Times, serif' }}>{exp.title}</span>
                              {(exp.company || exp.title) ? ' | ' : ''}
                              <span style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                                {exp.startDate ? formatMonthYear(exp.startDate) : ''}
                                {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ''}
                              </span>
                            </div>
                            {exp.description.length > 0 && (
                              <ul className="list-disc ml-6 mt-1" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                                {exp.description.map((bullet: string, bidx: number) => (
                                  <li key={bidx}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Education */}
                      <div className="mb-6">
                        <div className="text-base sm:text-lg font-bold border-b-2 border-gray-400 pb-1 mb-2" style={{ fontFamily: 'Times New Roman, Times, serif' }}>Education</div>
                        {resumeData.education.map((edu: any, idx: number) => (
                          <div key={idx} className="mb-2">
                            <span className="font-bold" style={{ fontFamily: 'Times New Roman, Times, serif' }}>{edu.degree}</span>
                            {edu.degree && edu.school ? ', ' : ''}
                            <span style={{ fontFamily: 'Times New Roman, Times, serif' }}>{formatMonthYear(edu.startDate)}{edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Paste Resume Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPasteModal(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Paste Your Resume</h2>
            <textarea
              ref={textareaRef}
              className="w-full h-40 border border-gray-300 rounded p-2 mb-4 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste your resume text here..."
              value={pastedResume}
              onChange={e => setPastedResume(e.target.value)}
            />
            {parseError && <div className="text-red-600 mb-2">{parseError}</div>}
            <button
              className="w-full py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition-colors"
              onClick={handlePasteResume}
              disabled={parsing || !pastedResume.trim()}
            >
              {parsing ? 'Parsing...' : 'Parse and Prefill'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeBuilder 