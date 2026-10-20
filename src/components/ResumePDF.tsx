import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResumeData } from "../types/ResumeData";
import {
  RESUME_BODY_FONT_SIZE,
  RESUME_PAGE_PADDING,
  RESUME_SECTION_FONT_SIZE,
} from "../constants/resumePdfLayout";
import {
  ivyPdfLayoutKind,
  normalizeTemplateId,
} from "../constants/resumeTemplates";

// Remove or comment out the custom font registration
// Font.register({ family: 'Times New Roman', src: 'https://fonts.cdnfonts.com/s/15010/TimesNewRoman.woff', fontStyle: 'normal', fontWeight: 'normal' });

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: RESUME_BODY_FONT_SIZE,
    padding: RESUME_PAGE_PADDING,
    backgroundColor: "#fff",
    color: "#111",
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: "Times-Roman",
    textAlign: "center",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginVertical: 6,
    width: "100%",
    alignSelf: "center",
  },
  contact: {
    fontSize: 12,
    marginBottom: 12,
    fontFamily: "Times-Roman",
    textAlign: "center",
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: "#888",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 0,
    fontFamily: "Times-Roman",
    // No border for summary
  },
  jobTitle: {
    fontWeight: "bold",
    fontSize: 13,
    fontFamily: "Times-Roman",
  },
  jobMeta: {
    fontSize: 12,
    fontFamily: "Times-Roman",
  },
  expCompany: {
    fontSize: 12,
    fontFamily: "Times-Roman",
  },
  expDates: {
    fontSize: 12,
    fontFamily: "Times-Roman",
  },
  bulletList: {
    marginLeft: 16,
    marginTop: 4,
  },
  bullet: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: "Times-Roman",
  },
});

