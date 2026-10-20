import type { ResumeData } from "./ResumeData";

export type ResumeDocument = ResumeData & {
  title?: string;
  selectedTemplate?: string;
  lastUpdated?: string;
  userId?: string;
  updatedBy?: string;
};

export type ResumeListItem = {
  id: string;
  title: string;
  subtitle: string;
  lastUpdated?: string;
  selectedTemplate?: string;
};
