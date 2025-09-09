import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { InputValidator, CommonValidations } from "../utils/validation";
import { sanitize } from "../utils/sanitize";
import { createRateLimitedActions } from "../utils/rateLimit";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SignInModal = ({ isOpen, onClose, onSuccess }: SignInModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip, setZip] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const rateLimitActions = createRateLimitedActions();


  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Validation functions
  const validateForm = () => {
    const errors: Record<string, string[]> = {};
    
    // Email validation
    const emailResult = InputValidator.validateField(email, CommonValidations.email);
    if (!emailResult.isValid) {
      errors.email = emailResult.errors;
    }
    
    // Password validation
    const passwordResult = InputValidator.validateField(password, CommonValidations.password);
    if (!passwordResult.isValid) {
      errors.password = passwordResult.errors;
    }
    
    // Registration-specific validations
    if (isRegistering) {
      const firstNameResult = InputValidator.validateField(firstName, CommonValidations.name);
      if (!firstNameResult.isValid) {
        errors.firstName = firstNameResult.errors;
      }
      
      const lastNameResult = InputValidator.validateField(lastName, CommonValidations.name);
      if (!lastNameResult.isValid) {
        errors.lastName = lastNameResult.errors;
      }
      
      // ZIP code validation
      if (zip) {
        const zipResult = InputValidator.validateField(zip, {
          pattern: /^\d{5}(-\d{4})?$/,
          custom: (value) => {
            const cleaned = value.replace(/\D/g, '');
            if (cleaned.length !== 5 && cleaned.length !== 9) {
              return 'ZIP code must be 5 or 9 digits';
            }
            return null;
          }
        });
        if (!zipResult.isValid) {
          errors.zip = zipResult.errors;
        }
      }
      
      // Privacy acceptance validation
      if (!privacyAccepted) {
        errors.privacy = ['You must accept the privacy policy to register'];
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Sanitize input handlers
  const handleEmailChange = (value: string) => {
    setEmail(sanitize.email(value));
    // Clear email validation errors when user types
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: [] }));
    }
  };
  
  const handlePasswordChange = (value: string) => {
    setPassword(sanitize.text(value));
    // Clear password validation errors when user types
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: [] }));
    }
  };
  
  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    const sanitized = sanitize.text(value);
    if (field === 'firstName') {
      setFirstName(sanitized);
    } else {
      setLastName(sanitized);
    }
    // Clear validation errors when user types
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: [] }));
    }
  };


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setVerificationSent(false);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Map Firebase Auth error codes to user-friendly messages
  const getFriendlyError = (error: any) => {
    if (!error || typeof error !== "object")
      return "An unexpected error occurred. Please try again.";
    
    // Auth error logged for development debugging only
    if (import.meta.env.DEV) console.error("Auth error:", error);
    
    const code =
      error.code ||
      (error.message && error.message.match(/auth\/(\w|-)+/g)?.[0]);
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password. Please try again.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/email-already-in-use":
        return "This email is already registered.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again.";
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Pop-up was blocked. Please allow pop-ups for this site and try again.";
      default:
        return `Authentication error: ${error.message || "Please try again."}`;
    }
  };

  // Helper: Fetch coordinates for a zip code using Zippopotam.us API
  const getRandomCoordForZip = async (zip: string) => {
    if (!zip || zip.trim() === "") return "";
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) return "";
      const data = await res.json();
      if (!data.places || !data.places[0]) return "";
      const lat = parseFloat(data.places[0].latitude);
      const lng = parseFloat(data.places[0].longitude);
      // Add a small random offset (±0.01) to latitude and longitude
      const randLat = lat + (Math.random() - 0.5) * 0.02;
      const randLng = lng + (Math.random() - 0.5) * 0.02;
      return `${randLat},${randLng}`;
    } catch (error) {
      if (import.meta.env.DEV) console.warn("Location API error (non-critical):", error);
      return "";
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    
    // Rate limiting check
    if (!rateLimitActions.checkSignInLimit()) {
      const resetTime = rateLimitActions.getSignInResetTime();
      const minutes = Math.ceil(resetTime / (60 * 1000));
      setError(`Too many sign-in attempts. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`);
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      setError("Please fix the validation errors below.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        
        // Try to get location, but don't fail if it doesn't work
        let location = "";
        try {
          location = await getRandomCoordForZip(zip);
        } catch (locationError) {
          if (import.meta.env.DEV) console.warn("Location fetch failed, continuing without location");
        }
        
        // Sanitize user data before saving
        const sanitizedUserData = sanitize.object({
          email: userCredential.user.email || '',
          firstName,
          lastName,
          state: stateField,
          zip,
          phone: "",
        }, ['firstName', 'lastName', 'state'], ['email'], [], []);
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          ...sanitizedUserData,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          location,
          resumeIds: [],
          totalTokens: 0,
          totalApiCalls: 0,
          type: "free",
        });
        setVerificationSent(true);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Extract first/last name from displayName if available
      let firstName = "";
      let lastName = "";
      if (userCredential.user.displayName) {
        const parts = userCredential.user.displayName.split(" ");
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }
      
      // Try to get location, but don't fail if it doesn't work
      let location = "";
      try {
        location = await getRandomCoordForZip(zip);
      } catch (locationError) {
        console.log("Location fetch failed, continuing without location");
      }
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: userCredential.user.email,
        firstName,
        lastName,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        location,
        phone: "",
        resumeIds: [],
        state: stateField,
        zip,
        totalTokens: 0,
        totalApiCalls: 0,
        type: "free",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(getFriendlyError(err));
    }
  };

  if (!isOpen) {
    return null;
  }
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center h-screen bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-auto p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="mt-3 text-center sm:mt-5">
            <svg
              className="h-8 w-8 mx-auto mb-2 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h3 className="text-2xl font-medium leading-6 bg-gradient-to-r from-green-500 to-black text-transparent bg-clip-text pb-2">
              {isRegistering ? "Create an Account" : "Sign In"}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {isRegistering
                  ? "Create an account to save your resume"
                  : "Sign in to access your saved resume"}
              </p>
            </div>
          </div>
        </div>

        {verificationSent ? (
          <div className="mt-5">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Verification email sent
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Please check your email to verify your account before
                      signing in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-transparent bg-gradient-to-r from-green-500 to-yellow-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-green-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm w-32"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="mt-5 space-y-4">
            {isRegistering ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) =>
                        handleNameChange('firstName', capitalizeFirstLetter(e.target.value))
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 pl-4"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) =>
                        handleNameChange('lastName', capitalizeFirstLetter(e.target.value))
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 pl-4"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700"
                    >
                      State
                    </label>
                    <select
                      id="state"
                      value={stateField}
                      onChange={(e) => setStateField(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 pl-4"
                      required
                    >
                      <option value="">Select a state</option>
                      <option value="AL">Alabama</option>
                      <option value="AK">Alaska</option>
                      <option value="AZ">Arizona</option>
                      <option value="AR">Arkansas</option>
                      <option value="CA">California</option>
                      <option value="CO">Colorado</option>
                      <option value="CT">Connecticut</option>
                      <option value="DE">Delaware</option>
                      <option value="FL">Florida</option>
                      <option value="GA">Georgia</option>
                      <option value="HI">Hawaii</option>
                      <option value="ID">Idaho</option>
                      <option value="IL">Illinois</option>
                      <option value="IN">Indiana</option>
                      <option value="IA">Iowa</option>
                      <option value="KS">Kansas</option>
                      <option value="KY">Kentucky</option>
                      <option value="LA">Louisiana</option>
                      <option value="ME">Maine</option>
                      <option value="MD">Maryland</option>
                      <option value="MA">Massachusetts</option>
                      <option value="MI">Michigan</option>
                      <option value="MN">Minnesota</option>
                      <option value="MS">Mississippi</option>
                      <option value="MO">Missouri</option>
                      <option value="MT">Montana</option>
                      <option value="NE">Nebraska</option>
                      <option value="NV">Nevada</option>
                      <option value="NH">New Hampshire</option>
                      <option value="NJ">New Jersey</option>
                      <option value="NM">New Mexico</option>
                      <option value="NY">New York</option>
                      <option value="NC">North Carolina</option>
                      <option value="ND">North Dakota</option>
                      <option value="OH">Ohio</option>
                      <option value="OK">Oklahoma</option>
                      <option value="OR">Oregon</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="RI">Rhode Island</option>
                      <option value="SC">South Carolina</option>
                      <option value="SD">South Dakota</option>
                      <option value="TN">Tennessee</option>
                      <option value="TX">Texas</option>
                      <option value="UT">Utah</option>
                      <option value="VT">Vermont</option>
                      <option value="VA">Virginia</option>
                      <option value="WA">Washington</option>
                      <option value="WV">West Virginia</option>
                      <option value="WI">Wisconsin</option>
                      <option value="WY">Wyoming</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="zip"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Zip Code
                    </label>
                    <input
                      type="text"
                      id="zip"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 pl-4"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="signin-email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 pl-4"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="signin-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 pl-4"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    required
                  />
                  <label
                    htmlFor="privacy"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    I agree to the{" "}
                    <a href="#" className="text-green-600 hover:text-green-500">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="signin-email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 pl-4"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="signin-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm h-10 pl-4"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 sm:mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-green-500 to-yellow-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-green-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isRegistering ? "Creating Account..." : "Signing In..."}
                  </div>
                ) : (
                  isRegistering ? "Register" : "Sign In"
                )}
              </button>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Sign in with Google
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isRegistering
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Register"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignInModal;
