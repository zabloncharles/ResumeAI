import Navbar from "../Navbar";
import Footer from "../Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-24 pb-16 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-6">
          We respect your privacy. This page outlines how we collect, use, and
          protect your data.
        </p>
        <div className="space-y-4 text-gray-700">
          <p>• We store only the data necessary to provide our services.</p>
          <p>• You can request deletion of your account and associated data.</p>
          <p>• We do not sell personal information to third parties.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
