import type { ResumeData } from "../types/ResumeData";

interface ResumePreviewProps {
  resumeData: ResumeData;
  template?: string; // 'modern', 'executive', 'minimal', 'creative', etc.
}

// Helper to display month and year correctly in preview
const formatMonthYear = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  if (!year || !month) return "";
  // Month is 1-based, so subtract 1 for Date constructor
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

const ResumePreview = ({
  resumeData,
  template = "modern",
}: ResumePreviewProps) => {
  if (template === "minimal") {
    return (
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div
          className="p-10 mx-auto"
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            color: "#222",
            maxWidth: "8.5in",
            width: "100%",
            minHeight: "10.5in",
            boxSizing: "border-box",
            margin: "0 auto",
            background: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight uppercase text-gray-900 mb-1">
                {resumeData.personalInfo.fullName}
              </h1>
              <div className="text-base tracking-wide text-gray-500 uppercase">
                {resumeData.personalInfo.title}
              </div>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-right text-gray-600 space-y-1">
              <div>{resumeData.personalInfo.email}</div>
              <div>{resumeData.personalInfo.phone}</div>
              <div>{resumeData.personalInfo.location}</div>
              {resumeData.websites && resumeData.websites.length > 0 && (
                <div>{resumeData.websites[0].url}</div>
              )}
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />
          {/* Professional Summary */}
          <div className="mb-8">
            <div className="text-lg font-semibold tracking-widest text-gray-700 uppercase mb-2">
              Professional Summary
            </div>
            <div className="text-base text-gray-800 mb-4">
              {resumeData.profile}
            </div>
            {/* Skills Grid */}
            {resumeData.skills && resumeData.skills.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
                {resumeData.skills.map((skill: string, idx: number) => (
                  <div
                    key={idx}
                    className="py-1 px-2 bg-gray-100 rounded text-center"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />
          {/* Work Experience */}
          <div className="mb-8">
            <div className="text-lg font-semibold tracking-widest text-gray-700 uppercase mb-2">
              Work Experience
            </div>
            {resumeData.experience.map((exp: any, idx: number) => (
              <div key={idx} className="mb-6">
                <div className="font-semibold text-gray-900 text-base uppercase">
                  {exp.title}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {exp.company} | {formatMonthYear(exp.startDate)}
                  {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ""}
                </div>
                {exp.description.length > 0 && (
                  <ul className="list-disc ml-6 mt-1 text-gray-800 text-sm space-y-1">
                    {exp.description.map((bullet: string, bidx: number) => (
                      <li key={bidx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />
          {/* Education */}
          <div className="mb-2">
            <div className="text-lg font-semibold tracking-widest text-gray-700 uppercase mb-2">
              Education
            </div>
            {resumeData.education.map((edu: any, idx: number) => (
              <div key={idx} className="mb-2 text-sm flex justify-between">
                <div className="font-semibold text-gray-900">{edu.degree}</div>
                <div className="text-gray-600">
                  {edu.school} | {formatMonthYear(edu.startDate)}
                  {edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (template === "executive") {
    return (
      <div className="rounded-xl border border-gray-300 bg-gray-50 overflow-hidden">
        <div
          className="p-10 mx-auto"
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            color: "#222",
            maxWidth: "8.5in",
            width: "100%",
            minHeight: "10.5in",
            boxSizing: "border-box",
            margin: "0 auto",
            background: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-widest uppercase text-center text-gray-900 mb-2">
              {resumeData.personalInfo.fullName}
            </h1>
            <div className="text-base tracking-widest text-center text-gray-500 uppercase mb-4">
              {resumeData.personalInfo.title}
            </div>
            {/* Contact Info Bar */}
            <div className="text-sm text-center text-gray-600 mb-4">
              {resumeData.personalInfo.phone} | {resumeData.personalInfo.email}{" "}
              | {resumeData.personalInfo.location}
              {resumeData.websites && resumeData.websites.length > 0 && (
                <> | {resumeData.websites[0].url}</>
              )}
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />
          {/* Professional Overview */}
          <div className="mb-8">
            <div className="text-lg font-semibold tracking-widest text-gray-700 uppercase mb-2">
              Professional Overview
            </div>
            <div className="text-base text-gray-800 mb-4">
              {resumeData.profile}
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />
          {/* Work Experience */}
          <div className="mb-8">
            <div className="text-lg font-semibold tracking-widest text-gray-700 uppercase mb-2">
              Work Experience
            </div>
            {resumeData.experience.map((exp: any, idx: number) => (
              <div key={idx} className="mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900">
                      {exp.company}
                    </span>
                    {exp.company && exp.title ? ", " : ""}
                    <span className="text-gray-700">
                      {exp.location ? exp.location : ""}
                      {exp.location && exp.title ? ", " : ""}
                      {exp.title}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    {exp.startDate ? formatMonthYear(exp.startDate) : ""}
                    {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ""}
                  </div>
                </div>
                {exp.description.length > 0 && (
                  <ul className="list-disc ml-6 mt-1 text-gray-800 text-sm space-y-1">
                    {exp.description.map((bullet: string, bidx: number) => (
                      <li key={bidx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />
          {/* Education */}
          <div className="mb-2">
            <div className="text-lg font-semibold tracking-widest text-gray-700 uppercase mb-2">
              Education
            </div>
            {resumeData.education.map((edu: any, idx: number) => (
              <div key={idx} className="mb-2 text-sm flex justify-between">
                <div className="font-semibold text-gray-900">
                  {edu.school} | {edu.degree}
                </div>
                <div className="text-gray-600">
                  {edu.startDate ? formatMonthYear(edu.startDate) : ""}
                  {edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (template === "modern") {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div
          className="p-10 mx-auto"
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            color: "#222",
            maxWidth: "8.5in",
            width: "100%",
            minHeight: "10.5in",
            boxSizing: "border-box",
            margin: "0 auto",
            background: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-widest uppercase text-center text-gray-900 mb-2">
              {resumeData.personalInfo.fullName}
            </h1>
            <div className="text-base tracking-widest text-center text-gray-500 uppercase mb-4">
              {resumeData.personalInfo.title}
            </div>
            {/* Contact Info Bar */}
            <div className="text-sm text-center text-gray-600 mb-4">
              {resumeData.personalInfo.phone} | {resumeData.personalInfo.email}{" "}
              | {resumeData.personalInfo.location}
              {resumeData.websites && resumeData.websites.length > 0 && (
                <> | {resumeData.websites[0].url}</>
              )}
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />
          {/* Professional Summary */}
          <div className="mb-8">
            <div className="text-lg font-semibold tracking-widest text-gray-900 uppercase mb-2">
              Professional Summary
            </div>
            <div className="text-base text-gray-800 mb-4">
              {resumeData.profile}
            </div>
            {/* Skills Grid */}
            {resumeData.skills && resumeData.skills.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
                {resumeData.skills.map((skill: string, idx: number) => (
                  <div
                    key={idx}
                    className="py-1 px-2 bg-gray-100 rounded text-center"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />
          {/* Work Experience */}
          <div className="mb-8">
            <div className="text-lg font-semibold tracking-widest text-gray-900 uppercase mb-2">
              Work Experience
            </div>
            {resumeData.experience.map((exp: any, idx: number) => (
              <div key={idx} className="mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900">
                      {exp.company}
                    </span>
                    {exp.company && exp.title ? ", " : ""}
                    <span className="text-gray-700">
                      {exp.location ? exp.location : ""}
                      {exp.location && exp.title ? ", " : ""}
                      {exp.title}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    {exp.startDate ? formatMonthYear(exp.startDate) : ""}
                    {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ""}
                  </div>
                </div>
                {exp.description.length > 0 && (
                  <ul className="list-disc ml-6 mt-1 text-gray-800 text-sm space-y-1">
                    {exp.description.map((bullet: string, bidx: number) => (
                      <li key={bidx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />
          {/* Education */}
          <div className="mb-2">
            <div className="text-lg font-semibold tracking-widest text-gray-900 uppercase mb-2">
              Education
            </div>
            {resumeData.education.map((edu: any, idx: number) => (
              <div key={idx} className="mb-2 text-sm flex justify-between">
                <div className="font-semibold text-gray-900">
                  {edu.school} | {edu.degree}
                </div>
                <div className="text-gray-600">
                  {edu.startDate ? formatMonthYear(edu.startDate) : ""}
                  {edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (template === "creative") {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div
          className="p-10 mx-auto"
          style={{
            fontFamily: "Inter, Arial, sans-serif",
            color: "#222",
            maxWidth: "8.5in",
            width: "100%",
            minHeight: "10.5in",
            boxSizing: "border-box",
            margin: "0 auto",
            background: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-widest uppercase text-center text-gray-900 mb-2">
              {resumeData.personalInfo.fullName}
            </h1>
            <div className="text-base tracking-widest text-center text-gray-500 uppercase mb-4">
              {resumeData.personalInfo.title}
            </div>
            {/* Contact Info Bar */}
            <div className="text-sm text-center text-gray-600 mb-4">
              {resumeData.personalInfo.phone} | {resumeData.personalInfo.email}{" "}
              | {resumeData.personalInfo.location}
              {resumeData.websites && resumeData.websites.length > 0 && (
                <> | {resumeData.websites[0].url}</>
              )}
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-gray-300 my-6" />
          {/* Profile */}
          <div className="mb-8">
            <div className="text-lg font-semibold tracking-widest text-gray-500 uppercase mb-2">
              Profile
            </div>
            <div className="text-base text-gray-800 mb-4">
              {resumeData.profile}
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-gray-300 my-6" />
          {/* Work Experience */}
          <div className="mb-8">
            <div className="text-lg font-semibold tracking-widest text-gray-500 uppercase mb-2">
              Work Experience
            </div>
            {resumeData.experience.map((exp: any, idx: number) => (
              <div key={idx} className="mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900">
                      {exp.company}
                    </span>
                    {exp.company && exp.title ? " | " : ""}
                    <span className="text-gray-700 uppercase">{exp.title}</span>
                  </div>
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    {exp.startDate ? formatMonthYear(exp.startDate) : ""}
                    {exp.endDate ? ` – ${formatMonthYear(exp.endDate)}` : ""}
                  </div>
                </div>
                {exp.description.length > 0 && (
                  <ul className="list-disc ml-6 mt-1 text-gray-800 text-sm space-y-1">
                    {exp.description.map((bullet: string, bidx: number) => (
                      <li key={bidx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {/* Divider */}
          <div className="border-t border-gray-300 my-6" />
          {/* Skills */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <div className="mb-8">
              <div className="text-lg font-semibold tracking-widest text-gray-500 uppercase mb-2">
                Skills
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
                {resumeData.skills.map((skill: string, idx: number) => (
                  <div
                    key={idx}
                    className="py-1 px-2 bg-gray-100 rounded text-center"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Divider */}
          <div className="border-t border-gray-300 my-6" />
          {/* Education */}
          <div className="mb-2">
            <div className="text-lg font-semibold tracking-widest text-gray-500 uppercase mb-2">
              Education
            </div>
            {resumeData.education.map((edu: any, idx: number) => (
              <div key={idx} className="mb-2 text-sm flex justify-between">
                <div className="font-semibold text-gray-900">
                  {edu.degree} | {edu.school}
                </div>
                <div className="text-gray-600">
                  {edu.startDate ? formatMonthYear(edu.startDate) : ""}
                  {edu.endDate ? ` – ${formatMonthYear(edu.endDate)}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        template === "modern"
          ? "bg-white border-gray-200"
          : template === "executive"
          ? "bg-gray-50 border-gray-300"
          : template === "minimal"
          ? "bg-white border-gray-100"
          : template === "creative"
          ? "bg-gradient-to-br from-pink-50 to-yellow-50 border-pink-200"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h2
          className={`text-lg font-semibold ${
            template === "creative" ? "text-pink-700" : "text-gray-900"
          }`}
        >
          Resume Preview
        </h2>
      </div>
      <div className="p-4">
        <div
          className="mx-auto bg-white"
          style={{
            width: "100%",
            maxWidth: "11in",
            aspectRatio: "8.5/11",
            minHeight: "0",
            height: "auto",
            boxSizing: "border-box",
            borderRadius: "0.5rem",
            transform: "scale(0.95)",
            transformOrigin: "top center",
          }}
        >
          <div
            className="p-8"
            style={{
              fontFamily: "Times New Roman, Times, serif",
              color: "#111",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1
                className={`text-2xl font-bold mb-2 text-center ${
                  template === "modern"
                    ? "text-[#16aeac]"
                    : template === "creative"
                    ? "text-pink-600"
                    : "text-gray-900"
                }`}
              >
                {resumeData.personalInfo.fullName}
              </h1>
              <div className="w-full border-t border-t-[1px] border-gray-300 my-2" />
              <div
                className={`text-sm text-center pb-2 border-b-2 mb-6 ${
                  template === "creative"
                    ? "text-pink-400 border-pink-400"
                    : "text-gray-800 border-gray-400"
                }`}
              >
                Location: {resumeData.personalInfo.location} | Phone:{" "}
                {resumeData.personalInfo.phone} | Email:{" "}
                {resumeData.personalInfo.email}
                {resumeData.websites && resumeData.websites.length > 0
                  ? ` | Portfolio: ${resumeData.websites[0].url}`
                  : ""}
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6">
              <div
                className={`text-base font-bold pb-1 mb-2 ${
                  template === "creative" ? "text-pink-700" : "text-gray-900"
                }`}
              >
                Summary
              </div>
              <div className="text-sm">{resumeData.profile}</div>
            </div>

            {/* Experience */}
            <div className="mb-6">
              <div
                className={`text-base font-bold border-b-2 pb-1 mb-2 ${
                  template === "creative"
                    ? "border-pink-400 text-pink-700"
                    : "border-gray-400 text-gray-900"
                }`}
              >
                Experience
              </div>
              {resumeData.experience.map((exp: any, idx: number) => (
                <div key={idx} className="mb-4">
                  <div className="text-sm">
                    <span className="font-bold">{exp.company}</span>
                    {exp.company && exp.title ? ", " : ""}
                    <span className="italic">{exp.title}</span>
                    {exp.company || exp.title ? " | " : ""}
                    <span>
                      {exp.startDate ? formatMonthYear(exp.startDate) : ""}
                      {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ""}
                    </span>
                  </div>
                  {exp.description.length > 0 && (
                    <ul className="list-disc ml-6 mt-1 text-sm">
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
              <div
                className={`text-base font-bold border-b-2 pb-1 mb-2 ${
                  template === "creative"
                    ? "border-pink-400 text-pink-700"
                    : "border-gray-400 text-gray-900"
                }`}
              >
                Education
              </div>
              {resumeData.education.map((edu: any, idx: number) => (
                <div key={idx} className="mb-2 text-sm">
                  <span className="font-bold">{edu.degree}</span>
                  {edu.degree && edu.school ? ", " : ""}
                  <span>{edu.school}</span>
                  {edu.school ? " | " : ""}
                  <span>
                    {formatMonthYear(edu.startDate)}
                    {edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
