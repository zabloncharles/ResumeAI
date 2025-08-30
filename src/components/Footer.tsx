import { Link } from "react-router-dom";
import bunny1 from "../bunny1.png";

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Logo and Description */}
        <div className="col-span-1">
          <Link to="/" className="flex items-center space-x-2 mb-4">
            <img src={bunny1} alt="Brightfolio Logo" className="h-8 w-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-[#16aeac] to-black bg-clip-text text-transparent">
              Brightfolio
            </span>
          </Link>
          <p className="text-gray-600 mb-4">
            Transform your career journey with AI-powered resume creation. We
            specialize in crafting professional resumes that stand out and get
            you noticed.
          </p>
          <div className="flex space-x-4">
            <a
              href="#"
              className="text-gray-400 hover:text-gray-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-gray-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2 - All Navigation Links */}
        <div className="col-span-1 text-end">
          <ul className="space-y-4">
            <li>
              <a href="/" className="hover:text-gray-300 transition-colors">
                Home
              </a>
            </li>
            <li>
              <a
                href="/services"
                className="hover:text-gray-300 transition-colors"
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="/resume"
                className="hover:text-gray-300 transition-colors"
              >
                Resume Builder
              </a>
            </li>
            <li>
              <a
                href="/templates"
                className="hover:text-gray-300 transition-colors"
              >
                Templates
              </a>
            </li>
            <li>
              <a
                href="/about"
                className="hover:text-gray-300 transition-colors"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="hover:text-gray-300 transition-colors"
              >
                Contact
              </a>
            </li>
            <li>
              <a
                href="/privacy"
                className="hover:text-gray-300 transition-colors"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="/terms"
                className="hover:text-gray-300 transition-colors"
              >
                Terms & Conditions
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-gray-400 text-sm">
        All Rights Reserved 2024 | Brightfolio
      </div>
    </div>
  </footer>
);

export default Footer;
