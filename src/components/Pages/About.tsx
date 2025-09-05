import Navbar from "../Navbar";
import Footer from "../Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-24 pb-16 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          About Brightfolio
        </h1>
        <p className="text-gray-600 mb-6">
          Brightfolio helps job seekers build standout resumes powered by AI.
        </p>
        <div className="space-y-4 text-gray-700">
          <p>
            We combine beautiful design, ATS-friendly formatting, and AI
            suggestions to help you present your experience clearly and
            effectively.
          </p>
          <p>
            Whether you're a student, professional, or executive, our tools are
            designed to get you noticed.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
