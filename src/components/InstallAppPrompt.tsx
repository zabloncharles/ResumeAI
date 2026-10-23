import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const DISMISSED_KEY = "brightfolio-install-prompt-dismissed";

function isRunningStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isRunningStandalone() || localStorage.getItem(DISMISSED_KEY) === "1") {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallEvent(event);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    if (ios) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
  };

  return (
    <aside className="fixed inset-x-3 bottom-4 z-[70] mx-auto max-w-md rounded-2xl border border-teal-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-teal-900 dark:bg-zinc-900/95 pwa-safe-bottom">
      <div className="flex items-start gap-3">
        <img
          src="/icons/brightfolio-icon.svg"
          alt=""
          className="h-11 w-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            Keep Brightfolio handy
          </p>
          {isIOS ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Tap Share, then “Add to Home Screen” to install the app.
            </p>
          ) : (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Install the app for faster access to your resumes and study sets.
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            {!isIOS && (
              <button
                type="button"
                onClick={install}
                className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Install app
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          ×
        </button>
      </div>
    </aside>
  );
}
