import { useState, useEffect } from 'react';
import { DocumentTextIcon, SparklesIcon, BriefcaseIcon, AcademicCapIcon, ChartBarIcon, LightBulbIcon, CpuChipIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'

const stats = [
  { value: '100K+', label: 'Resumes Created' },
  { value: '85%', label: 'Interview Success Rate' },
  { value: '50K+', label: 'Job Placements' },
  { value: '2x', label: 'Avg. Salary Increase' },
]

const features = [
  {
    title: 'Smart Resume Builder',
    icon: DocumentTextIcon,
    description: 'Create professional resumes with AI-powered suggestions and formatting.',
  },
  {
    title: 'Career Insights',
    icon: ChartBarIcon,
    description: 'Get data-driven feedback to optimize your resume for your target role.',
  },
  {
    title: 'ATS Optimization',
    icon: SparklesIcon,
    description: 'Ensure your resume passes Applicant Tracking Systems with smart keywords.',
  },
  {
    title: 'Job Matching',
    icon: BriefcaseIcon,
    description: 'Find relevant job opportunities that match your skills and experience.',
  },
  {
    title: 'Skill Analysis',
    icon: LightBulbIcon,
    description: 'Identify skill gaps and get personalized recommendations for improvement.',
  },
  {
    title: 'Career Growth',
    icon: AcademicCapIcon,
    description: 'Access resources and guidance for continuous professional development.',
  },
]

const templates = [
  {
    title: 'Professional Resume',
    type: 'Most Popular',
    description: 'Clean and modern design for experienced professionals',
    image: 'https://cdn.dribbble.com/userupload/25593392/file/original-82ca5d3b582eab88785f7526c24b72cc.png?resize=1504x1128&vertical=center',
  },
  {
    title: 'Creative Portfolio',
    type: 'Designer Choice',
    description: 'Showcase your work with a visually appealing layout',
    image: 'https://cdn.dribbble.com/userupload/3493938/file/original-450f1ebaeb5d0a539ca3c92366890578.png?resize=1504x1128&vertical=center',
  },
  {
    title: 'Executive Resume',
    type: 'Leadership',
    description: 'Highlight your achievements and leadership experience',
    image: 'https://cdn.dribbble.com/userupload/21758796/file/original-9e2397506558ed11841fd8ae4ec5e59c.jpg?resize=752x564&vertical=center',
  },
]

const steps = [
  {
    title: 'Choose your template',
    description: 'Select from our professionally designed resume templates.',
  },
  {
    title: 'Add your details',
    description: 'Input your experience and let our AI enhance your content.',
  },
  {
    title: 'Download & Apply',
    description: 'Get your polished resume and start applying to jobs.',
  },
]

const faq = [
  'How do I create an ATS-friendly resume?',
  'What should I include in my resume?',
  'How do I highlight my achievements?',
  'Should I use a different resume for each job?',
  'How long should my resume be?',
  'Can I import my LinkedIn profile?',
]

const LandingPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out'
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full top-0 bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <CpuChipIcon className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ResumeAI
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center flex-1 space-x-8">
              <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
              <div className="relative group">
                <a href="#" className="text-gray-600 hover:text-gray-900">Templates</a>
              </div>
              <div className="relative group">
                <a href="#" className="text-gray-600 hover:text-gray-900">Features</a>
              </div>
              <a href="#" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">FAQs</a>
            </div>

            {/* Right side buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                <span>🌐</span>
                <span>English</span>
              </button>
              <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
                Register
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Open main menu</span>
                {!isOpen ? (
                  <svg className="block h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Home</a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Templates</a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Features</a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900">FAQs</a>
              <div className="pt-4 flex items-center space-x-4">
                <button className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                  <span>🌐</span>
                  <span>English</span>
                </button>
                <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-16 text-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-2 mb-8" data-aos="fade-down" data-aos-delay="100">
          <span>📝</span>
          <span>→</span>
          <img src="https://ui-avatars.com/api/?name=AI&background=0D8ABC&color=fff" alt="AI" className="w-8 h-8 rounded-full" />
          <span>→</span>
          <span>💼</span>
        </div>
        
        <h1 className="text-6xl font-bold tracking-tight text-gray-900 mb-8" data-aos="fade-up" data-aos-delay="200">
          Create Your Future,<br />
          Build Your Perfect Resume Now!
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12" data-aos="fade-up" data-aos-delay="300">
          Transform your career journey with AI-powered resume creation. We specialize in crafting professional resumes that stand out and get you noticed.
        </p>

        <div className="mt-8 flex justify-center" data-aos="fade-up" data-aos-delay="400">
          <Link 
            to="/loading"
            className="bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center"
          >
            Get Started
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
          {stats.map((stat, index) => (
            <div key={stat.value} className="text-center" data-aos="zoom-in" data-aos-delay={index * 100}>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Features Section */}
      <div className="bg-gray-50 py-20" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl" data-aos="fade-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              AI-powered resume building for better results
            </h2>
            <p className="text-gray-600 mb-8">
              Our intelligent system analyzes successful resumes and provides personalized suggestions to make yours stand out.
            </p>
            <Link 
              to="/resume"
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
            Our comprehensive suite of tools and features helps you create the perfect resume and advance your career
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-4" data-aos="fade-up">
          Professional resume templates
        </h2>
        <p className="text-gray-600 mb-12" data-aos="fade-up" data-aos-delay="100">
          Choose from our collection of ATS-friendly templates designed for success.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {templates.map((template, index) => (
            <div 
              key={template.title} 
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              data-aos="flip-left"
              data-aos-delay={index * 200}
            >
              <img src={template.image} alt={template.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-green-600">{template.type}</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{template.title}</h3>
                <p className="text-gray-600 text-sm">{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4" data-aos="fade-up">
            Create your resume in minutes
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {steps.map((step, index) => (
              <div 
                key={step.title} 
                className="bg-white p-6 rounded-xl"
                data-aos="fade-right"
                data-aos-delay={index * 200}
              >
                <div className="text-green-600 font-medium mb-4">Step {index + 1}</div>
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
          className="bg-gray-900 text-white rounded-2xl p-12 relative overflow-hidden"
          data-aos="fade-up"
          data-aos-duration="1200"
        >
          <div className="max-w-3xl relative z-10">
            <p className="text-xl mb-8">
              "Using ResumeAI was a game-changer in my job search. The AI suggestions helped me highlight my achievements better, and I landed interviews at my dream companies within weeks."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-600 rounded-full" />
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4" data-aos="fade-up">
          Common resume questions answered
        </h2>
        <div className="mt-12 space-y-6">
          {faq.map((question, index) => (
            <div 
              key={question} 
              className="flex items-center justify-between p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
              data-aos="fade-left"
              data-aos-delay={index * 100}
            >
              <span className="text-gray-900">{question}</span>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-green-50 py-20">
        <div 
          className="max-w-7xl mx-auto px-4 text-center"
          data-aos="zoom-in"
          data-aos-duration="1000"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Start building your professional resume today
          </h2>
          <Link
            to="/resume"
            className="px-8 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all"
          >
            Create Your Resume
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Column 1 - About */}
            <div className="col-span-1">
              <p className="text-lg mb-8">
                Stay connected, explore opportunities, and build your career with confidence. Your success story starts here
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white hover:text-gray-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-gray-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-gray-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-gray-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2 - Navigation */}
            <div className="col-span-1">
              <ul className="space-y-4">
                <li><Link to="/" className="hover:text-gray-300 transition-colors">Home</Link></li>
                <li><Link to="/services" className="hover:text-gray-300 transition-colors">Services</Link></li>
                <li><Link to="/resume" className="hover:text-gray-300 transition-colors">Resume Builder</Link></li>
                <li><Link to="/templates" className="hover:text-gray-300 transition-colors">Templates</Link></li>
              </ul>
            </div>

            {/* Column 3 - Legal */}
            <div className="col-span-1">
              <ul className="space-y-4">
                <li><Link to="/about" className="hover:text-gray-300 transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-gray-300 transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-gray-300 transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>

            {/* Column 4 - Logo */}
            <div className="col-span-1">
              <div className="flex items-center justify-end h-full">
                <span className="text-2xl font-bold">ResumeAI</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-400 text-sm">
            All Rights Reserved 2024 | ResumeAI
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 