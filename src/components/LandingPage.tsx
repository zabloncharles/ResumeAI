import { useEffect, useState } from "react";
import {
  DocumentTextIcon,
  SparklesIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChartBarIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import videoBg from "../video.mp4";
import SignInModal from "./SignInModal";

const stats = [
  { value: "100K+", label: "Resumes Created" },
  { value: "85%", label: "Interview Success Rate" },
  { value: "50K+", label: "Job Placements" },
  { value: "2x", label: "Avg. Salary Increase" },
];

const features = [
  {
    title: "Smart Resume Builder",
    icon: DocumentTextIcon,
    description:
      "Create professional resumes with AI-powered suggestions and formatting.",
  },
  {
    title: "Career Insights",
    icon: ChartBarIcon,
    description:
      "Get data-driven feedback to optimize your resume for your target role.",
  },
  {
    title: "ATS Optimization",
    icon: SparklesIcon,
    description:
      "Ensure your resume passes Applicant Tracking Systems with smart keywords.",
  },
  {
    title: "Job Matching",
    icon: BriefcaseIcon,
    description:
      "Find relevant job opportunities that match your skills and experience.",
  },
  {
    title: "Skill Analysis",
    icon: LightBulbIcon,
    description:
      "Identify skill gaps and get personalized recommendations for improvement.",
  },
  {
    title: "Career Growth",
    icon: AcademicCapIcon,
    description:
      "Access resources and guidance for continuous professional development.",
  },
];

const templates = [
  {
    title: "Professional Resume",
    type: "Most Popular",
    description: "Clean and modern design for experienced professionals",
    image:
      "https://cdn.dribbble.com/userupload/25593392/file/original-82ca5d3b582eab88785f7526c24b72cc.png?resize=1504x1128&vertical=center",
  },
  {
    title: "Creative Portfolio",
    type: "Designer Choice",
    description: "Showcase your work with a visually appealing layout",
    image:
      "https://cdn.dribbble.com/userupload/3493938/file/original-450f1ebaeb5d0a539ca3c92366890578.png?resize=1504x1128&vertical=center",
  },
  {
    title: "Executive Resume",
    type: "Leadership",
    description: "Highlight your achievements and leadership experience",
    image:
      "https://cdn.dribbble.com/userupload/21758796/file/original-9e2397506558ed11841fd8ae4ec5e59c.jpg?resize=752x564&vertical=center",
  },
];

const steps = [
  {
    title: "Choose your template",
    description: "Select from our professionally designed resume templates.",
  },
  {
    title: "Add your details",
    description: "Input your experience and let our AI enhance your content.",
  },
  {
    title: "Download & Apply",
    description: "Get your polished resume and start applying to jobs.",
  },
];

const faq = [
  "How do I create an ATS-friendly resume?",
  "What should I include in my resume?",
  "How do I highlight my achievements?",
  "Should I use a different resume for each job?",
  "How long should my resume be?",
  "Can I import my LinkedIn profile?",
];

const LandingPage = () => {
  const [showSignInModal, setShowSignInModal] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section + AI Cover Letter Section with shared video background */}
      <div className="relative overflow-visible max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Blurred background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0 blur-md"
          src={videoBg}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="relative z-10">
          {/* Hero Section */}
          <div className="pt-32 pb-16 text-center">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <span>📝</span>
              <span>→</span>
              <img
                src="https://ui-avatars.com/api/?name=AI&background=0D8ABC&color=fff"
                alt="AI"
                className="w-8 h-8 rounded-full"
              />
              <span>→</span>
              <span>💼</span>
            </div>
            <h1 className="text-6xl font-bold tracking-tight text-gray-900 mb-8">
              Create Your Future,
              <br />
              Build Your Perfect Resume Now!
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Transform your career journey with AI-powered resume creation. We
              specialize in crafting professional resumes that stand out and get
              you noticed.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/loading"
                className="inline-block px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 duration-300 shadow-lg hover:shadow-xl text-lg font-semibold flex items-center"
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
              </Link>
            </div>
          </div>
          {/* AI Cover Letter Feature Section */}
          <div
            className="mt-12 max-w-2xl mx-auto bg-gradient-to-r from-green-50 to-yellow-50 border-2 border-gradient-to-r from-green-200 to-yellow-200 rounded-xl p-8 pb-10 flex flex-col items-center text-center shadow-lg"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <div className="flex items-center mb-3 justify-center">
              <DocumentTextIcon className="h-7 w-7 text-green-600 mr-2" />
              <h2 className="text-2xl font-bold text-green-700">
                ✨ New: AI Cover Letter Generator
              </h2>
            </div>
            <p className="text-gray-700 mb-2">
              Instantly create a tailored, professional cover letter using your
              resume or a specific job description. Save time and stand out to
              employers with a personalized cover letter that matches your
              experience and the job requirements.
            </p>
            <Link
              to="/cover-letter"
              className="px-6 py-2.5 bg-white text-gray-900 rounded-full border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all shadow-sm"
            >
              Try the Cover Letter Creator
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
          {stats.map((stat, index) => (
            <div key={stat.value} className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              AI-powered resume building for better results
            </h2>
            <p className="text-gray-600 mb-8">
              Our intelligent system analyzes successful resumes and provides
              personalized suggestions to make yours stand out.
            </p>
            <Link
              to="/loading"
              className="px-6 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all"
            >
              Try AI Builder
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive suite of tools and features helps you create the
            perfect resume and advance your career
          </p>
        </div>

        <div className="flex justify-center">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gradient-to-br from-gray-100 to-gray-200 hover:border-green-300 hover:scale-105"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="bg-gradient-to-br from-green-50 to-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 border border-green-200">
                  <feature.icon className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2
          className="text-3xl font-bold text-gray-900 mb-4"
          data-aos="fade-up"
        >
          Professional resume templates
        </h2>
        <p
          className="text-gray-600 mb-12"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Choose from our collection of ATS-friendly templates designed for
          success.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {templates.map((template, index) => (
            <div
              key={template.title}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 hover:scale-105"
              data-aos="flip-left"
              data-aos-delay={index * 200}
            >
              <img
                src={template.image}
                alt={template.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                    {template.type}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {template.title}
                </h3>
                <p className="text-gray-600 text-sm">{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 py-20 border-t-2 border-b-2 border-gradient-to-r from-green-200 to-blue-200">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className="text-3xl font-bold text-gray-900 mb-4"
            data-aos="fade-up"
          >
            Create your resume in minutes
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-green-300 shadow-lg hover:shadow-xl transition-all duration-300"
                data-aos="fade-right"
                data-aos-delay={index * 200}
              >
                <div className="text-green-600 font-medium mb-4 bg-green-50 px-3 py-1 rounded-full border border-green-200 inline-block">
                  Step {index + 1}
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div
          className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-12 relative overflow-hidden border-2 border-gray-700 shadow-2xl"
          data-aos="fade-up"
          data-aos-duration="1200"
        >
          <div className="max-w-3xl relative z-10">
            <p className="text-xl mb-8">
              "Using ResumeAI was a game-changer in my job search. The AI
              suggestions helped me highlight my achievements better, and I
              landed interviews at my dream companies within weeks."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full border-2 border-gray-500" />
              <div>
                <div className="font-medium">Sarah Chen</div>
                <div className="text-gray-400">Software Engineer at Google</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2
          className="text-3xl font-bold text-gray-900 mb-4"
          data-aos="fade-up"
        >
          Common resume questions answered
        </h2>
        <div className="mt-12 space-y-6">
          {faq.map((question, index) => (
            <div
              key={question}
              className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 transition-all cursor-pointer border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md"
              data-aos="fade-left"
              data-aos-delay={index * 100}
            >
              <span className="text-gray-900">{question}</span>
              <svg
                className="w-5 h-5 text-gray-600"
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
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-32 relative overflow-hidden border-t-2 border-b-2 border-gradient-to-r from-green-200 via-blue-200 to-purple-200">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:75px_75px]"></div>
        <div
          className="max-w-7xl mx-auto px-4 text-center relative"
          data-aos="zoom-in"
          data-aos-duration="1000"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-40 h-40 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full blur-3xl"></div>

          <span
            className="inline-flex items-center rounded-full px-4 py-1 text-sm font-medium bg-blue-50 text-blue-700 ring-2 ring-inset ring-blue-300 mb-8 border border-blue-200"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Ready to start? 🚀
          </span>

          <h2
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 max-w-3xl mx-auto leading-tight"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Start building your professional resume today
          </h2>

          <p
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            Join thousands of job seekers who have successfully landed their
            dream jobs using ResumeAI
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <Link
              to="/loading"
              className="px-8 py-4 bg-gradient-to-r from-black to-gray-800 text-white rounded-full hover:from-gray-800 hover:to-gray-900 transition-all transform hover:scale-105 duration-300 shadow-lg hover:shadow-xl flex items-center group border-2 border-gray-700"
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
            <button className="px-8 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-all border-2 border-gray-300 hover:border-blue-400 shadow-lg hover:shadow-xl flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              View Templates
            </button>
          </div>

          <div
            className="mt-16 flex items-center justify-center gap-8"
            data-aos="fade-up"
            data-aos-delay="500"
          >
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-green-200 shadow-sm">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-600">Free Templates</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-blue-200 shadow-sm">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-600">AI Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-purple-200 shadow-sm">
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-600">ATS Friendly</span>
            </div>
          </div>
        </div>
      </div>

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
