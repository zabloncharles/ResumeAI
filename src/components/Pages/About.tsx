import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  DocumentTextIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import Navbar from "../Navbar";
import Footer from "../Footer";

const offerings = [
  {
    title: "Resume Builder",
    description:
      "AI suggestions, ATS-friendly templates, and a clean export when you are ready to apply.",
    href: "/loading",
    icon: DocumentTextIcon,
  },
  {
    title: "Cover Letters",
    description:
      "Draft a tailored letter from your resume or a job description in the same workflow.",
    href: "/cover-letter",
    icon: EnvelopeIcon,
  },
  {
    title: "Study Sets",
    description:
      "Turn notes and PDFs into flashcards so interview and exam prep stays next to your applications.",
    href: "/study",
    icon: AcademicCapIcon,
  },
] as const;

const audiences = [
  {
    title: "Students",
    description:
      "Build your first resume, practice interviews, and study without switching tools.",
  },
  {
    title: "Early-career seekers",
    description:
      "Sharpen bullets, tailor applications, and keep formatting that passes ATS scans.",
  },
  {
    title: "Career changers",
    description:
      "Reframe experience for a new path and ship applications that read clearly.",
  },
] as const;

const About = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main>
        <section className="pt-28 pb-16 sm:pt-32 sm:pb-20 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-4">
              About Brightfolio
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-zinc-400 leading-relaxed">
              Brightfolio is a career toolkit for people who need a strong
              application package — resume, cover letter, and focused study —
              without bouncing between half a dozen apps.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-gray-700 dark:text-zinc-300 leading-relaxed">
            <p>
              We started with a simple problem: most resume tools either look
              pretty and break ATS parsers, or they are rigid templates that do
              nothing for your wording. Brightfolio combines clean,
              ATS-friendly layouts with AI that helps you clarify achievements —
              not invent them.
            </p>
            <p>
              From there we added cover letters and study sets so the work of
              applying and preparing stays in one place. Same account. Same
              workflow. Less time formatting, more time applying.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-3">
                What we build
              </h2>
              <p className="text-gray-600 dark:text-zinc-400">
                Three tools that cover writing, applying, and preparing.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-x-10 gap-y-10">
              {offerings.map((item, index) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className="group block border-t border-zinc-200 dark:border-zinc-800 pt-6 transition-colors hover:border-zinc-900 dark:hover:border-zinc-100"
                >
                  <div className="flex items-center gap-2 mb-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    <item.icon className="w-5 h-5 shrink-0" aria-hidden />
                    <span className="text-xs font-semibold tabular-nums tracking-wider">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed mb-5">
                    {item.description}
                  </p>
                  <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-600 group-hover:decoration-gray-900 dark:group-hover:decoration-zinc-100 transition-colors">
                    Open →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-3">
                Who it's for
              </h2>
              <p className="text-gray-600 dark:text-zinc-400">
                Built for people moving into their next role — especially
                students and early-career applicants.
              </p>
            </div>
            <ul className="grid sm:grid-cols-3 gap-8">
              {audiences.map((item) => (
                <li
                  key={item.title}
                  className="border-t border-zinc-200 dark:border-zinc-800 pt-5"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-4 text-zinc-500 dark:text-zinc-400">
              <AcademicCapIcon className="w-5 h-5 shrink-0" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                Study
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-3">
              Prep between applications
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Turn lecture notes, PDFs, or topics into flashcard study sets.
              Practice for exams and interviews without leaving Brightfolio.
            </p>
            <Link
              to="/study"
              className="inline-flex px-8 py-3.5 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all text-sm font-semibold"
            >
              Try Study Sets
            </Link>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-3">
              Ready when you are
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 mb-8">
              Start with a template, sharpen your story, and export a resume you
              can send with confidence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/loading"
                className="px-8 py-3.5 bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-full hover:bg-gray-800 dark:hover:bg-white transition-all text-sm font-semibold"
              >
                Create Your Resume
              </Link>
              <Link
                to="/contact"
                className="px-8 py-3.5 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all text-sm font-semibold"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
