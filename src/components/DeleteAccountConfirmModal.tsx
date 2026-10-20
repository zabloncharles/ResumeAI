import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import bunny1 from "../bunny1.png";

const CONFIRM_PHRASE = "DELETE";

type DeleteAccountConfirmModalProps = {
  isOpen: boolean;
  confirming: boolean;
  requiresPassword: boolean;
  usesGoogleSignIn: boolean;
  errorMessage?: string;
  onClose: () => void;
  onConfirm: (password?: string) => void;
};

export default function DeleteAccountConfirmModal({
  isOpen,
  confirming,
  requiresPassword,
  usesGoogleSignIn,
  errorMessage,
  onClose,
  onConfirm,
}: DeleteAccountConfirmModalProps) {
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPhrase("");
      setPassword("");
    }
  }, [isOpen]);

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

  const passwordOk = !requiresPassword || password.trim().length > 0;
  const canConfirm =
    phrase === CONFIRM_PHRASE && passwordOk && !confirming;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] isolate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
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
            <img src={bunny1} alt="" className="h-12 w-12 mx-auto mb-4" />
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <ExclamationTriangleIcon
                className="h-6 w-6 text-red-600 dark:text-red-400"
                aria-hidden
              />
            </div>
            <h3
              id="delete-account-title"
              className="text-2xl font-semibold leading-6 text-zinc-900 dark:text-zinc-100"
            >
              Delete your account?
            </h3>
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400 text-left">
              This permanently removes your profile, resumes, study sets, and
              related data from your account. It cannot be undone.
            </p>
            {usesGoogleSignIn ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400 text-left">
                You may be asked to sign in with Google again to confirm.
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400 text-left">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-5 text-left">
            <label
              htmlFor="delete-account-confirm"
              className="block text-sm font-medium text-gray-700 dark:text-zinc-300"
            >
              Type{" "}
              <span className="font-mono text-red-600 dark:text-red-400">
                {CONFIRM_PHRASE}
              </span>{" "}
              to confirm
            </label>
            <input
              id="delete-account-confirm"
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              disabled={confirming}
              autoComplete="off"
              className="mt-2 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50"
              placeholder={CONFIRM_PHRASE}
            />
          </div>

          {requiresPassword ? (
            <div className="mt-4 text-left">
              <label
                htmlFor="delete-account-password"
                className="block text-sm font-medium text-gray-700 dark:text-zinc-300"
              >
                Current password
              </label>
              <input
                id="delete-account-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={confirming}
                autoComplete="current-password"
                className="mt-2 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50"
              />
            </div>
          ) : null}

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
              disabled={!canConfirm}
              onClick={() =>
                onConfirm(requiresPassword ? password : undefined)
              }
              className="inline-flex w-full sm:w-auto justify-center rounded-md border border-transparent bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? "Deleting account…" : "Delete account"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
