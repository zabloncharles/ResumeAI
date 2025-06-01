import { useState } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationSent(false);
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleEmailAuth}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>
        {verificationSent && (
          <div className="text-green-600 text-center mt-4 text-sm font-medium">
            Verification email sent! Please check your inbox.
          </div>
        )}
        <div className="flex items-center justify-center">
          <span className="text-gray-400 text-sm">or</span>
        </div>
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
            <g>
              <path fill="#4285F4" d="M24 9.5c3.54 0 6.36 1.22 8.29 2.98l6.16-6.16C34.91 2.61 29.87 0 24 0 14.82 0 6.91 5.82 2.69 14.09l7.19 5.59C12.01 13.36 17.56 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.91-2.18 5.38-4.66 7.04l7.19 5.59C43.09 37.39 46.1 31.47 46.1 24.55z"/>
              <path fill="#FBBC05" d="M9.88 28.68A14.48 14.48 0 0 1 9.5 24c0-1.62.28-3.19.78-4.68l-7.19-5.59A23.93 23.93 0 0 0 0 24c0 3.77.9 7.33 2.48 10.47l7.4-5.79z"/>
              <path fill="#EA4335" d="M24 48c6.48 0 11.92-2.15 15.89-5.85l-7.4-5.79c-2.06 1.39-4.7 2.22-8.49 2.22-6.44 0-11.99-3.86-14.12-9.18l-7.19 5.59C6.91 42.18 14.82 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </g>
          </svg>
          Sign in with Google
        </button>
        <div className="flex items-center justify-center mt-4">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 hover:underline text-sm focus:outline-none"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
        {error && <div className="text-red-600 text-center mt-4 text-sm font-medium">{error}</div>}
      </div>
    </div>
  );
};

export default SignIn; 