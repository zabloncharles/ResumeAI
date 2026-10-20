import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import ResumeBuilder from "../ResumeBuilder";
import ResumeShell from "./ResumeShell";
import ResumeHelpView from "./ResumeHelpView";

export default function ResumeHelpRoute() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <ResumeBuilder guestOnly />;
  }

  return (
    <ResumeShell
      activeTab="help"
      sidebarOpen={sidebarOpen}
      onSidebarOpen={() => setSidebarOpen(true)}
      onSidebarClose={() => setSidebarOpen(false)}
      mode="help"
    >
      <ResumeHelpView />
    </ResumeShell>
  );
}
