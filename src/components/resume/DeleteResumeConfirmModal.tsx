import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import bunny1 from "../../bunny1.png";

type DeleteResumeConfirmModalProps = {
  isOpen: boolean;
  resumeTitle: string;
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteResumeConfirmModal({
  isOpen,
  resumeTitle,
  confirming,
  onClose,
  onConfirm,
}: DeleteResumeConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirming) onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [confirming, isOpen, onClose]);

  if (!isOpen) return null;

  const label = resumeTitle.trim() || "Untitled resume";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] isolate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-resume-title"
    >
      <div
        className="absolute inset-0 bg-black/55 dark:bg-black/75 backdrop-blur-xl"
        onClick={confirming ? undefined : onClose}
        aria-hidden
      />
      <div className="relative z-10 flex min-h-full w-full items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6">
        <div
          className="relative w-full max-w-md mx-auto my-auto p-6 bg-white/95 dark:bg-zinc-950/95 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-zinc-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <img
              src={bunny1}
              alt=""
              className="h-12 w-12 mx-auto mb-4"
            />
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <ExclamationTriangleIcon
                className="h-6 w-6 text-red-600 dark:text-red-400"
                aria-hidden
              />
            </div>
            <h3
              id="delete-resume-title"
              className="text-2xl font-semibold leading-6 text-zinc-900 dark:text-zinc-100"
            >
              Delete resume?
            </h3>
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {label}
              </span>{" "}
              will be removed from your account. Local drafts for this resume on
              this device will also be cleared.
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              disabled={confirming}
              onClick={onClose}
              className="inline-flex w-full sm:w-auto justify-center rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-200 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#16aeac] focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={confirming}
              onClick={onConfirm}
              className="inline-flex w-full sm:w-auto justify-center rounded-md border border-transparent bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50"
            >
              {confirming ? "Deleting…" : "Delete resume"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
