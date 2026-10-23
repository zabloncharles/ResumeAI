import { Link } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";

const sections = [
  {
    title: "Information we collect",
    body: [
      "Account details such as name, email, and authentication identifiers when you register or sign in.",
      "Content you create in Brightfolio, including resumes, cover letters, study sets, flashcards, and related drafts.",
      "Usage data such as feature interactions, device/browser type, and approximate location derived from IP, used to operate and improve the product.",
      "Payment or subscription information if you purchase a paid plan (processed by our payment provider; we do not store full card numbers).",
    ],
  },
  {
    title: "How we use information",
    body: [
      "Provide, maintain, and improve resume, cover letter, template, and study features.",
      "Personalize AI suggestions and generate content you request.",
      "Authenticate your account, secure the service, and prevent abuse.",
      "Send service-related messages (for example, security alerts or important product notices). Marketing email is optional where required by law.",
    ],
  },
  {
    title: "AI and third-party processing",
    body: [
      "Some features send prompts and content you provide to third-party AI providers to generate suggestions, rewrites, or study materials.",
      "We use infrastructure and services such as hosting, authentication, databases, and analytics to run Brightfolio.",
      "Those providers process data under their own terms and only as needed to deliver the requested feature.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "We do not sell your personal information.",
      "We may share data with service providers who help us operate Brightfolio, subject to appropriate confidentiality and security obligations.",
      "We may disclose information if required by law, to protect rights and safety, or in connection with a merger, acquisition, or asset sale.",
    ],
  },
  {
    title: "Retention and deletion",
    body: [
      "We keep account and content data while your account is active and as needed to provide the service.",
      "You may request deletion of your account and associated personal data through account settings or by contacting us.",
      "Some records may be retained for a limited period for legal, security, or backup purposes.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use industry-standard safeguards appropriate to the nature of the data we process.",
      "No method of transmission or storage is completely secure; please use a strong unique password and protect your credentials.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "Access, update, or delete certain account information in your account settings.",
      "Stop using the service or request account deletion.",
      "Depending on where you live, you may have additional rights (access, correction, deletion, portability, or objection). Contact us to exercise them.",
    ],
  },
  {
    title: "Children",
    body: [
      "Brightfolio is not directed to children under 13 (or the minimum age required in your region). We do not knowingly collect personal information from children.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time. We will post the revised version on this page and update the effective date.",
      "Continued use of Brightfolio after changes means you accept the updated policy.",
    ],
  },
] as const;

const LAST_UPDATED = "October 22, 2026";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main>
        <section className="pt-28 pb-16 sm:pt-32 sm:pb-20 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-3">
              How Brightfolio collects, uses, and protects information when you
              use our resume, cover letter, template, and study tools.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Last updated {LAST_UPDATED}
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {sections.map((section, index) => (
              <div
                key={section.title}
                className={
                  index === 0
                    ? "pt-0"
                    : "border-t border-zinc-200 dark:border-zinc-800 pt-8"
                }
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                  {section.title}
                </h2>
                <ul className="space-y-3 text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {section.body.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                Contact
              </h2>
              <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                Questions about privacy or data requests?{" "}
                <Link
                  to="/contact"
                  className="font-semibold text-gray-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-gray-900 dark:hover:decoration-zinc-100"
                >
                  Contact us
                </Link>
                . Also see our{" "}
                <Link
                  to="/terms"
                  className="font-semibold text-gray-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-gray-900 dark:hover:decoration-zinc-100"
                >
                  Terms & Conditions
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
