import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

const NEWS_QUERY = 'jobs OR employment OR "job search" OR economy OR unemployment OR "companies hiring"';

// Pastel color classes for card backgrounds
const pastelColors = [
  'bg-orange-50',
  'bg-purple-50',
  'bg-green-50',
  'bg-blue-50',
  'bg-pink-50',
  'bg-yellow-50',
  'bg-teal-50',
  'bg-cyan-50',
  'bg-lime-50',
  'bg-rose-50',
  'bg-indigo-50',
  'bg-fuchsia-50',
  'bg-sky-50',
  'bg-gray-50',
];

const News = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'relevancy' | 'popularity' | 'publishedAt'>('publishedAt');
  const [page, setPage] = useState(1);
  const newsPerPage = 12;

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line
  }, [sortBy]);

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(NEWS_QUERY)}&sortBy=${sortBy}&language=en&apiKey=8a3042d41a4045a29f9d8e720e9a18ac`
      );
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      setArticles(data.articles || []);
      setPage(1); // Reset to first page on new fetch
    } catch (err: any) {
      setError(err.message || 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(articles.length / newsPerPage);
  const paginatedArticles = articles.slice((page - 1) * newsPerPage, page * newsPerPage);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#fafbfc] py-8 px-4">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto text-center mb-12 pt-32">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Latest Employment News
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay informed with the latest trends, insights, and updates from the world of employment, jobs, and hiring.
          </p>
        </section>

        {/* Filter Section */}
        <section className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevancy' | 'popularity' | 'publishedAt')}
              className="px-6 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg shadow-sm"
            >
              <option value="publishedAt">Latest</option>
              <option value="popularity">Most Popular</option>
              <option value="relevancy">Most Relevant</option>
            </select>
          </div>
        </section>

        {/* News Grid */}
        <section className="max-w-7xl mx-auto">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading news...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && paginatedArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No news articles found. Try a different sort option.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedArticles.map((article, index) => {
              const colorClass = pastelColors[index % pastelColors.length];
              return (
                <article
                  key={index}
                  className={`rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${colorClass}`}
                >
                  {article.urlToImage && (
                    <div className="relative h-48">
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-gray-500">{article.source.name}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500">{formatDate(article.publishedAt)}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {article.title}
                    </h2>
                    {article.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {article.description}
                      </p>
                    )}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Read more
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${page === 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
                  aria-label="Previous page"
                >
                  &#60;
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${p === page ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {p}
                  </button>
                ))}
                {totalPages > 6 && (
                  <>
                    <span className="mx-1 text-gray-400 font-bold">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${page === totalPages ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${page === totalPages ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
                  aria-label="Next page"
                >
                  &#62;
                </button>
              </nav>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
};

export default News; 