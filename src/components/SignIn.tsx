import { useState } from "react";
import { auth, db } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Navbar from "./Navbar";
import Footer from "./Footer";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerificationSent(false);
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        // Create user document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          callCount: 0,
          email: userCredential.user.email,
          createdAt: new Date().toISOString(),
        });
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Create user document in Firestore for Google sign-in
      await setDoc(
        doc(db, "users", result.user.uid),
        {
          callCount: 0,
          email: result.user.email,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-100">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isRegister
                ? "Join us to start building your professional resume"
                : "Sign in to continue building your resume"}
            </p>
          </div>
          <div className="mt-8 bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleEmailAuth}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isRegister ? "Create Account" : "Sign In"}
                </button>
              </div>
            </form>

            {verificationSent && (
              <div className="mt-4 text-green-600 text-center text-sm font-medium">
                Verification email sent! Please check your inbox.
              </div>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                    <g>
                      <path
                        fill="#4285F4"
                        d="M24 9.5c3.54 0 6.36 1.22 8.29 2.98l6.16-6.16C34.91 2.61 29.87 0 24 0 14.82 0 6.91 5.82 2.69 14.09l7.19 5.59C12.01 13.36 17.56 9.5 24 9.5z"
                      />
                      <path
                        fill="#34A853"
                        d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.91-2.18 5.38-4.66 7.04l7.19 5.59C43.09 37.39 46.1 31.47 46.1 24.55z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M9.88 28.68A14.48 14.48 0 0 1 9.5 24c0-1.62.28-3.19.78-4.68l-7.19-5.59A23.93 23.93 0 0 0 0 24c0 3.77.9 7.33 2.48 10.47l7.4-5.79z"
                      />
                      <path
                        fill="#EA4335"
                        d="M24 48c6.48 0 11.92-2.15 15.89-5.85l-7.4-5.79c-2.06 1.39-4.7 2.22-8.49 2.22-6.44 0-11.99-3.86-14.12-9.18l-7.19 5.59C6.91 42.18 14.82 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </g>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium focus:outline-none"
              >
                {isRegister
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Register"}
              </button>
            </div>

            {error && (
              <div className="mt-4 text-red-600 text-center text-sm font-medium">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignIn;
