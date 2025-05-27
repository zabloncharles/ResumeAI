import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link
} from '@react-pdf/renderer';
import type { ResumeData } from './ResumeBuilder';

// Remove or comment out the custom font registration
// Font.register({ family: 'Times New Roman', src: 'https://fonts.cdnfonts.com/s/15010/TimesNewRoman.woff', fontStyle: 'normal', fontWeight: 'normal' });

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    padding: 40,
    backgroundColor: '#fff',
    color: '#111',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Times-Roman',
    textAlign: 'center',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 6,
    width: '100%',
    alignSelf: 'center',
  },
  contact: {
    fontSize: 12,
    marginBottom: 12,
    fontFamily: 'Times-Roman',
    textAlign: 'center',
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#888',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 0,
    fontFamily: 'Times-Roman',
    // No border for summary
  },
  jobTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Times-Roman',
  },
  jobMeta: {
    fontStyle: 'italic',
    fontSize: 12,
    fontFamily: 'Times-Roman',
  },
  expCompany: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
  },
  expDates: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
  },
  bulletList: {
    marginLeft: 16,
    marginTop: 4,
  },
  bullet: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'Times-Roman',
  },
});

// Helper to display month and year correctly in PDF
const formatMonthYear = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  if (!year || !month) return '';
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

interface ResumePDFProps {
  resumeData: ResumeData;
}

const ResumePDF: React.FC<ResumePDFProps> = ({ resumeData }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{resumeData.personalInfo.fullName}</Text>
        <View style={styles.divider} />
        <Text style={styles.contact}>
          Location: {resumeData.personalInfo.location} | Phone: {resumeData.personalInfo.phone} | Email: {resumeData.personalInfo.email}
          {resumeData.websites && resumeData.websites.length > 0 ? ` | Portfolio: ${resumeData.websites[0].url}` : ''}
        </Text>
      </View>
      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text>{resumeData.profile}</Text>
      </View>
      {/* Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>
        {resumeData.experience.map((exp, idx) => (
          <View key={idx} style={{ marginBottom: 8 }}>
            <Text>
              <Text style={styles.jobTitle}>{exp.company}</Text>
              {exp.company && exp.title ? ', ' : ''}
              <Text style={styles.jobMeta}>{exp.title ? ` ${exp.title}` : ''}</Text>
              {(exp.company || exp.title) ? ' | ' : ''}
              <Text style={styles.expDates}>
                {exp.startDate ? formatMonthYear(exp.startDate) : ''}
                {exp.endDate ? ` - ${formatMonthYear(exp.endDate)}` : ''}
              </Text>
            </Text>
            {exp.description.length > 0 && (
              <View style={styles.bulletList}>
                {exp.description.map((bullet: string, bidx: number) => (
                  <Text key={bidx} style={styles.bullet}>• {bullet}</Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
      {/* Education */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        {resumeData.education.map((edu, idx) => (
          <View key={idx} style={{ marginBottom: 8 }}>
            <Text>
              <Text style={styles.jobTitle}>{edu.degree}</Text>
              {edu.degree && edu.school ? ', ' : ''}
              <Text style={styles.expCompany}>{edu.school}</Text>
              {' | '}
              <Text style={styles.expDates}>{edu.startDate ? formatMonthYear(edu.startDate) : ''}{edu.endDate ? ` - ${formatMonthYear(edu.endDate)}` : ''}</Text>
            </Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default ResumePDF; 