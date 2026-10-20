import ResumeTemplateSkeleton from "./ResumeTemplateSkeleton";

type ResumeTemplateMiniPreviewProps = {
  template?: string;
  fullName: string;
  className?: string;
};

export default function ResumeTemplateMiniPreview({
  template = "harvard-mcs",
  fullName,
  className = "",
}: ResumeTemplateMiniPreviewProps) {
  return (
    <ResumeTemplateSkeleton
      template={template}
      fullName={fullName}
      className={className}
    />
  );
}
