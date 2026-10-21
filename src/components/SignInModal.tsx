import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { InputValidator, CommonValidations } from "../utils/validation";
import { sanitize } from "../utils/sanitize";
import { createRateLimitedActions } from "../utils/rateLimit";
import { recordAnalyticsEvent } from "../utils/analyticsEvents";
import { resolveUserLocationCoords } from "../utils/userLocation";
import bunny1 from "../bunny1.png";

type AuthModalMode = "signIn" | "register";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: AuthModalMode;
}

const SignInModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "signIn",
}: SignInModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(
    initialMode === "register"
  );
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
    if (!isOpen) return;

    setVerificationSent(false);
    setIsRegistering(initialMode === "register");
    setError("");
    setValidationErrors({});

    const scrollY = window.scrollY;
    const { style: htmlStyle } = document.documentElement;
    const { style: bodyStyle } = document.body;

    const prevHtmlOverflow = htmlStyle.overflow;
    const prevBodyOverflow = bodyStyle.overflow;
    const prevBodyPosition = bodyStyle.position;
    const prevBodyTop = bodyStyle.top;
    const prevBodyWidth = bodyStyle.width;
    const prevBodyPaddingRight = bodyStyle.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = "100%";
    if (scrollbarWidth > 0) {
      bodyStyle.paddingRight = `${scrollbarWidth}px`;
    }

    const blockBackgroundScroll = (event: TouchEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("[data-signin-modal-panel]")
      ) {
        return;
      }
      event.preventDefault();
    };

    document.addEventListener("touchmove", blockBackgroundScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", blockBackgroundScroll);
      htmlStyle.overflow = prevHtmlOverflow;
      bodyStyle.overflow = prevBodyOverflow;
      bodyStyle.position = prevBodyPosition;
      bodyStyle.top = prevBodyTop;
      bodyStyle.width = prevBodyWidth;
      bodyStyle.paddingRight = prevBodyPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, initialMode]);

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
      case "auth/unauthorized-domain":
        return "Sign-in is not available on this site address yet. Try the main Brightfolio URL or contact support if this continues.";
      default:
        return `Authentication error: ${error.message || "Please try again."}`;
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
        
        const resolved = await resolveUserLocationCoords({
          zip,
          state: stateField,
          seed: userCredential.user.uid,
        });
        const resolvedState = stateField || resolved.detectedState || "";

        const sanitizedUserData = sanitize.object({
          email: userCredential.user.email || '',
          firstName,
          lastName,
          state: resolvedState,
          zip,
          phone: "",
        }, ['firstName', 'lastName', 'state'], ['email'], [], []);
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          ...sanitizedUserData,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          location: resolved.location,
          resumeIds: [],
          totalTokens: 0,
          totalApiCalls: 0,
          type: "free",
        });
        void recordAnalyticsEvent("userSignup");
        setVerificationSent(true);
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userRef = doc(db, "users", userCredential.user.uid);
        const existing = await getDoc(userRef);
        const patch: Record<string, string> = {
          lastLogin: new Date().toISOString(),
        };
        if (existing.exists() && !existing.data().location) {
          const data = existing.data();
          const resolved = await resolveUserLocationCoords({
            zip: String(data.zip || ""),
            state: String(data.state || ""),
            seed: userCredential.user.uid,
          });
          if (resolved.location) patch.location = resolved.location;
          if (!data.state && resolved.detectedState) {
            patch.state = resolved.detectedState;
          }
        }
        await setDoc(userRef, patch, { merge: true });
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
    setError("");
    if (!rateLimitActions.checkSignInLimit()) {
      const resetTime = rateLimitActions.getSignInResetTime();
      const minutes = Math.ceil(resetTime / (60 * 1000));
      setError(
        `Too many sign-in attempts. Please wait ${minutes} minute${minutes !== 1 ? "s" : ""} before trying again.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      let googleFirstName = "";
      let googleLastName = "";
      if (userCredential.user.displayName) {
        const parts = userCredential.user.displayName.split(" ");
        googleFirstName = parts[0] || "";
        googleLastName = parts.slice(1).join(" ") || "";
      }

      const userRef = doc(db, "users", userCredential.user.uid);
      const existing = await getDoc(userRef);
      const now = new Date().toISOString();

      if (existing.exists()) {
        const data = existing.data();
        const patch: Record<string, string> = { lastLogin: now };
        if (userCredential.user.email) {
          patch.email = userCredential.user.email;
        }
        if (!data.firstName && googleFirstName) {
          patch.firstName = googleFirstName;
        }
        if (!data.lastName && googleLastName) {
          patch.lastName = googleLastName;
        }
        if (!data.location) {
          const resolved = await resolveUserLocationCoords({
            zip: String(data.zip || zip || ""),
            state: String(data.state || stateField || ""),
            seed: userCredential.user.uid,
          });
          if (resolved.location) patch.location = resolved.location;
          if (!data.state && resolved.detectedState) {
            patch.state = resolved.detectedState;
          }
        }
        await setDoc(userRef, patch, { merge: true });
      } else {
        const resolved = await resolveUserLocationCoords({
          zip,
          state: stateField,
          seed: userCredential.user.uid,
        });

        await setDoc(userRef, {
          email: userCredential.user.email ?? "",
          firstName: googleFirstName,
          lastName: googleLastName,
          createdAt: now,
          lastLogin: now,
          location: resolved.location,
          phone: "",
          resumeIds: [],
          state: stateField || resolved.detectedState || "",
          zip,
          totalTokens: 0,
          totalApiCalls: 0,
          type: "free",
        });
        void recordAnalyticsEvent("userSignup");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(getFriendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-zinc-300";
  const fieldClass =
    "mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 shadow-sm focus:border-[#16aeac] focus:ring-[#16aeac] sm:text-sm h-10 pl-4";

  const handleBackdropClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] isolate"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClose}
    >
      <div
        className="absolute inset-0 bg-black/55 dark:bg-black/75 backdrop-blur-xl pointer-events-none"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-full w-full items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6 pointer-events-none">
        <div
          data-signin-modal-panel
          className="relative w-full max-w-md mx-auto my-auto p-6 bg-white/95 dark:bg-zinc-950/95 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-zinc-800 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <div>
          <div className="mt-1 text-center sm:mt-2">
            <img
              src={bunny1}
              alt="Brightfolio"
              className="h-12 w-12 mx-auto mb-4"
            />
            <h3 className="text-2xl font-semibold leading-6 text-zinc-900 dark:text-zinc-100 pb-2">
              {isRegistering ? "Create an account" : "Sign in"}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {isRegistering
                  ? "Create an account to save your resume"
                  : "Sign in to access your saved resume"}
              </p>
            </div>
          </div>
        </div>

        {verificationSent ? (
          <div className="mt-5">
            <div className="rounded-md bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50 p-4">
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
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Verification email sent
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300/90">
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
                className="inline-flex justify-center rounded-md border border-transparent bg-[#16aeac] px-4 py-2 text-base font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#16aeac] focus:ring-offset-2 dark:focus:ring-offset-zinc-950 sm:text-sm w-32"
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
                    <label htmlFor="firstName" className={labelClass}>
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) =>
                        handleNameChange('firstName', capitalizeFirstLetter(e.target.value))
                      }
                      className={fieldClass}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelClass}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) =>
                        handleNameChange('lastName', capitalizeFirstLetter(e.target.value))
                      }
                      className={fieldClass}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className={labelClass}>
                      State
                    </label>
                    <select
                      id="state"
                      value={stateField}
                      onChange={(e) => setStateField(e.target.value)}
                      className={fieldClass}
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
                    <label htmlFor="zip" className={labelClass}>
                      Zip Code
                    </label>
                    <input
                      type="text"
                      id="zip"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="signin-email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className={labelClass}>
                    Password
                  </label>
                  <input
                    type="password"
                    id="signin-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="h-4 w-4 text-[#16aeac] focus:ring-[#16aeac] border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900"
                    required
                  />
                  <label
                    htmlFor="privacy"
                    className="ml-2 block text-sm text-gray-700 dark:text-zinc-300"
                  >
                    I agree to the{" "}
                    <a
                      href="/privacy"
                      className="text-[#16aeac] hover:opacity-80"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="signin-email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className={labelClass}>
                    Password
                  </label>
                  <input
                    type="password"
                    id="signin-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
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
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-[#16aeac] px-4 py-2 text-base font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#16aeac] focus:ring-offset-2 dark:focus:ring-offset-zinc-950 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                  isRegistering ? "Register" : "Sign in"
                )}
              </button>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-base font-medium text-gray-700 dark:text-zinc-200 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#16aeac] focus:ring-offset-2 dark:focus:ring-offset-zinc-950 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError("");
                  setValidationErrors({});
                }}
                className="text-sm text-[#16aeac] hover:opacity-80"
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
    </div>,
    document.body
  );
};

export default SignInModal;
