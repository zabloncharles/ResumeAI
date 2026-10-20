import {
  ivyPdfLayoutKind,
  isIvyChooserTemplate,
  normalizeTemplateId,
  templateDisplayName,
  type IvyPdfLayoutKind,
} from "../../constants/resumeTemplates";

type ResumeTemplateSkeletonProps = {
  template?: string;
  fullName: string;
  className?: string;
};

type SectionSpec = {
  id: string;
  kind: "block" | "bullets" | "job-split" | "job-line";
  lines?: number;
};

function resolveLayoutKind(template?: string): IvyPdfLayoutKind | "legacy" {
  const id = normalizeTemplateId(template ?? "harvard-mcs");
  if (isIvyChooserTemplate(id)) {
    return ivyPdfLayoutKind(id);
  }
  return "legacy";
}

const SECTION_ORDERS: Record<IvyPdfLayoutKind | "legacy", SectionSpec[]> = {
  "harvard-mcs": [
    { id: "edu", kind: "block", lines: 2 },
    { id: "exp", kind: "job-split", lines: 3 },
    { id: "skills", kind: "block", lines: 1 },
    { id: "summary", kind: "block", lines: 2 },
  ],
  "harvard-industry": [
    { id: "exp", kind: "job-split", lines: 3 },
    { id: "edu", kind: "block", lines: 2 },
    { id: "skills", kind: "block", lines: 1 },
    { id: "summary", kind: "block", lines: 2 },
  ],
  princeton: [
    { id: "edu", kind: "block", lines: 2 },
    { id: "exp", kind: "job-line", lines: 3 },
    { id: "skills", kind: "bullets", lines: 3 },
  ],
  "yale-summary-first": [
    { id: "summary", kind: "block", lines: 2 },
    { id: "edu", kind: "block", lines: 2 },
    { id: "exp", kind: "job-split", lines: 3 },
    { id: "skills", kind: "block", lines: 1 },
  ],
  "yale-technical": [
    { id: "summary", kind: "block", lines: 2 },
    { id: "edu", kind: "block", lines: 2 },
    { id: "skills", kind: "bullets", lines: 3 },
    { id: "exp", kind: "job-split", lines: 3 },
  ],
  "brown-no-summary": [
    { id: "edu", kind: "block", lines: 2 },
    { id: "exp", kind: "job-split", lines: 3 },
    { id: "skills", kind: "block", lines: 1 },
  ],
  legacy: [
    { id: "summary", kind: "block", lines: 2 },
    { id: "exp", kind: "job-split", lines: 3 },
    { id: "edu", kind: "block", lines: 2 },
  ],
};

function SectionHeading() {
  return (
    <div
      className="h-[3px] w-10 bg-zinc-400/90 dark:bg-zinc-500 rounded-sm mb-1.5 mt-2 first:mt-0"
      aria-hidden
    />
  );
}

function PlaceholderLine({ width = "88%" }: { width?: string }) {
  return (
    <div
      className="h-[2px] bg-zinc-200 dark:bg-zinc-700 rounded-full mb-[3px]"
      style={{ width }}
      aria-hidden
    />
  );
}

function BlockSection({ lines }: { lines: number }) {
  return (
    <div className="mb-1">
      <SectionHeading />
      {Array.from({ length: lines }).map((_, i) => (
        <PlaceholderLine key={i} width={`${78 + (i % 2) * 12}%`} />
      ))}
    </div>
  );
}

function BulletLines({ lines }: { lines: number }) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex gap-1 mb-[3px] pl-0.5">
          <div className="w-1 h-1 mt-[1px] shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <PlaceholderLine width={`${72 + (i % 3) * 8}%`} />
        </div>
      ))}
    </>
  );
}

function BulletSection({ lines }: { lines: number }) {
  return (
    <div className="mb-1">
      <SectionHeading />
      <BulletLines lines={lines} />
    </div>
  );
}

function JobSplitSection({ lines }: { lines: number }) {
  return (
    <div className="mb-1">
      <SectionHeading />
      <PlaceholderLine width="55%" />
      <PlaceholderLine width="42%" />
      <PlaceholderLine width="38%" />
      <BulletLines lines={lines} />
    </div>
  );
}

function JobLineSection({ lines }: { lines: number }) {
  return (
    <div className="mb-1">
      <SectionHeading />
      <PlaceholderLine width="92%" />
      <BulletLines lines={lines} />
    </div>
  );
}

function RenderSection({ spec }: { spec: SectionSpec }) {
  switch (spec.kind) {
    case "block":
      return <BlockSection lines={spec.lines ?? 2} />;
    case "bullets":
      return <BulletSection lines={spec.lines ?? 3} />;
    case "job-split":
      return <JobSplitSection lines={spec.lines ?? 3} />;
    case "job-line":
      return <JobLineSection lines={spec.lines ?? 3} />;
    default:
      return null;
  }
}

export default function ResumeTemplateSkeleton({
  template,
  fullName,
  className = "",
}: ResumeTemplateSkeletonProps) {
  const layoutKind = resolveLayoutKind(template);
  const sections = SECTION_ORDERS[layoutKind];
  const displayName = fullName.trim() || "Your Name";
  const displayTemplateName = templateDisplayName(template);

  return (
    <div
      className={`relative w-full h-full bg-white dark:bg-zinc-950 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 p-[8%] flex flex-col text-left font-serif">
        <p className="text-[10px] leading-tight font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
          {displayName}
        </p>
        <p className="text-[9px] leading-snug font-medium text-[#16aeac] dark:text-[#5ececc] mt-1 line-clamp-2">
          {displayTemplateName}
        </p>
        <div className="mt-1 space-y-0">
          <PlaceholderLine width="70%" />
        </div>
        <div className="flex-1 min-h-0 mt-1 overflow-hidden">
          {sections.map((spec) => (
            <RenderSection key={spec.id} spec={spec} />
          ))}
        </div>
      </div>
    </div>
  );
}
