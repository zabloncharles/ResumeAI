import Navbar from "../Navbar";
import Footer from "../Footer";

const Jobs = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Jobs</h1>
        <p className="text-gray-600 mb-8">
          Explore curated job opportunities matched to your profile.
        </p>
        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-700 text-sm">
            Job search features are coming soon. In the meantime, build your
            resume and cover letter to get ready.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Jobs;


