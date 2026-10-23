import { Link } from "react-router-dom";
import Navbar from "../Navbar";
import Footer from "../Footer";

const sections = [
  {
    title: "Agreement",
    body: [
      "By accessing or using Brightfolio, you agree to these Terms & Conditions and our Privacy Policy.",
      "If you do not agree, do not use the service.",
    ],
  },
  {
    title: "The service",
    body: [
      "Brightfolio provides tools to create resumes, cover letters, browse templates, and build study sets (including AI-assisted features).",
      "Features may change, be added, or be discontinued as we improve the product.",
      "Some capabilities may require an account or a paid plan.",
    ],
  },
  {
    title: "Accounts",
    body: [
      "You are responsible for accurate registration information and for keeping your login credentials secure.",
      "You are responsible for activity that occurs under your account.",
      "Notify us promptly if you suspect unauthorized access.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "Use Brightfolio only for lawful purposes.",
      "Do not attempt to disrupt, scrape abusively, reverse engineer, or gain unauthorized access to the platform or other users' data.",
      "Do not upload malware, infringing material, or content you do not have rights to use.",
      "Do not use the service to generate unlawful, deceptive, or harmful content.",
    ],
  },
  {
    title: "Your content",
    body: [
      "You retain ownership of content you submit (such as resume text, cover letters, and study materials).",
      "You grant Brightfolio a limited license to host, process, and display that content solely to operate and improve the service you request.",
      "You represent that you have the rights needed to submit the content and that it does not violate others' rights.",
    ],
  },
  {
    title: "AI-generated output",
    body: [
      "AI features produce suggestions based on your inputs. Output may be inaccurate, incomplete, or unsuitable for a specific role.",
      "You are responsible for reviewing, editing, and verifying all content before you use or send it.",
      "Brightfolio does not guarantee interview outcomes, job offers, or ATS acceptance.",
    ],
  },
  {
    title: "Intellectual property",
    body: [
      "Brightfolio's name, branding, software, templates, and site design are owned by Brightfolio or its licensors.",
      "You may not copy, resell, or redistribute the platform or templates except as allowed through normal use of the product.",
    ],
  },
  {
    title: "Disclaimers",
    body: [
      "The service is provided \"as is\" and \"as available\" without warranties of any kind, express or implied, to the fullest extent permitted by law.",
      "We do not warrant uninterrupted or error-free operation.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "To the fullest extent permitted by law, Brightfolio and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, data, or opportunities arising from your use of the service.",
      "Our total liability for any claim relating to the service will not exceed the amount you paid us for the service in the twelve months before the claim (or zero if you use a free plan).",
    ],
  },
  {
    title: "Termination",
    body: [
      "You may stop using Brightfolio at any time and may request account deletion.",
      "We may suspend or terminate access if you violate these terms or if we need to protect the service or other users.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update these terms from time to time. The updated version will be posted on this page with a revised date.",
      "Continued use after changes constitutes acceptance of the updated terms.",
    ],
  },
] as const;

const LAST_UPDATED = "October 22, 2026";

const Terms = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main>
        <section className="pt-28 pb-16 sm:pt-32 sm:pb-20 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mb-3">
              Rules for using Brightfolio's resume, cover letter, template, and
              study tools.
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
                Questions about these terms?{" "}
                <Link
                  to="/contact"
                  className="font-semibold text-gray-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-gray-900 dark:hover:decoration-zinc-100"
                >
                  Contact us
                </Link>
                . Also see our{" "}
                <Link
                  to="/privacy"
                  className="font-semibold text-gray-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-gray-900 dark:hover:decoration-zinc-100"
                >
                  Privacy Policy
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

export default Terms;
