import { useEffect, useState } from "react";
import ResumePdfPreview from "./ResumePdfPreview";
import ResumeTemplateMiniPreview from "./resume/ResumeTemplateMiniPreview";
import {
  ivyForTemplate,
  ivyLeagueOptions,
  normalizeTemplateId,
  templatesForIvy,
  RESUME_TEMPLATE_STORAGE_KEY,
  type IvyLeagueId,
  type ResumeTemplateId,
} from "../constants/resumeTemplates";

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

const TemplatesPage = () => {
  const [selectedIvy, setSelectedIvy] = useState<IvyLeagueId>("harvard");
  const [selectedId, setSelectedId] = useState<ResumeTemplateId>("harvard-mcs");

  useEffect(() => {
    const stored = localStorage.getItem(RESUME_TEMPLATE_STORAGE_KEY);
    if (stored) {
      const normalized = normalizeTemplateId(stored);
      setSelectedId(normalized);
      setSelectedIvy(ivyForTemplate(normalized));
    }
  }, []);

  const ivyTemplates = templatesForIvy(selectedIvy);
  const selected =
    ivyTemplates.find((t) => t.id === selectedId) ?? ivyTemplates[0];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 bg-white dark:bg-zinc-950 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">
            Ivy resume templates
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Preview updates live. Your choice syncs with the resume builder.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            School
          </span>
          <select
            value={selectedIvy}
            onChange={(e) => {
              const nextIvy = e.target.value as IvyLeagueId;
              const options = templatesForIvy(nextIvy);
              setSelectedIvy(nextIvy);
              const nextId = options[0]?.id ?? "harvard-mcs";
              setSelectedId(nextId);
              localStorage.setItem(RESUME_TEMPLATE_STORAGE_KEY, nextId);
            }}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm"
          >
            {ivyLeagueOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {ivyTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            className={`cursor-pointer rounded-xl border-2 p-2 flex flex-col items-center transition-all text-left w-full ${
              selected.id === template.id
                ? "border-[#16aeac] shadow-lg"
                : "border-zinc-200 dark:border-zinc-700 hover:border-[#16aeac]"
            }`}
            onClick={() => {
              setSelectedId(template.id);
              localStorage.setItem(RESUME_TEMPLATE_STORAGE_KEY, template.id);
            }}
          >
            <div className="w-full aspect-[8.5/11] rounded-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden mb-2 shadow-sm bg-white relative">
              <ResumeTemplateMiniPreview
                template={template.id}
                fullName={sampleResume.personalInfo.fullName}
                className="absolute inset-0"
              />
            </div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">
              {template.name}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 text-center px-2">
              {template.description}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-900/50">
        <ResumePdfPreview resumeData={sampleResume} template={selected.id} />
      </div>
    </div>
  );
};

export default TemplatesPage;
