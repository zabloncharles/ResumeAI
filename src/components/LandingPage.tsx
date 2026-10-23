import { useState } from "react";
import {
  DocumentTextIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  SparklesIcon,
  BriefcaseIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import videoBg from "../video.mp4";
import SignInModal from "./SignInModal";
import HeroTypewriterHeadline from "./HeroTypewriterHeadline";
import ResumeTemplateMiniPreview from "./resume/ResumeTemplateMiniPreview";
import {
  RESUME_TEMPLATE_STORAGE_KEY,
  resumeTemplates,
  type ResumeTemplateId,
} from "../constants/resumeTemplates";

const proofLogos = [
  { name: "Google", src: "/logos/google.svg" },
  { name: "Amazon", src: "/logos/amazon.svg" },
  { name: "Netflix", src: "/logos/netflix.svg" },
  { name: "Notion", src: "/logos/notion.svg" },
  { name: "Zoom", src: "/logos/zoom.svg" },
  { name: "HubSpot", src: "/logos/hubspot.svg" },
];

const ivyProofSchools = [
  "Harvard",
  "Yale",
  "Princeton",
  "Brown",
  "Cornell",
];

const productPillars = [
  {
    title: "Resume Builder",
    description:
      "Write with AI suggestions, then export a clean resume ready to send.",
    href: "/loading",
    cta: "Try Resume Builder",
    icon: DocumentTextIcon,
  },
  {
    title: "Cover Letters",
    description:
      "Generate a tailored letter from your resume or a job description.",
    href: "/cover-letter",
    cta: "Try Cover Letter",
    icon: EnvelopeIcon,
  },
  {
    title: "Study Sets",
    description:
      "Turn notes into flashcards so interview prep stays next to your apps.",
    href: "/study",
    cta: "Try Study Sets",
    icon: AcademicCapIcon,
  },
];

const LANDING_TEMPLATE_IDS: ResumeTemplateId[] = [
  "harvard-mcs",
  "harvard-industry",
  "yale-technical",
];

const landingTemplates = LANDING_TEMPLATE_IDS.flatMap((id) => {
  const meta = resumeTemplates.find((t) => t.id === id);
  return meta ? [meta] : [];
});

function rememberTemplate(id: ResumeTemplateId) {
  localStorage.setItem(RESUME_TEMPLATE_STORAGE_KEY, id);
}

const steps = [
  {
    title: "Pick a template",
    description: "Start with an Ivy-inspired layout built to pass ATS scans.",
  },
  {
    title: "Add your experience",
    description: "Fill in your background — AI helps sharpen bullets and wording.",
  },
  {
    title: "Export & apply",
    description: "Download a clean resume and send it with confidence.",
  },
];

const faq = [
  {
    question: "How do I create an ATS-friendly resume?",
    answer: "Use standard fonts like Arial or Times New Roman, include relevant keywords from the job description, use clear section headers, and avoid graphics or complex formatting that might confuse ATS systems."
  },
  {
    question: "What should I include in my resume?",
    answer: "Include your contact information, professional summary, work experience, education, skills, and relevant certifications. Tailor each section to highlight achievements and quantify your impact where possible."
  },
  {
    question: "How do I highlight my achievements?",
    answer: "Use action verbs, quantify your accomplishments with numbers and percentages, focus on results rather than duties, and use the STAR method (Situation, Task, Action, Result) to structure your achievements."
  },
  {
    question: "Should I use a different resume for each job?",
    answer: "Yes! Customize your resume for each position by incorporating keywords from the job description, emphasizing relevant experience, and adjusting your professional summary to match the role requirements."
  },
  {
    question: "How long should my resume be?",
    answer: "For most professionals, 1-2 pages is ideal. Recent graduates can use 1 page, while experienced professionals with 10+ years can use 2 pages. Focus on quality over quantity and ensure every word adds value."
  },
  {
    question: "Can I import my LinkedIn profile?",
    answer: "Yes! Our platform allows you to import your LinkedIn profile data to quickly populate your resume. This saves time and ensures consistency between your LinkedIn and resume information."
  },
];

const LandingPage = () => {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section + AI Cover Letter Section with shared video background */}
      <section className="relative w-full overflow-hidden bg-white dark:bg-black">
        <video
          className="absolute inset-0 w-full h-full object-cover z-0 blur-md opacity-90 dark:opacity-80 dark:invert dark:hue-rotate-180"
          src={videoBg}
          autoPlay
          loop
          muted
          playsInline
        />
        <div
          className="absolute inset-0 z-[1] bg-white/50 dark:bg-transparent pointer-events-none"
          aria-hidden
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Hero Section */}
          <div className="pt-32 pb-16 text-center">
            <div
              className="flex items-center justify-center gap-2 sm:gap-3 mb-8 text-zinc-500 dark:text-zinc-400"
              aria-label="Document to AI to career"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/70">
                <PencilSquareIcon className="h-5 w-5" aria-hidden />
              </span>
              <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50/90 dark:bg-teal-950/50 text-[#16aeac] dark:text-teal-300">
                <SparklesIcon className="h-5 w-5" aria-hidden />
              </span>
              <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/70">
                <BriefcaseIcon className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <HeroTypewriterHeadline />
            <p className="text-xl text-gray-600 dark:text-zinc-400 max-w-3xl mx-auto mb-12">
              Build ATS-friendly resumes, tailored cover letters, and study sets
              in one place — with AI that helps you write clearly and apply with
              confidence.
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href="#try-builders"
                className="inline-block px-8 py-4 bg-black dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-full hover:bg-gray-800 dark:hover:bg-white transition-all transform hover:scale-105 duration-300 shadow-lg hover:shadow-xl text-lg font-semibold flex items-center"
              >
                Get Started
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </div>
          </div>
          {/* Study Sets Feature Section */}
          <div
            className="mt-12 max-w-2xl mx-auto bg-green-50/60 dark:bg-green-950/40 backdrop-blur-md border border-green-200/70 dark:border-green-800/50 rounded-xl p-8 pb-10 flex flex-col items-center text-center shadow-lg"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <div className="flex items-center mb-3 justify-center">
              <AcademicCapIcon className="h-7 w-7 text-green-600 dark:text-green-400 mr-2" />
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
                New: Study Sets
              </h2>
            </div>
            <p className="text-gray-700 dark:text-zinc-300 mb-2">
              Turn lecture notes, PDFs, or topics into flashcard study sets.
              Practice for exams and interviews without leaving your career
              toolkit.
            </p>
            <Link
              to="/study"
              className="px-6 py-2.5 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-full border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/50 hover:border-green-300 dark:hover:border-green-700 transition-all shadow-sm"
            >
              Try Study Sets
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="relative mt-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(22,174,172,0.08),_transparent_55%),linear-gradient(to_bottom,#fafafa,#ffffff)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(22,174,172,0.12),_transparent_50%),linear-gradient(to_bottom,#09090b,#000000)]"
          aria-hidden
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <blockquote className="lg:col-span-5">
              <p className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
                “The ATS check caught gaps I would have missed, and building my
                cover letter in the same place saved me hours.”
              </p>
              <footer className="mt-6 flex items-center gap-3">
                <img
                  src="/images/test2.jpeg"
                  alt=""
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800 shadow-sm"
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Maya Okoro
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Biology &amp; Pre-Med · Rutgers University
                  </div>
                </div>
              </footer>
            </blockquote>

            <div className="lg:col-span-7 lg:border-l lg:border-zinc-200/80 dark:lg:border-zinc-800 lg:pl-14">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mb-5">
                Built for applications to teams at
              </p>
              <ul className="grid grid-cols-3 sm:grid-cols-6 gap-y-6 gap-x-4 items-center">
                {proofLogos.map((logo) => (
                  <li
                    key={logo.name}
                    className="flex items-center justify-center sm:justify-start"
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      title={logo.name}
                      className="h-6 sm:h-7 w-auto max-w-[5.5rem] object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 dark:invert dark:opacity-55 dark:hover:opacity-100 transition-all duration-300"
                    />
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-zinc-200/70 dark:border-zinc-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mb-3">
                  Templates inspired by career guides from
                </p>
                <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-medium">
                  {ivyProofSchools.map((school, i) => (
                    <span key={school}>
                      {i > 0 && (
                        <span
                          className="mx-2.5 text-zinc-300 dark:text-zinc-600"
                          aria-hidden
                        >
                          /
                        </span>
                      )}
                      <span>{school}</span>
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <div id="try-builders" className="scroll-mt-24 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-6">
              Resume, cover letter, and study tools — powered by AI
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 mb-8">
              Build a stronger resume, generate a tailored cover letter, and
              turn notes into study sets so you can apply and prepare in one
              place.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/loading"
                className="px-6 py-2.5 bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-full hover:bg-gray-800 dark:hover:bg-white transition-all"
              >
                Try Resume Builder
              </Link>
              <Link
                to="/cover-letter"
                className="px-6 py-2.5 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-full border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600 transition-all"
              >
                Try Cover Letter
              </Link>
              <Link
                to="/study"
                className="px-6 py-2.5 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-full border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600 transition-all"
              >
                Try Study Sets
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Product pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-2xl mb-12" data-aos="fade-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3 tracking-tight">
            Three tools. One career workflow.
          </h2>
          <p className="text-lg text-gray-600 dark:text-zinc-400">
            Write your resume, tailor the letter, and study for interviews —
            without jumping between apps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-x-10 gap-y-10">
          {productPillars.map((pillar, index) => (
            <Link
              key={pillar.title}
              to={pillar.href}
              className="group block border-t border-zinc-200 dark:border-zinc-800 pt-6 transition-colors hover:border-zinc-900 dark:hover:border-zinc-100"
              data-aos="fade-up"
              data-aos-delay={index * 80}
            >
              <div className="flex items-center gap-2 mb-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                <pillar.icon className="w-5 h-5 shrink-0" aria-hidden />
                <span className="text-xs font-semibold tabular-nums tracking-wider">
                  0{index + 1}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                {pillar.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed mb-5">
                {pillar.description}
              </p>
              <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-600 group-hover:decoration-gray-900 dark:group-hover:decoration-zinc-100 transition-colors">
                {pillar.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
            data-aos="fade-up"
          >
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-3">
                Templates that get past ATS
              </h2>
              <p className="text-gray-600 dark:text-zinc-400">
                Ivy-inspired layouts built for clarity, scannability, and
                applicant tracking systems.
              </p>
            </div>
            <Link
              to="/templates"
              className="shrink-0 text-sm font-semibold text-gray-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-gray-900 dark:hover:decoration-zinc-100 transition-colors"
            >
              Browse all templates
            </Link>
          </div>

          <div className="hidden lg:grid lg:grid-cols-5 gap-6 items-stretch">
            {landingTemplates[0] && (
              <Link
                to="/templates"
                onClick={() => rememberTemplate(landingTemplates[0].id)}
                className="group lg:col-span-3 relative rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                data-aos="fade-up"
              >
                <span className="absolute top-5 left-5 z-10 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white/90 dark:bg-zinc-950/90 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                  Most popular
                </span>
                <div className="mx-auto max-w-md aspect-[8.5/11] rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)] overflow-hidden relative">
                  <ResumeTemplateMiniPreview
                    template={landingTemplates[0].id}
                    fullName="Alex Morgan"
                    className="absolute inset-0"
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 via-black/10 to-transparent">
                    <span className="text-sm font-semibold text-white bg-black/80 px-4 py-2 rounded-full">
                      Use this template
                    </span>
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100">
                    {landingTemplates[0].name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                    {landingTemplates[0].description}
                  </p>
                </div>
              </Link>
            )}

            <div className="lg:col-span-2 flex flex-col gap-6">
              {landingTemplates.slice(1).map((template, index) => (
                <Link
                  key={template.id}
                  to="/templates"
                  onClick={() => rememberTemplate(template.id)}
                  className="group flex-1 flex gap-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 p-4 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  data-aos="fade-up"
                  data-aos-delay={(index + 1) * 100}
                >
                  <div className="w-28 sm:w-32 shrink-0 aspect-[8.5/11] rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white shadow-md overflow-hidden relative">
                    <ResumeTemplateMiniPreview
                      template={template.id}
                      fullName="Alex Morgan"
                      className="absolute inset-0"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 py-1">
                    <h3 className="font-semibold text-gray-900 dark:text-zinc-100">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1 line-clamp-3">
                      {template.description}
                    </p>
                    <span className="mt-3 text-sm font-medium text-gray-900 dark:text-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      Use this template →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div
            className="lg:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4"
            data-aos="fade-up"
          >
            {landingTemplates.map((template, index) => (
              <Link
                key={template.id}
                to="/templates"
                onClick={() => rememberTemplate(template.id)}
                className="group snap-center shrink-0 w-[78%] sm:w-[46%] rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 p-5 border border-zinc-200/80 dark:border-zinc-800"
              >
                {index === 0 && (
                  <span className="inline-block mb-3 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white/90 dark:bg-zinc-950/90 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                    Most popular
                  </span>
                )}
                <div className="mx-auto max-w-[220px] aspect-[8.5/11] rounded-sm border border-zinc-200 dark:border-zinc-700 bg-white shadow-md overflow-hidden relative">
                  <ResumeTemplateMiniPreview
                    template={template.id}
                    fullName="Alex Morgan"
                    className="absolute inset-0"
                  />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
            data-aos="fade-up"
          >
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3 tracking-tight">
                From blank page to sent application
              </h2>
              <p className="text-gray-600 dark:text-zinc-400 text-lg">
                Three steps. AI helps along the way so you spend less time
                formatting and more time applying.
              </p>
            </div>
            <Link
              to="/loading"
              className="shrink-0 px-6 py-2.5 bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-full hover:bg-gray-800 dark:hover:bg-white transition-all text-sm font-semibold"
            >
              Open Resume Builder
            </Link>
          </div>

          <ol className="grid md:grid-cols-3">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <li
                  key={step.title}
                  className={`py-8 md:py-0 md:px-10 first:md:pl-0 last:md:pr-0 ${
                    isLast
                      ? ""
                      : "border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800"
                  }`}
                  data-aos="fade-up"
                  data-aos-delay={index * 80}
                >
                  <div className="text-4xl font-bold tabular-nums tracking-tight text-zinc-300 dark:text-zinc-600 mb-4">
                    0{index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-xl mb-12" data-aos="fade-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3 tracking-tight">
            Students who turned applications into interviews
          </h2>
          <p className="text-gray-600 dark:text-zinc-400 text-lg">
            Real feedback from people who used Brightfolio to sharpen their
            resume, pass ATS checks, and apply with confidence.
          </p>
        </div>

        <div className="space-y-6">
          <div
            className="bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-900 text-gray-900 dark:text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl"
            data-aos="fade-up"
            data-aos-duration="1200"
          >
            <div className="max-w-3xl relative z-10">
              <p className="text-xl mb-8 text-gray-800 dark:text-zinc-100">
                "Using Brightfolio was a game-changer in my job search. The AI
                suggestions helped me highlight my achievements better, and I
                landed interviews at my dream companies within weeks."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://avatars.githubusercontent.com/u/74889517?s=128&v=4"
                  alt="Zablon Charles"
                  className="w-12 h-12 rounded-full border border-zinc-300 dark:border-zinc-600 object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-zinc-100">
                    Zablon Charles
                  </div>
                  <div className="text-gray-500 dark:text-zinc-400">
                    Computer Science at Saint Peter's University
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="bg-gradient-to-bl from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-900 text-gray-900 dark:text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl"
            data-aos="fade-up"
            data-aos-duration="1200"
            data-aos-delay="100"
          >
            <div className="max-w-3xl ml-auto relative z-10 text-right">
              <p className="text-xl mb-8 text-gray-800 dark:text-zinc-100">
                "The ATS check caught gaps I would have missed, and building my
                cover letter in the same place saved me hours. I finally feel like
                my applications look as sharp as my coursework."
              </p>
              <div className="flex items-center justify-end gap-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-zinc-100">
                    Maya Okoro
                  </div>
                  <div className="text-gray-500 dark:text-zinc-400">
                    Biology & Pre-Med at Rutgers University
                  </div>
                </div>
                <img
                  src="/images/test2.jpeg"
                  alt="Maya Okoro"
                  className="w-12 h-12 rounded-full border border-zinc-300 dark:border-zinc-600 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2
          className="text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-4"
          data-aos="fade-up"
        >
          Common resume questions answered
        </h2>
        <p
          className="text-gray-600 dark:text-zinc-400 max-w-2xl"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Quick answers on ATS, length, customization, and what recruiters expect.
        </p>
        <div className="mt-12 space-y-6">
          {faq.map((item, index) => (
            <div
              key={index}
              className="overflow-hidden bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-sky-600 shadow-sm hover:shadow-md transition-all"
              data-aos="fade-left"
              data-aos-delay={index * 100}
            >
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-zinc-900 dark:hover:to-zinc-900 transition-all"
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
              >
                <span className="text-gray-900 dark:text-zinc-100 font-medium">{item.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-zinc-400 transition-transform duration-200 ${
                    expandedFAQ === index ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              {expandedFAQ === index && (
                <div className="px-6 pb-6">
                  <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 py-24 sm:py-28">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          data-aos="fade-up"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-zinc-100 mb-4 max-w-3xl mx-auto tracking-tight leading-tight">
            Build a resume you are ready to send
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
            Pick a template, let Brightfolio help with wording and ATS checks,
            and apply with a cleaner application package.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/loading"
              className="px-8 py-3.5 bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-full hover:bg-gray-800 dark:hover:bg-white transition-all text-sm sm:text-base font-semibold inline-flex items-center group"
            >
              Create Your Resume
              <svg
                className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <Link
              to="/templates"
              className="px-8 py-3.5 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all text-sm sm:text-base font-semibold"
            >
              View Templates
            </Link>
          </div>

          <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
            Free templates
            <span className="mx-2.5 text-zinc-300 dark:text-zinc-600" aria-hidden>
              ·
            </span>
            AI writing help
            <span className="mx-2.5 text-zinc-300 dark:text-zinc-600" aria-hidden>
              ·
            </span>
            ATS-friendly formats
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={() => setShowSignInModal(false)}
      />
    </div>
  );
};

export default LandingPage;
