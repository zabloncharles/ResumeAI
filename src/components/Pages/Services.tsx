import { Link } from "react-router-dom";
import {
  AcademicCapIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import Navbar from "../Navbar";
import Footer from "../Footer";

const services = [
  {
    title: "Resume Builder",
    description:
      "Write with AI suggestions, check ATS readiness, and export a clean resume ready to send.",
    href: "/loading",
    cta: "Open Resume Builder",
    icon: DocumentTextIcon,
  },
  {
    title: "Cover Letter Creator",
    description:
      "Generate a tailored letter from your resume or a job description without leaving Brightfolio.",
    href: "/cover-letter",
    cta: "Open Cover Letter",
    icon: EnvelopeIcon,
  },
  {
    title: "Study Sets",
    description:
      "Turn notes, PDFs, or topics into flashcards for exams and interview prep.",
    href: "/study",
    cta: "Open Study Sets",
    icon: AcademicCapIcon,
  },
  {
    title: "Template Library",
    description:
      "Start from Ivy-inspired, ATS-friendly layouts built for students and early-career applicants.",
    href: "/templates",
    cta: "Browse Templates",
    icon: RectangleStackIcon,
  },
] as const;

const includes = [
  {
    title: "AI writing help",
    description: "Sharpen bullets and summaries without inventing experience.",
  },
  {
    title: "ATS-friendly formats",
    description: "Clean structure that parsing systems can read reliably.",
  },
  {
    title: "One workflow",
    description: "Resume, letter, and study stay in the same toolkit.",
  },
] as const;

const Services = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <main>
        <section className="pt-28 pb-16 sm:pt-32 sm:pb-20 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-4">
              Services
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-zinc-400 leading-relaxed">
              Everything you need to write, tailor, and prepare for your next
              application — resume, cover letter, templates, and study sets.
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
              {services.map((item, index) => (
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
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                    {item.title}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed mb-5">
                    {item.description}
                  </p>
                  <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-600 group-hover:decoration-gray-900 dark:group-hover:decoration-zinc-100 transition-colors">
                    {item.cta} →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-3">
                What's included
              </h2>
              <p className="text-gray-600 dark:text-zinc-400">
                Built into the product — no separate upsell packages.
              </p>
            </div>
            <ul className="grid sm:grid-cols-3 gap-8">
              {includes.map((item) => (
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

        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-3">
              Start with the tool you need
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 mb-8">
              Jump into the builder, browse templates, or prep with study sets.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/loading"
                className="px-8 py-3.5 bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-full hover:bg-gray-800 dark:hover:bg-white transition-all text-sm font-semibold"
              >
                Create Your Resume
              </Link>
              <Link
                to="/study"
                className="px-8 py-3.5 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all text-sm font-semibold"
              >
                Try Study Sets
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
