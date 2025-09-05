import Navbar from "../Navbar";
import Footer from "../Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-24 pb-16 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Terms & Conditions
        </h1>
        <p className="text-gray-600 mb-6">
          By using Brightfolio, you agree to the following terms.
        </p>
        <div className="space-y-4 text-gray-700">
          <p>• Use our services responsibly and lawfully.</p>
          <p>• Do not attempt to misuse or disrupt the platform.</p>
          <p>• We may update these terms; continued use implies acceptance.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
