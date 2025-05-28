export interface ResumeData {
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