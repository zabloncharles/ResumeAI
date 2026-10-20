declare module "@shared/ivyAiGuidelines.js" {
  export function normalizeTemplateId(value: string): string;
  export function buildIvyAiSystemMessage(templateId?: string): string;
  export function buildIvySectionPrompt(
    templateId: string,
    section: string | null,
    profession: string
  ): string;
  export function buildParseResumeSystemMessage(templateId?: string): string;
  export function buildParseResumeUserPrompt(
    schema: string,
    text: string,
    templateId?: string
  ): string;
  export function ivyAiGuidanceLabel(templateId?: string): string;
}

declare module "@shared/normalizeParsedResume.js" {
  export function normalizeParsedResume(raw: unknown): import("./types/ResumeData").ResumeData;
  export function resumeDataJsonSchemaDescription(): string;
}
