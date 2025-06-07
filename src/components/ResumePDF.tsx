import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResumeData } from "../types/ResumeData";

// Remove or comment out the custom font registration
// Font.register({ family: 'Times New Roman', src: 'https://fonts.cdnfonts.com/s/15010/TimesNewRoman.woff', fontStyle: 'normal', fontWeight: 'normal' });

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    padding: 40,
    backgroundColor: "#fff",
    color: "#111",
    lineHeight: 1.5,
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
    fontStyle: "italic",
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
  const [year, month] = dateStr.split("-");
  if (!year || !month) return "";
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
};

interface ResumePDFProps {
  resumeData: ResumeData;
  template?: string;
}

const ResumePDF: React.FC<ResumePDFProps> = ({
  resumeData,
  template = "modern",
}) => {
  if (template === "modern") {
    return (
      <Document>
        <Page size="LETTER" style={{ ...styles.page, fontFamily: "Helvetica" }}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: 2,
                marginBottom: 8,
                color: "#111",
                textTransform: "uppercase",
              }}
            >
              {resumeData.personalInfo.fullName}
            </Text>
            <Text
              style={{
                fontSize: 15,
                textAlign: "center",
                letterSpacing: 3,
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
                fontSize: 11,
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
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#111",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Professional Summary
            </Text>
            <Text
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
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#111",
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              Work Experience
            </Text>
            {resumeData.experience.map((exp: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 18 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: 2,
                  }}
                >
                  <Text
                    style={{ fontWeight: 700, fontSize: 12, color: "#111" }}
                  >
                    {exp.company}
                    <Text style={{ fontWeight: 400, color: "#444" }}>
                      , {exp.title}
                    </Text>
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: "#888", textAlign: "right" }}
                  >
                    {exp.startDate ? formatMonthYear(exp.startDate) : ""}
                    {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ""}
                  </Text>
                </View>
                {exp.description.length > 0 && (
                  <View style={{ marginLeft: 12, marginTop: 2 }}>
                    {exp.description.map((bullet: string, bidx: number) => (
                      <Text
                        key={bidx}
                        style={{
                          fontSize: 12,
                          marginBottom: 2,
                          color: "#111",
                          textAlign: "left",
                        }}
                      >
                        • {bullet}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
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
          {/* Education */}
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 2,
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
                  {edu.startDate || edu.endDate
                    ? `${edu.startDate ? formatMonthYear(edu.startDate) : ""}${
                        edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ""
                      }`
                    : "-"}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  }

  if (template === "executive") {
    return (
      <Document>
        <Page size="LETTER" style={styles.page}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: 2,
                marginBottom: 2,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              {resumeData.personalInfo.fullName}
            </Text>
            <Text
              style={{
                fontSize: 13,
                textAlign: "center",
                letterSpacing: 1,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
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
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Professional Overview
            </Text>
            <Text style={{ fontSize: 11, color: "#222", marginBottom: 8 }}>
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
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Work Experience
            </Text>
            {resumeData.experience.map((exp: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#111",
                      textTransform: "uppercase",
                    }}
                  >
                    {exp.company}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#888" }}>
                    {exp.startDate ? formatMonthYear(exp.startDate) : ""}
                    {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ""}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#444",
                    fontStyle: "italic",
                    marginBottom: 1,
                  }}
                >
                  {exp.title}
                </Text>
                {exp.description.length > 0 && (
                  <View style={{ marginLeft: 12, marginTop: 2 }}>
                    {exp.description.map((bullet: string, bidx: number) => (
                      <Text
                        key={bidx}
                        style={{ fontSize: 10, marginBottom: 2 }}
                      >
                        • {bullet}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
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
          {/* Education */}
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
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
                  {edu.startDate ? formatMonthYear(edu.startDate) : ""}
                  {edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  }
  if (template === "minimal") {
    return (
      <Document>
        <Page size="LETTER" style={{ ...styles.page, fontFamily: "Helvetica" }}>
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
                  fontSize: 32,
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
                  fontSize: 18,
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
              <Text style={{ fontSize: 15, color: "#6b7280", marginBottom: 4 }}>
                {resumeData.personalInfo.email}
              </Text>
              <Text style={{ fontSize: 15, color: "#6b7280", marginBottom: 4 }}>
                {resumeData.personalInfo.phone}
              </Text>
              <Text style={{ fontSize: 15, color: "#6b7280", marginBottom: 4 }}>
                {resumeData.personalInfo.location}
              </Text>
              {resumeData.websites && resumeData.websites.length > 0 && (
                <Text style={{ fontSize: 15, color: "#6b7280" }}>
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
                letterSpacing: 2,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Professional Summary
            </Text>
            <Text style={{ fontSize: 11, color: "#222", marginBottom: 8 }}>
              {resumeData.profile}
            </Text>
            {/* Skills Grid */}
            {resumeData.skills && resumeData.skills.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                {resumeData.skills.map((skill: string, idx: number) => (
                  <View
                    key={idx}
                    style={{
                      minWidth: "22%",
                      marginBottom: 4,
                      marginRight: 8,
                      backgroundColor: "#f3f4f6",
                      borderRadius: 4,
                      paddingVertical: 2,
                      paddingHorizontal: 6,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#444" }}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}
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
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Work Experience
            </Text>
            {resumeData.experience.map((exp: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#111",
                    textTransform: "uppercase",
                    marginBottom: 1,
                  }}
                >
                  {exp.title}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontSize: 10, color: "#666" }}>
                    {exp.company}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#888" }}>
                    {exp.startDate ? formatMonthYear(exp.startDate) : ""}
                    {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ""}
                  </Text>
                </View>
                {exp.description.length > 0 && (
                  <View style={{ marginLeft: 12, marginTop: 2 }}>
                    {exp.description.map((bullet: string, bidx: number) => (
                      <Text
                        key={bidx}
                        style={{ fontSize: 10, marginBottom: 2 }}
                      >
                        • {bullet}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
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
          {/* Education */}
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
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
                  {edu.startDate ? formatMonthYear(edu.startDate) : ""}
                  {edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  }
  if (template === "creative") {
    return (
      <Document>
        <Page size="LETTER" style={styles.page}>
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: 2,
                marginBottom: 2,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              {resumeData.personalInfo.fullName}
            </Text>
            <Text
              style={{
                fontSize: 13,
                textAlign: "center",
                letterSpacing: 1,
                color: "#666",
                marginBottom: 6,
                textTransform: "uppercase",
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
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#bbb",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Profile
            </Text>
            <Text style={{ fontSize: 11, color: "#222", marginBottom: 8 }}>
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
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#bbb",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Work Experience
            </Text>
            {resumeData.experience.map((exp: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#111",
                      textTransform: "uppercase",
                    }}
                  >
                    {exp.company}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#888" }}>
                    {exp.startDate ? formatMonthYear(exp.startDate) : ""}
                    {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ""}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#444",
                    fontStyle: "italic",
                    marginBottom: 1,
                  }}
                >
                  {exp.title}
                </Text>
                {exp.description.length > 0 && (
                  <View style={{ marginLeft: 12, marginTop: 2 }}>
                    {exp.description.map((bullet: string, bidx: number) => (
                      <Text
                        key={bidx}
                        style={{ fontSize: 10, marginBottom: 2 }}
                      >
                        • {bullet}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
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
          {/* Skills */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <View style={{ marginBottom: 18 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "#bbb",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                Skills
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                {resumeData.skills.map((skill: string, idx: number) => (
                  <View
                    key={idx}
                    style={{
                      minWidth: "22%",
                      marginBottom: 4,
                      marginRight: 8,
                      backgroundColor: "#f3f4f6",
                      borderRadius: 4,
                      paddingVertical: 2,
                      paddingHorizontal: 6,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#444" }}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
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
                letterSpacing: 2,
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
                  {edu.startDate ? formatMonthYear(edu.startDate) : ""}
                  {edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ""}
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
          letterSpacing: 2,
          marginBottom: 4,
        }}
      >
        {resumeData.personalInfo.fullName}
      </Text>
      <Text
        style={{
          fontSize: 12,
          textAlign: "center",
          letterSpacing: 2,
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
    letterSpacing: 2,
    color,
    marginBottom: 6,
    marginTop: 0,
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
  const Skills = resumeData.skills && resumeData.skills.length > 0 && (
    <View style={{ marginBottom: 18 }}>
      <Text style={sectionTitleStyle("#666")}>{"Skills".toUpperCase()}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {resumeData.skills.map((skill: string, idx: number) => (
          <View
            key={idx}
            style={{ minWidth: "40%", marginBottom: 4, marginRight: 12 }}
          >
            <Text style={{ fontSize: 10, color: "#222" }}>{skill}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Experience section
  const Experience = (
    <View style={{ marginBottom: 18 }}>
      <Text style={sectionTitleStyle(template === "modern" ? "#111" : "#666")}>
        {"Work Experience".toUpperCase()}
      </Text>
      {resumeData.experience.map((exp: any, idx: number) => (
        <View key={idx} style={{ marginBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Text style={{ fontWeight: 700, fontSize: 11, color: "#111" }}>
              {exp.company}
            </Text>
            <Text style={{ fontSize: 10, color: "#888" }}>
              {exp.startDate ? formatMonthYear(exp.startDate) : ""}
              {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ""}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              color: "#444",
              fontStyle: "italic",
              marginBottom: 2,
            }}
          >
            {exp.title}
          </Text>
          {exp.description.length > 0 && (
            <View style={{ marginLeft: 12, marginTop: 2 }}>
              {exp.description.map((bullet: string, bidx: number) => (
                <Text key={bidx} style={{ fontSize: 10, marginBottom: 2 }}>
                  • {bullet}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
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
            {edu.startDate ? formatMonthYear(edu.startDate) : ""}
            {edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ""}
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
      <Page size="LETTER" style={styles.page}>
        {Header}
        {Divider(template === "creative" ? "#bbb" : "#ccc")}
        {Profile}
        {Divider(template === "creative" ? "#bbb" : "#ccc")}
        {Experience}
        {Divider(template === "creative" ? "#bbb" : "#ccc")}
        {Skills}
        {Skills && Divider(template === "creative" ? "#bbb" : "#ccc")}
        {Education}
      </Page>
    </Document>
  );
};

export default ResumePDF;
