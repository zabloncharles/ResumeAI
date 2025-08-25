import { useState } from "react";
import ResumePreview from "./ResumePreview";

// Sample resume data
const sampleResume = {
  personalInfo: {
    fullName: "Jane Doe",
    title: "UX Designer",
    email: "jane@example.com",
    phone: "+123 456 7890",
    location: "San Francisco, USA",
    photo: "https://ui-avatars.com/api/?name=Jane+Doe&size=128",
  },
  profile:
    "Creative UX Designer with 5+ years of experience designing engaging, user-friendly interfaces for web and mobile apps.",
  experience: [
    {
      title: "Lead UX Designer",
      company: "Tech Co",
      startDate: "2019-01",
      endDate: "2023-06",
      description: [
        "Led a team of 4 designers to deliver a new SaaS platform UI",
        "Improved user retention by 30% through usability testing and redesigns",
      ],
    },
  ],
  education: [
    {
      degree: "BSc in Design",
      school: "Stanford University",
      startDate: "2014",
      endDate: "2018",
    },
  ],
  websites: [
    {
      label: "Portfolio",
      url: "https://janedoe.com",
    },
  ],
};

const resumeTemplates = [
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
    description: "Simple and elegant design that lets your experience shine",
    preview: "/templates/minimal.png",
  },
  {
    id: "creative",
    name: "Creative Professional",
    description: "Modern design with a creative touch",
    preview: "/templates/creative.png",
  },
];

const TemplatesPage = () => {
  const [selected, setSelected] = useState(resumeTemplates[0]);

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Choose a Resume Template
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {resumeTemplates.map((template) => (
          <div
            key={template.id}
            className={`cursor-pointer rounded-xl border-2 p-2 flex flex-col items-center transition-all ${
              selected.id === template.id
                ? "border-[#16aeac] shadow-lg"
                : "border-gray-200 hover:border-[#16aeac]"
            }`}
            onClick={() => setSelected(template)}
          >
            <img
              src={template.preview}
              alt={template.name}
              className="w-full h-24 object-cover rounded mb-2"
            />
            <div className="font-medium text-gray-900 text-sm mb-1">
              {template.name}
            </div>
            <div className="text-xs text-gray-500 text-center">
              {template.description}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <ResumePreview resumeData={sampleResume} template={selected.id} />
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
