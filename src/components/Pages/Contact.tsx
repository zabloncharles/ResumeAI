import Navbar from "../Navbar";
import Footer from "../Footer";

const Contact = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-24 pb-16 max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-gray-600 mb-8">We'd love to hear from you.</p>
        <form className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={5}
              placeholder="How can we help?"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-lg"
          >
            Send
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
