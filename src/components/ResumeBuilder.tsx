import { useState } from 'react'
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
  CpuChipIcon
} from '@heroicons/react/24/outline'
import html2pdf from 'html2pdf.js'

interface ResumeData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    photo: string;
  };
  profile: string;
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    startDate: string;
    endDate: string;
  }>;
  websites: Array<{
    label: string;
    url: string;
  }>;
}

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

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

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

const ResumeBuilder = () => {
  const [activeSection, setActiveSection] = useState('personal')
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const [showTemplates, setShowTemplates] = useState(false)

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

  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case 'executive':
        return `
          .resume-container {
            font-family: 'Georgia', serif;
          }
          h1 {
            font-size: 2rem !important;
            color: #1a365d !important;
          }
          h2 {
            font-size: 1.25rem !important;
            color: #2c5282 !important;
            border-bottom: 2px solid #2c5282 !important;
            text-transform: none !important;
            letter-spacing: normal !important;
          }
          .profile-section {
            margin-bottom: 2rem !important;
          }
          .contact-info {
            font-style: italic;
          }
        `;
      case 'minimal':
        return `
          .resume-container {
            font-family: 'Inter', sans-serif;
          }
          h1 {
            font-size: 1.75rem !important;
            font-weight: 500 !important;
          }
          h2 {
            font-size: 0.875rem !important;
            color: #4a5568 !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .profile-image {
            display: none;
          }
          .profile-info {
            text-align: center;
          }
        `;
      case 'creative':
        return `
          .resume-container {
            font-family: 'Poppins', sans-serif;
          }
          h1 {
            font-size: 2.25rem !important;
            background: linear-gradient(to right, #3182ce, #2b6cb0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          h2 {
            font-size: 1rem !important;
            color: #2b6cb0 !important;
            border-bottom: none !important;
            position: relative !important;
          }
          h2::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 2rem;
            height: 2px;
            background: #3182ce;
          }
          .profile-section {
            position: relative;
          }
          .profile-image {
            border: 3px solid #3182ce;
          }
        `;
      default: // modern
        return '';
    }
  };

  const handlePrint = () => {
    // Create a temporary container for the resume content
    const element = document.createElement('div');
    element.innerHTML = `
      <div class="resume-container">
        <style>
          @page {
            size: letter;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.5;
            color: #111827;
            background: white;
          }
          .resume-container {
            width: 8.5in;
            min-height: 11in;
            padding: 1in;
            position: relative;
          }
          .profile-section {
            margin-bottom: 1.5rem;
            page-break-inside: avoid;
            text-align: center;
          }
          .profile-info h1 {
            font-size: 2rem;
            font-weight: 600;
            color: #111827;
            margin: 0;
            line-height: 1.2;
            margin-bottom: 0.5rem;
            text-align: center;
          }
          .contact-info {
            color: #4B5563;
            font-size: 0.875rem;
            line-height: 1.5;
            text-align: center;
          }
          section {
            margin-bottom: 1.25rem;
            page-break-inside: avoid;
          }
          section:last-child {
            margin-bottom: 0;
          }
          h2 {
            font-size: 0.875rem;
            font-weight: 600;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
          }
          h3 {
            font-size: 1rem;
            font-weight: 500;
            color: #111827;
            margin: 0;
          }
          p {
            font-size: 0.875rem;
            color: #4B5563;
            margin: 0;
            line-height: 1.5;
          }
          .experience-item, .education-item {
            margin-bottom: 1rem;
            page-break-inside: avoid;
          }
          .experience-item:last-child, .education-item:last-child {
            margin-bottom: 0;
          }
          .experience-header, .education-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
          }
          .date {
            color: #6B7280;
            font-size: 0.875rem;
            white-space: nowrap;
          }
          ul {
            margin: 0.5rem 0 0;
            padding-left: 1.25rem;
            list-style-type: none;
          }
          li {
            font-size: 0.875rem;
            color: #4B5563;
            margin-bottom: 0.25rem;
            line-height: 1.5;
            position: relative;
            padding-left: 1rem;
          }
          li:before {
            content: "•";
            position: absolute;
            left: 0;
            top: 0;
            color: #4B5563;
            display: inline-block;
            width: 1rem;
            font-size: 0.875rem;
          }
          li:last-child {
            margin-bottom: 0;
          }
          ${getTemplateStyles()}
        </style>
        <div class="profile-section">
          <div class="profile-info">
            <h1>${resumeData.personalInfo.fullName}</h1>
            <div class="contact-info">
              ${resumeData.personalInfo.location} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.email}
            </div>
          </div>
        </div>

        <section>
          <h2>Profile</h2>
          <p>${resumeData.profile}</p>
        </section>

        <section>
          <h2>Experience</h2>
          ${resumeData.experience.map(exp => `
            <div class="experience-item">
              <div class="experience-header">
                <div>
                  <h3>${exp.title}</h3>
                  <p>${exp.company}</p>
                </div>
                <span class="date">
                  ${exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - 
                  ${exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}
                </span>
              </div>
              ${exp.description.length > 0 ? `
                <ul>
                  ${exp.description.map(bullet => `
                    <li>${bullet}</li>
                  `).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </section>

        <section>
          <h2>Education</h2>
          ${resumeData.education.map(edu => `
            <div class="education-item">
              <div class="education-header">
                <div>
                  <h3>${edu.degree}</h3>
                  <p>${edu.school}</p>
                </div>
                <span class="date">${edu.startDate} - ${edu.endDate}</span>
              </div>
            </div>
          `).join('')}
        </section>
      </div>
    `;

    // Configure pdf options
    const opt = {
      margin: 0,
      filename: `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        letterRendering: true,
        useCORS: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait'
      }
    };

    // Generate and download PDF
    html2pdf().set(opt).from(element).save();
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
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.fullName}
                  onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.title}
                  onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  className="resume-input mt-1"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                />
              </div>
            </div>
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
            {resumeData.experience.map((exp, expIndex) => (
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
                    {exp.description.map((bullet, bulletIndex) => (
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
            {resumeData.education.map((edu, index) => (
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <CpuChipIcon className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ResumeAI
                </span>
              </div>
              <div className="hidden md:flex space-x-4">
                <Link to="/" className="text-gray-600 hover:text-gray-900 flex items-center space-x-2">
                  <HomeIcon className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                <span className="text-gray-900 font-medium flex items-center space-x-2">
                  <DocumentIcon className="h-5 w-5" />
                  <span>My Resume</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-gray-600">
                <CloudIcon className="h-5 w-5" />
                <span>Saved</span>
              </button>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <ArrowRightIcon className="h-5 w-5 text-gray-600" />
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <PrinterIcon className="h-5 w-5" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="w-[8.5in] h-[11in] mx-auto overflow-auto bg-white shadow-lg">
                <style>{getTemplateStyles()}</style>
                <div className="p-8">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">{resumeData.personalInfo.fullName}</h1>
                    <div className="text-gray-600 text-sm text-center">
                      {resumeData.personalInfo.location} | {resumeData.personalInfo.phone} | {resumeData.personalInfo.email}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">Profile</h2>
                      <p className="text-gray-600 text-sm leading-relaxed">{resumeData.profile}</p>
                    </section>

                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">Experience</h2>
                      <div className="space-y-4">
                        {resumeData.experience.map((exp, index) => (
                          <div key={index} className="mb-4">
                            <div className="flex justify-between mb-2">
                              <div>
                                <h3 className="text-base font-medium">{exp.title}</h3>
                                <p className="text-gray-600 text-sm">{exp.company}</p>
                              </div>
                              <p className="text-gray-600 text-sm">
                                {exp.startDate && new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}
                              </p>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                              {exp.description.map((bullet, bulletIndex) => (
                                <li key={bulletIndex}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h2 className="text-xl font-semibold text-gray-900 mb-3">Education</h2>
                      <div className="space-y-3">
                        {resumeData.education.map((edu, index) => (
                          <div key={index}>
                            <div className="flex justify-between mb-1">
                              <div>
                                <h3 className="text-base font-medium">{edu.degree}</h3>
                                <p className="text-gray-600 text-sm">{edu.school}</p>
                              </div>
                              <p className="text-gray-600 text-sm">{edu.startDate} - {edu.endDate}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeBuilder 