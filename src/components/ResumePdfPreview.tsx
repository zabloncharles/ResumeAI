import { useEffect, useMemo, useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import ResumePDF from "./ResumePDF";
import type { ResumeData } from "../types/ResumeData";

type ResumePdfPreviewProps = {
  resumeData: ResumeData;
  template?: string;
  className?: string;
};

export default function ResumePdfPreview({
  resumeData,
  template = "modern",
  className = "",
}: ResumePdfPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const blobUrlRef = useRef<string | null>(null);

  const documentNode = useMemo(
    () => <ResumePDF resumeData={resumeData} template={template} />,
    [resumeData, template]
  );

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const blob = await pdf(documentNode).toBlob();
          if (cancelled) return;
          const nextUrl = URL.createObjectURL(blob);
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          blobUrlRef.current = nextUrl;
          setUrl(nextUrl);
        } catch (e) {
          if (!cancelled) {
            setError(
              e instanceof Error ? e.message : "Could not render PDF preview"
            );
            setUrl(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [documentNode]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full aspect-[8.5/11] bg-white overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-sm text-zinc-500">
            Updating preview…
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}
        {url && (
          <iframe
            title="Resume PDF preview"
            src={url}
            className="absolute inset-0 h-full w-full border-0 bg-white"
          />
        )}
      </div>
    </div>
  );
}
