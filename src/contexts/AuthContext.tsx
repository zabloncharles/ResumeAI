import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const finishLoading = (nextUser: User | null) => {
      if (!mounted) return;
      setUser(nextUser);
      setLoading(false);
    };

    // A native WebView can occasionally leave Firebase Auth waiting on its
    // persistence layer indefinitely. The app should still render while auth
    // finishes, rather than presenting a permanently blank screen.
    const timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      console.warn("Firebase auth initialization timed out; continuing as signed out.");
      finishLoading(null);
    }, 5000);

    try {
      unsubscribe = onAuthStateChanged(
        auth,
        (nextUser) => {
          window.clearTimeout(timeoutId);
          finishLoading(nextUser);
        },
        (error) => {
          window.clearTimeout(timeoutId);
          console.error("Firebase auth initialization failed:", error);
          finishLoading(null);
        }
      );
    } catch (error) {
      window.clearTimeout(timeoutId);
      console.error("Firebase Auth could not start:", error);
      finishLoading(null);
    }

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, []);

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
