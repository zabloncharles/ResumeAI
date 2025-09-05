import Navbar from "../Navbar";
import Footer from "../Footer";

const Services = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Services</h1>
        <p className="text-gray-600 mb-8">
          Professional resume services to help you land your next role.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Resume Builder
            </h3>
            <p className="text-gray-600 text-sm">
              Create a professional resume in minutes with AI guidance.
            </p>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cover Letter Creator
            </h3>
            <p className="text-gray-600 text-sm">
              Generate tailored cover letters based on your resume and job
              posts.
            </p>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Template Library
            </h3>
            <p className="text-gray-600 text-sm">
              Choose from ATS-friendly, modern, and executive templates.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