// Helper to display month and year correctly in PDF
const formatMonthYear = (dateStr: string): string => {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  if (/^\d{4}$/.test(trimmed)) return trimmed;
  const [year, month] = trimmed.split("-");
  if (!year) return "";
  if (!month) return year;
  const date = new Date(Number(year), Number(month) - 1);
  if (Number.isNaN(date.getTime())) return trimmed;
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

const formatEducationDates = (startDate: string, endDate: string): string => {
  const start = formatMonthYear(startDate);
  const end = formatMonthYear(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
};

const experienceDateLine = (startDate: string, endDate: string) => {
  const start = startDate ? formatMonthYear(startDate) : "";
  const end = endDate ? formatMonthYear(endDate) : "";
  if (start && end) return `${start} - ${end}`;
  if (start) return `${start} - Present`;
  return end;
};

const BULLET_INDENT = 14;

const ResumeBulletList = ({
  items,
  fontSize = RESUME_BODY_FONT_SIZE,
  color = "#222",
}: {
  items: string[];
  fontSize?: number;
  color?: string;
}) => {
  if (!items.length) return null;
  return (
    <View style={{ marginTop: 4 }}>
      {items.map((item, idx) => (
        <View
          key={`bullet-${idx}`}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 2,
          }}
        >
          <Text
            style={{
              width: BULLET_INDENT,
              fontSize,
              color,
              lineHeight: 1.4,
            }}
          >
            •
          </Text>
          <Text
            wrap
            style={{
              flex: 1,
              fontSize,
              color,
              lineHeight: 1.4,
            }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

const classicSectionTitle = {
  fontSize: RESUME_SECTION_FONT_SIZE,
  fontWeight: 700 as const,
  marginBottom: 6,
  marginTop: 10,
  textTransform: "uppercase" as const,
  color: "#111",
};

const PlainSkillsBlock = ({
  skills,
  titleColor = "#111",
  sectionTitle = "Skills",
}: {
  skills?: string[];
  titleColor?: string;
  sectionTitle?: string;
}) => {
  if (!skills || skills.length === 0) return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          ...classicSectionTitle,
          color: titleColor,
        }}
      >
        {sectionTitle}
      </Text>
      <Text wrap style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#222" }}>
        {skills.join(" • ")}
      </Text>
    </View>
  );
};

const PrincetonExperienceJobs = ({
  experience,
}: {
  experience: ResumeData["experience"];
}) => (
  <>
    {experience.map((exp, idx) => (
      <View
        wrap
        key={`exp-princeton-${idx}`}
        style={{ marginBottom: 8, fontSize: RESUME_BODY_FONT_SIZE, color: "#111" }}
      >
        {idx === 0 ? (
          <Text style={classicSectionTitle}>Work Experience</Text>
        ) : null}
        <Text wrap>
          <Text style={{ fontWeight: 700 }}>
            {exp.company} – {exp.title}
          </Text>
          {"  "}
          <Text style={{ color: "#444" }}>
            {experienceDateLine(exp.startDate, exp.endDate)}
          </Text>
        </Text>
        <ResumeBulletList items={exp.description} />
      </View>
    ))}
  </>
);

const PrincetonSkillsBlock = ({
  skills,
  sectionTitle = "Skills",
}: {
  skills?: string[];
  sectionTitle?: string;
}) => {
  if (!skills || skills.length === 0) return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={classicSectionTitle}>{sectionTitle}</Text>
      <ResumeBulletList items={skills} />
    </View>
  );
};

const ClassicExperienceJobs = ({
  experience,
  sectionTitle = "Experience",
}: {
  experience: ResumeData["experience"];
  sectionTitle?: string;
}) => (
  <>
    {experience.map((exp, idx) => (
      <View
        wrap
        key={`exp-classic-${idx}`}
        style={{ marginBottom: 8, fontSize: RESUME_BODY_FONT_SIZE, color: "#111" }}
      >
        {idx === 0 ? (
          <Text style={classicSectionTitle}>{sectionTitle}</Text>
        ) : null}
        <Text style={{ fontWeight: 700 }}>{exp.company}</Text>
        <Text>{exp.title}</Text>
        <Text style={{ color: "#444" }}>
          {experienceDateLine(exp.startDate, exp.endDate)}
        </Text>
        <ResumeBulletList items={exp.description} />
      </View>
    ))}
  </>
);

const ModernExperienceJobs = ({
  experience,
}: {
  experience: ResumeData["experience"];
}) => (
  <>
    {experience.map((exp, idx) => (
      <View
        wrap
        key={`exp-modern-${idx}`}
        style={{ marginBottom: 14, fontSize: 12, color: "#111" }}
      >
        {idx === 0 ? (
          <Text
            style={{
              fontSize: 15,
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Work Experience
          </Text>
        ) : null}
        <Text style={{ fontWeight: 700 }}>{exp.company}</Text>
        <Text style={{ fontWeight: 400, color: "#444" }}>, {exp.title}</Text>
        <Text style={{ fontSize: 11, color: "#888" }}>
          {experienceDateLine(exp.startDate, exp.endDate)}
        </Text>
        <ResumeBulletList items={exp.description} fontSize={12} />
      </View>
    ))}
  </>
);

const ExecutiveExperienceJobs = ({
  experience,
}: {
  experience: ResumeData["experience"];
}) => (
  <>
    {experience.map((exp, idx) => (
      <View
        wrap
        key={`exp-executive-${idx}`}
        style={{ marginBottom: 10, fontSize: 10, color: "#111" }}
      >
        {idx === 0 ? (
          <Text
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#666",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Work Experience
          </Text>
        ) : null}
        <Text
          style={{
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          {exp.company}
        </Text>
        <Text style={{ color: "#888" }}>
          {experienceDateLine(exp.startDate, exp.endDate)}
        </Text>
        <Text style={{ color: "#444" }}>{exp.title}</Text>
        <ResumeBulletList items={exp.description} fontSize={10} />
      </View>
    ))}
  </>
);

const MinimalExperienceJobs = ({
  experience,
}: {
  experience: ResumeData["experience"];
}) => (
  <>
    {experience.map((exp, idx) => (
      <View
        wrap
        key={`exp-minimal-${idx}`}
        style={{ marginBottom: 10, fontSize: 10, color: "#111" }}
      >
        {idx === 0 ? (
          <Text
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#666",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Work Experience
          </Text>
        ) : null}
        <Text
          style={{
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          {exp.title}
        </Text>
        <Text style={{ color: "#666" }}>{exp.company}</Text>
        <Text style={{ color: "#888" }}>
          {experienceDateLine(exp.startDate, exp.endDate)}
        </Text>
        <ResumeBulletList items={exp.description} fontSize={10} />
      </View>
    ))}
  </>
);

const CreativeExperienceJobs = ({
  experience,
}: {
  experience: ResumeData["experience"];
}) => (
  <>
    {experience.map((exp, idx) => (
      <View
        wrap
        key={`exp-creative-${idx}`}
        style={{ marginBottom: 10, fontSize: 10, color: "#111" }}
      >
        {idx === 0 ? (
          <Text
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#bbb",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Work Experience
          </Text>
        ) : null}
        <Text
          style={{
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          {exp.company}
        </Text>
        <Text style={{ color: "#888" }}>
          {experienceDateLine(exp.startDate, exp.endDate)}
        </Text>
        <Text style={{ color: "#444" }}>{exp.title}</Text>
        <ResumeBulletList items={exp.description} fontSize={10} />
      </View>
    ))}
  </>
);

const DefaultExperienceJobs = ({
  experience,
  titleColor,
}: {
  experience: ResumeData["experience"];
  titleColor: string;
}) => (
  <>
    {experience.map((exp, idx) => (
      <View
        wrap
        key={`exp-default-${idx}`}
        style={{ marginBottom: 8, fontSize: 10, color: "#111" }}
      >
        {idx === 0 ? (
          <Text
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: titleColor,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Work Experience
          </Text>
        ) : null}
        <Text style={{ fontWeight: 700, fontSize: 11 }}>{exp.company}</Text>
        <Text style={{ color: "#888" }}>
          {experienceDateLine(exp.startDate, exp.endDate)}
        </Text>
        <Text style={{ color: "#444" }}>{exp.title}</Text>
        <ResumeBulletList items={exp.description} fontSize={10} />
      </View>
    ))}
  </>
);

interface ResumePDFProps {
  resumeData: ResumeData;
  template?: string;
}

const ResumePDF: React.FC<ResumePDFProps> = ({
  resumeData,
  template = "modern",
}) => {
  const layout = normalizeTemplateId(template);
  const pdfKind = ivyPdfLayoutKind(layout);

  const ivyContactLine = [
    resumeData.personalInfo.location,
    resumeData.personalInfo.phone,
    resumeData.personalInfo.email,
    resumeData.websites?.[0]?.url,
  ]
    .filter((part) => part && String(part).trim())
    .join(" • ");

  const IvyHeader = () => (
    <>
      <Text style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
        {resumeData.personalInfo.fullName}
      </Text>
      {resumeData.personalInfo.title?.trim() ? (
        <Text
          style={{
            fontSize: RESUME_BODY_FONT_SIZE,
            marginBottom: 4,
            color: "#222",
          }}
        >
          {resumeData.personalInfo.title}
        </Text>
      ) : null}
      {ivyContactLine ? (
        <Text
          style={{
            fontSize: RESUME_BODY_FONT_SIZE,
            marginBottom: 12,
            color: "#222",
          }}
        >
          {ivyContactLine}
        </Text>
      ) : null}
    </>
  );

  const IvyEducation = () => (
    <>
      <Text style={classicSectionTitle}>Education</Text>
      {resumeData.education.map((edu, idx) => (
        <Text
          wrap
          key={`edu-ivy-${idx}`}
          style={{ fontSize: RESUME_BODY_FONT_SIZE, marginBottom: 6 }}
        >
          <Text style={{ fontWeight: 700 }}>{edu.school}</Text>
          {"\n"}
          {edu.degree}
          {"    "}
          {formatEducationDates(edu.startDate, edu.endDate)}
        </Text>
      ))}
    </>
  );

  const IvySummary = () =>
    resumeData.profile?.trim() ? (
      <View>
        <Text style={classicSectionTitle}>Summary</Text>
        <Text wrap style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#222" }}>
          {resumeData.profile}
        </Text>
      </View>
    ) : null;

  if (pdfKind === "harvard-mcs") {
    return (
      <Document>
        <Page wrap size="LETTER" style={styles.page}>
          <IvyHeader />
          <IvyEducation />
          <ClassicExperienceJobs experience={resumeData.experience} />
          <PlainSkillsBlock skills={resumeData.skills} />
          <IvySummary />
        </Page>
      </Document>
    );
  }

  if (pdfKind === "harvard-industry") {
    return (
      <Document>
        <Page wrap size="LETTER" style={styles.page}>
          <IvyHeader />
          <ClassicExperienceJobs experience={resumeData.experience} />
          <IvyEducation />
          <PlainSkillsBlock skills={resumeData.skills} />
          <IvySummary />
        </Page>
      </Document>
    );
  }

  if (pdfKind === "yale-summary-first") {
    return (
      <Document>
        <Page wrap size="LETTER" style={styles.page}>
          <IvyHeader />
          <IvySummary />
          <IvyEducation />
          <ClassicExperienceJobs
            experience={resumeData.experience}
            sectionTitle="Work Experience"
          />
          <PlainSkillsBlock skills={resumeData.skills} />
        </Page>
      </Document>
    );
  }

  if (pdfKind === "yale-technical") {
    return (
      <Document>
        <Page wrap size="LETTER" style={styles.page}>
          <IvyHeader />
          <IvySummary />
          <IvyEducation />
          <PrincetonSkillsBlock
            skills={resumeData.skills}
            sectionTitle="Technical Skills"
          />
          <ClassicExperienceJobs
            experience={resumeData.experience}
            sectionTitle="Work Experience"
          />
        </Page>
      </Document>
    );
  }

  if (pdfKind === "brown-no-summary") {
    return (
      <Document>
        <Page wrap size="LETTER" style={styles.page}>
          <IvyHeader />
          <IvyEducation />
          <ClassicExperienceJobs
            experience={resumeData.experience}
            sectionTitle="Professional Experience"
          />
          <PlainSkillsBlock skills={resumeData.skills} />
        </Page>
      </Document>
    );
  }

  if (pdfKind === "princeton") {
    return (
      <Document>
        <Page wrap size="LETTER" style={styles.page}>
          <IvyHeader />
          <IvyEducation />
          <PrincetonExperienceJobs experience={resumeData.experience} />
          <PrincetonSkillsBlock skills={resumeData.skills} />
          <IvySummary />
        </Page>
      </Document>
    );
  }

  if (layout === "modern") {
    return (
      <Document>
        <Page wrap size="LETTER" style={{ ...styles.page, fontFamily: "Helvetica" }}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 8,
                color: "#16aeac",
                textTransform: "uppercase",
              }}
            >
              {resumeData.personalInfo.fullName}
            </Text>
            <Text
              style={{
                fontSize: 12,
                textAlign: "center",
                color: "#888",
                marginTop: 10,
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              {resumeData.personalInfo.title}
            </Text>
            <Text
              style={{
                fontSize: RESUME_BODY_FONT_SIZE,
                textAlign: "center",
                color: "#888",
                marginBottom: 12,
              }}
            >
              {resumeData.personalInfo.phone} | {resumeData.personalInfo.email}{" "}
              | {resumeData.personalInfo.location}
              {resumeData.websites && resumeData.websites.length > 0
                ? ` | ${resumeData.websites[0].url}`
                : ""}
            </Text>
          </View>
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              marginBottom: 24,
              width: "100%",
            }}
          />
          {/* Professional Summary */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#111",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Professional Summary
            </Text>
            <Text
              wrap
              style={{
                fontSize: 12,
                color: "#111",
                marginBottom: 0,
                textAlign: "left",
              }}
            >
              {resumeData.profile}
            </Text>
          </View>
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              marginBottom: 24,
              width: "100%",
            }}
          />
          {/* Work Experience */}
          <ModernExperienceJobs experience={resumeData.experience} />
          <View style={{ marginBottom: 14 }} />
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              marginBottom: 24,
              width: "100%",
            }}
          />
          {/* Education */}
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111",
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              Education
            </Text>
            {resumeData.education.map((edu: any, idx: number) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>
                  {edu.school} | {edu.degree}
                </Text>
                <Text style={{ fontSize: 12, color: "#888" }}>
                  {formatEducationDates(edu.startDate, edu.endDate) || "—"}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  }

  if (layout === "executive") {
    return (
      <Document>
        <Page wrap size="LETTER" style={styles.page}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 2,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              {resumeData.personalInfo.fullName}
            </Text>
            <Text
              style={{
                fontSize: 12,
                textAlign: "center",
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {resumeData.personalInfo.title}
            </Text>
            <Text
              style={{
                fontSize: RESUME_BODY_FONT_SIZE,
                textAlign: "center",
                color: "#888",
                marginBottom: 8,
              }}
            >
              {resumeData.personalInfo.phone} | {resumeData.personalInfo.email}{" "}
              | {resumeData.personalInfo.location}
              {resumeData.websites && resumeData.websites.length > 0
                ? ` | ${resumeData.websites[0].url}`
                : ""}
            </Text>
          </View>
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          {/* Professional Overview */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Professional Overview
            </Text>
            <Text wrap style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#222", marginBottom: 8 }}>
              {resumeData.profile}
            </Text>
          </View>
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          {/* Work Experience */}
          <ExecutiveExperienceJobs experience={resumeData.experience} />
          <View style={{ marginBottom: 12 }} />
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          {/* Education */}
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Education
            </Text>
            {resumeData.education.map((edu: any, idx: number) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontSize: RESUME_BODY_FONT_SIZE, fontWeight: 700, color: "#111" }}>
                  {edu.degree}
                </Text>
                <Text style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#666" }}>
                  {edu.school} |{" "}
                  {formatEducationDates(edu.startDate, edu.endDate)}
                </Text>
              </View>
            ))}
          </View>
          <PlainSkillsBlock skills={resumeData.skills} titleColor="#666" />
        </Page>
      </Document>
    );
  }
  if (layout === "minimal") {
    return (
      <Document>
        <Page wrap size="LETTER" style={{ ...styles.page, fontFamily: "Helvetica" }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 32,
            }}
          >
            {/* Left: Name and Title */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {resumeData.personalInfo.fullName}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  marginBottom: 0,
                }}
              >
                {resumeData.personalInfo.title}
              </Text>
            </View>
            {/* Right: Contact Info */}
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#6b7280", marginBottom: 4 }}>
                {resumeData.personalInfo.email}
              </Text>
              <Text style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#6b7280", marginBottom: 4 }}>
                {resumeData.personalInfo.phone}
              </Text>
              <Text style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#6b7280", marginBottom: 4 }}>
                {resumeData.personalInfo.location}
              </Text>
              {resumeData.websites && resumeData.websites.length > 0 && (
                <Text style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#6b7280" }}>
                  {resumeData.websites[0].url}
                </Text>
              )}
            </View>
          </View>
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          {/* Professional Summary */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Professional Summary
            </Text>
            <Text wrap style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#222", marginBottom: 8 }}>
              {resumeData.profile}
            </Text>
            <PlainSkillsBlock skills={resumeData.skills} titleColor="#666" />
          </View>
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          {/* Work Experience */}
          <MinimalExperienceJobs experience={resumeData.experience} />
          <View style={{ marginBottom: 12 }} />
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          {/* Education */}
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Education
            </Text>
            {resumeData.education.map((edu: any, idx: number) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>
                  {edu.degree}
                </Text>
                <Text style={{ fontSize: 10, color: "#666" }}>
                  {edu.school} |{" "}
                  {formatEducationDates(edu.startDate, edu.endDate)}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  }
  if (layout === "creative") {
    return (
      <Document>
        <Page wrap size="LETTER" style={styles.page}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 2,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              {resumeData.personalInfo.fullName}
            </Text>
            <Text
              style={{
                fontSize: 12,
                textAlign: "center",
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {resumeData.personalInfo.title}
            </Text>
            <Text
              style={{
                fontSize: RESUME_BODY_FONT_SIZE,
                textAlign: "center",
                color: "#888",
                marginBottom: 8,
              }}
            >
              {resumeData.personalInfo.phone} | {resumeData.personalInfo.email}{" "}
              | {resumeData.personalInfo.location}
              {resumeData.websites && resumeData.websites.length > 0
                ? ` | ${resumeData.websites[0].url}`
                : ""}
            </Text>
          </View>
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#bbb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          {/* Profile */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#bbb",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Profile
            </Text>
            <Text wrap style={{ fontSize: RESUME_BODY_FONT_SIZE, color: "#222", marginBottom: 8 }}>
              {resumeData.profile}
            </Text>
          </View>
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#bbb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          {/* Work Experience */}
          <CreativeExperienceJobs experience={resumeData.experience} />
          <View style={{ marginBottom: 12 }} />
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#bbb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          <PlainSkillsBlock skills={resumeData.skills} titleColor="#bbb" />
          {/* Divider */}
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "#bbb",
              marginVertical: 10,
              width: "100%",
            }}
          />
          {/* Education */}
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#bbb",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Education
            </Text>
            {resumeData.education.map((edu: any, idx: number) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>
                  {edu.degree}
                </Text>
                <Text style={{ fontSize: 10, color: "#666" }}>
                  {edu.school} |{" "}
                  {formatEducationDates(edu.startDate, edu.endDate)}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  }

  // Common header
  const Header = (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        {resumeData.personalInfo.fullName}
      </Text>
      <Text
        style={{
          fontSize: 12,
          textAlign: "center",
          color: "#666",
          marginBottom: 8,
        }}
      >
        {resumeData.personalInfo.title}
      </Text>
      <Text
        style={{
          fontSize: 10,
          textAlign: "center",
          color: "#888",
          marginBottom: 8,
        }}
      >
        {resumeData.personalInfo.phone} | {resumeData.personalInfo.email} |{" "}
        {resumeData.personalInfo.location}
        {resumeData.websites && resumeData.websites.length > 0
          ? ` | ${resumeData.websites[0].url}`
          : ""}
      </Text>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "#ccc",
          marginVertical: 6,
          width: "100%",
        }}
      />
    </View>
  );

  // Section title style by template
  const sectionTitleStyle = (color = "#111") => ({
    fontSize: 13,
    fontWeight: 700,
    color,
    marginBottom: 6,
    marginTop: 0,
    textTransform: "uppercase" as const,
  });

  // Divider
  const Divider = (color = "#ccc") => (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: color,
        marginVertical: 10,
        width: "100%",
      }}
    />
  );

  // Skills grid
  const hasSkills = Boolean(
    resumeData.skills && resumeData.skills.length > 0
  );

  // Experience section
  const Experience = (
    <>
      <DefaultExperienceJobs
        experience={resumeData.experience}
        titleColor={template === "modern" ? "#111" : "#666"}
      />
      <View style={{ marginBottom: 10 }} />
    </>
  );

  // Education section
  const Education = (
    <View style={{ marginBottom: 8 }}>
      <Text style={sectionTitleStyle("#666")}>{"Education".toUpperCase()}</Text>
      {resumeData.education.map((edu: any, idx: number) => (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 700, color: "#111" }}>
            {edu.degree}
          </Text>
          <Text style={{ fontSize: 10, color: "#888" }}>
            {formatEducationDates(edu.startDate, edu.endDate)}
          </Text>
        </View>
      ))}
    </View>
  );

  // Profile/Summary section
  const Profile = (
    <View style={{ marginBottom: 18 }}>
      <Text style={sectionTitleStyle("#666")}>
        {(template === "creative"
          ? "Profile"
          : template === "executive"
          ? "Professional Overview"
          : "Professional Summary"
        ).toUpperCase()}
      </Text>
      <Text style={{ fontSize: 11, color: "#222", marginBottom: 4 }}>
        {resumeData.profile}
      </Text>
    </View>
  );

  // Render by template
  return (
    <Document>
      <Page wrap size="LETTER" style={styles.page}>
        {Header}
        {Divider(template === "creative" ? "#bbb" : "#ccc")}
        {Profile}
        {Divider(template === "creative" ? "#bbb" : "#ccc")}
        {Experience}
        {Divider(template === "creative" ? "#bbb" : "#ccc")}
        {hasSkills && (
          <PlainSkillsBlock skills={resumeData.skills} titleColor="#666" />
        )}
        {hasSkills && Divider(template === "creative" ? "#bbb" : "#ccc")}
        {Education}
      </Page>
    </Document>
  );
};

export default ResumePDF;
