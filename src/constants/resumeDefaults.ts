import type { ResumeData } from "../types/ResumeData";

export const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: "David St. Peter",
    title: "UX Designer",
    email: "david@example.com",
    phone: "+000 123 456 789",
    location: "New York, USA",
    photo: "",
  },
  profile: "",
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
