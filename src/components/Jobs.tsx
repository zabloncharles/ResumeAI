import { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface Job {
  id: number;
  title: string;
  company_name: string;
  company_logo_url?: string;
  candidate_required_location: string;
  url: string;
  category: string;
  publication_date: string;
  salary: string;
  description: string;
  job_type?: string;
  tags?: string[];
}

const JOB_CATEGORIES = [
  { name: "Engineering", icon: "💻" },
  { name: "Design", icon: "🎨" },
  { name: "Marketing", icon: "📈" },
  { name: "Product", icon: "🧩" },
];

const TRUSTED_COMPANIES = [
  { name: "NCR" },
  { name: "monday.com" },
  { name: "PHILIPS" },
  { name: "Dropbox" },
  { name: "Upwork" },
];

const JOB_TYPES = [
  { label: "Full time", value: "full_time" },
  { label: "Part time", value: "part_time" },
  { label: "Internship", value: "internship" },
  { label: "Project work", value: "contract" },
  { label: "Volunteering", value: "volunteer" },
];

const SALARY_MIN = 50000;
const SALARY_MAX = 120000;

const HERO_TAGS = [
  "Developer",
  "Designer",
  "Marketing",
  "Product",
  "QA",
  "Data",
];

// Country name to code mapping
const COUNTRY_CODE_MAP: Record<string, string> = {
  "United States": "USA",
  "United Kingdom": "UK",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  France: "FR",
  India: "IN",
  Netherlands: "NL",
  Spain: "ES",
  Italy: "IT",
  Brazil: "BR",
  Mexico: "MX",
  Japan: "JP",
  China: "CN",
  "South Africa": "ZA",
  "New Zealand": "NZ",
  Ireland: "IE",
  Switzerland: "CH",
  Sweden: "SE",
  Norway: "NO",
  Finland: "FI",
  Denmark: "DK",
  Belgium: "BE",
  Austria: "AT",
  Singapore: "SG",
  "Hong Kong": "HK",
  "United Arab Emirates": "UAE",
  Russia: "RU",
  Turkey: "TR",
  Poland: "PL",
  Portugal: "PT",
  Greece: "GR",
  "Czech Republic": "CZ",
  Hungary: "HU",
  Romania: "RO",
  Argentina: "AR",
  Chile: "CL",
  Colombia: "CO",
  "South Korea": "KR",
  Malaysia: "MY",
  Philippines: "PH",
  Thailand: "TH",
  Vietnam: "VN",
  Indonesia: "ID",
  Pakistan: "PK",
  Bangladesh: "BD",
  Egypt: "EG",
  "Saudi Arabia": "SA",
  Israel: "IL",
  Ukraine: "UA",
  Slovakia: "SK",
  Slovenia: "SI",
  Croatia: "HR",
  Estonia: "EE",
  Latvia: "LV",
  Lithuania: "LT",
  Bulgaria: "BG",
  Serbia: "RS",
  Morocco: "MA",
  Nigeria: "NG",
  Kenya: "KE",
  Ghana: "GH",
  Luxembourg: "LU",
  Iceland: "IS",
  Malta: "MT",
  Cyprus: "CY",
  Liechtenstein: "LI",
  Monaco: "MC",
  Andorra: "AD",
  "San Marino": "SM",
  "Vatican City": "VA",
};

const Jobs = () => {
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter/sort state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([
    SALARY_MIN,
    SALARY_MAX,
  ]);
  const [sort, setSort] = useState<"recent" | "high" | "low">("recent");
  const [hideNoSalary, setHideNoSalary] = useState(false);
  const [entryLevelOnly, setEntryLevelOnly] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const jobsPerPage = 12;

  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  // Load 10 jobs by default on mount
  useEffect(() => {
    const fetchDefaultJobs = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://remotive.com/api/remote-jobs");
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (err) {
        setError("Failed to fetch jobs.");
      } finally {
        setLoading(false);
      }
    };
    fetchDefaultJobs();
  }, []);

  // Detect user country on mount
  useEffect(() => {
    const fetchCountry = async () => {
      setGeoLoading(true);
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        setUserCountry(data.country_name || null);
      } catch {
        setUserCountry(null);
      } finally {
        setGeoLoading(false);
      }
    };
    fetchCountry();
  }, []);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = search
        ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(
            search
          )}`
        : "https://remotive.com/api/remote-jobs";
      const res = await fetch(url);
      const data = await res.json();
      setJobs(data.jobs || []);
      setPage(1);
    } catch (err) {
      setError("Failed to fetch jobs.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: parse salary string to number (best effort, returns average if range)
  function parseSalary(sal: string): number | null {
    if (!sal) return null;
    const match = sal.match(/\$?([\d,]+)(?:\s*-\s*\$?([\d,]+))?/);
    if (!match) return null;
    const min = parseInt(match[1].replace(/,/g, ""));
    if (match[2]) {
      const max = parseInt(match[2].replace(/,/g, ""));
      return Math.round((min + max) / 2);
    }
    return min;
  }

  // Helper: map job_type to display label
  const jobTypeLabel = (type?: string) => {
    switch (type) {
      case "full_time":
        return "Full-Time";
      case "part_time":
        return "Part-Time";
      case "internship":
        return "Internship";
      case "contract":
        return "Project Work";
      case "volunteer":
        return "Volunteering";
      default:
        return type
          ? type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
          : "";
    }
  };

  // Helper: pastel background by category
  const pastelColors: Record<string, string> = {
    "Software Development": "bg-orange-50",
    Design: "bg-purple-50",
    Marketing: "bg-green-50",
    Product: "bg-blue-50",
    "Customer Support": "bg-pink-50",
    "Project Management": "bg-yellow-50",
    "Sales / Business": "bg-teal-50",
    "Data Analysis": "bg-cyan-50",
    "DevOps / Sysadmin": "bg-lime-50",
    "Finance / Legal": "bg-rose-50",
    "Human Resources": "bg-indigo-50",
    QA: "bg-fuchsia-50",
    Writing: "bg-sky-50",
    "All others": "bg-gray-50",
  };
  function getPastelBg(category: string) {
    return pastelColors[category] || "bg-gray-50";
  }

  // Filtering and sorting
  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter((job) => {
      // Exclude jobs with missing essential fields
      if (!job.title || !job.description || !job.category) return false;
      // User country filter
      if (userCountry && job.candidate_required_location) {
        // Allow jobs that are 'Remote' or match the user's country (case-insensitive)
        const loc = job.candidate_required_location.toLowerCase();
        const code = COUNTRY_CODE_MAP[userCountry] || "";
        const codeLc = code.toLowerCase();
        const countryLc = userCountry.toLowerCase();
        if (
          loc !== "anywhere" &&
          loc !== "remote" &&
          !loc.includes(countryLc) &&
          !(codeLc && loc.includes(codeLc))
        ) {
          return false;
        }
      }
      // Job Type (use job_type field)
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(job.job_type || "")) return false;
      }
      // Entry Level filter (best effort: title, tags, description)
      if (entryLevelOnly) {
        const entryKeywords = ["entry level", "junior", "intern"];
        const text = `${job.title} ${(job.tags || []).join(" ")} ${
          job.description
        }`.toLowerCase();
        if (!entryKeywords.some((kw) => text.includes(kw))) return false;
      }
      // Categories
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(job.category)) return false;
      }
      // Salary
      if (salaryRange) {
        const sal = parseSalary(job.salary || "");
        if (sal !== null && (sal < salaryRange[0] || sal > salaryRange[1]))
          return false;
      }
      // Hide jobs with no salary
      if (hideNoSalary && (!job.salary || job.salary.trim() === ""))
        return false;
      return true;
    });
    // Sort
    if (sort === "recent") {
      filtered = filtered.sort(
        (a, b) =>
          new Date(b.publication_date).getTime() -
          new Date(a.publication_date).getTime()
      );
    } else if (sort === "high") {
      filtered = filtered.sort(
        (a, b) =>
          (parseSalary(b.salary || "") || 0) -
          (parseSalary(a.salary || "") || 0)
      );
    } else if (sort === "low") {
      filtered = filtered.sort(
        (a, b) =>
          (parseSalary(a.salary || "") || 0) -
          (parseSalary(b.salary || "") || 0)
      );
    }
    console.log("jobs:", jobs);
    console.log("filteredJobs:", filtered);
    console.log("selectedTypes:", selectedTypes);
    console.log("selectedCategories:", selectedCategories);
    console.log("salaryRange:", salaryRange);
    console.log("hideNoSalary:", hideNoSalary);
    console.log("entryLevelOnly:", entryLevelOnly);
    return filtered;
  }, [
    jobs,
    selectedTypes,
    selectedCategories,
    salaryRange,
    sort,
    hideNoSalary,
    entryLevelOnly,
    userCountry,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (page - 1) * jobsPerPage,
    page * jobsPerPage
  );

  // Handlers for filters
  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };
  const handleCategoryChange = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSalaryRange([SALARY_MIN, val]);
  };
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "recent") setSort("recent");
    else if (val === "high") setSort("high");
    else if (val === "low") setSort("low");
  };
  const handleClearAll = () => {
    setSelectedTypes([]);
    setSelectedCategories([]);
    setSalaryRange([SALARY_MIN, SALARY_MAX]);
    setHideNoSalary(false);
    setEntryLevelOnly(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-start py-8 px-2">
        {/* Hero Section */}
        <section className="w-full max-w-3xl mx-auto text-center py-16">
          <div className="mb-2 text-xs tracking-widest text-gray-400 font-semibold">
            — JOB SEARCH PLATFORM —
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
            The Essential Platform That Helps You Find Remote Jobs
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            Discover ultra-fast, dynamic & personalized job opportunities.
            Search, filter, and apply to jobs from leading companies worldwide.
          </p>
          {/* Functional Hero Tags */}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {HERO_TAGS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSearch(term);
                  handleSearch({
                    preventDefault: () => {},
                  } as React.FormEvent<HTMLFormElement>);
                }}
                className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-100"
              >
                {term}
              </button>
            ))}
          </div>
        </section>

        {/* Job Category Cards */}
        <section className="w-full max-w-4xl mx-auto flex flex-wrap justify-center gap-6 mb-12">
          {JOB_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                setSelectedCategories([cat.name]);
                setPage(1);
              }}
              className={`flex flex-col items-center justify-center w-44 h-32 bg-white rounded-2xl shadow border border-gray-100 hover:shadow-lg transition-all duration-200 group relative ${
                selectedCategories.includes(cat.name)
                  ? "ring-2 ring-blue-400 border-blue-200"
                  : ""
              }`}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-base font-semibold text-gray-800 mb-1">
                {cat.name}
              </div>
              <div className="absolute top-3 right-3 w-4 h-4 rounded-full border border-gray-200 bg-gray-50"></div>
            </button>
          ))}
        </section>

        {/* Search Bar */}
        <section className="w-full flex flex-col items-center mb-8">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-2 items-center justify-center w-full max-w-xl"
          >
            <input
              type="text"
              placeholder="Search jobs (e.g. developer, designer)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-6 py-4 rounded-l-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg shadow-sm bg-white min-w-[200px]"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-black text-white rounded-r-full font-semibold text-lg hover:bg-gray-900 transition-colors shadow-sm"
            >
              Search
            </button>
          </form>
        </section>

        {/* Call to Action */}
        <section className="w-full flex flex-col items-center mb-10">
          <button className="px-8 py-4 bg-black text-white rounded-full font-semibold text-lg shadow hover:bg-gray-900 transition mb-4">
            Get Started — It's Free
          </button>
          <div className="flex gap-8 text-gray-500 text-sm items-center">
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> Free Signup
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> No Credit Card Required
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> Apply Anytime
            </span>
          </div>
        </section>

        {/* Trusted By Logos */}
        <section className="w-full max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-10 py-8 border-t border-gray-100 mb-8">
          {TRUSTED_COMPANIES.map((c) => (
            <div
              key={c.name}
              className="text-gray-400 text-xl font-bold tracking-wide opacity-80"
            >
              {c.name}
            </div>
          ))}
        </section>

        {/* Jobs Section (Sidebar + Grid) */}
        <section className="w-full max-w-7xl mx-auto flex gap-8 items-start">
          {/* Sidebar */}
          <aside className="w-72 bg-white rounded-2xl shadow border border-gray-100 p-6 flex flex-col gap-8 sticky top-8 self-start min-h-[400px]">
            <div>
              <div className="font-bold text-lg mb-4">Job Type</div>
              <div className="flex flex-col gap-2 text-gray-700 text-base">
                {JOB_TYPES.map((type) => (
                  <label key={type.value}>
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeChange(type.value)}
                    />{" "}
                    {type.label}
                  </label>
                ))}
              </div>
              <button
                className="text-red-500 text-sm mt-2 ml-1"
                onClick={handleClearAll}
              >
                Clear all
              </button>
            </div>
            <div>
              <label className="flex items-center gap-2 text-gray-700 text-base mt-2">
                <input
                  type="checkbox"
                  checked={hideNoSalary}
                  onChange={(e) => setHideNoSalary(e.target.checked)}
                />
                Hide jobs with no salary
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-gray-700 text-base mt-2">
                <input
                  type="checkbox"
                  checked={entryLevelOnly}
                  onChange={(e) => setEntryLevelOnly(e.target.checked)}
                />
                Entry Level
              </label>
            </div>
            <div>
              <div className="font-bold text-lg mb-4">Salary Range</div>
              <input
                type="range"
                min={SALARY_MIN}
                max={SALARY_MAX}
                value={salaryRange[1]}
                onChange={handleSalaryChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>${SALARY_MIN / 1000}k</span>
                <span>${salaryRange[1] / 1000}k</span>
              </div>
            </div>
            <div>
              <div className="font-bold text-lg mb-4">Job categories</div>
              <div className="flex flex-col gap-2 text-gray-700 text-base">
                {JOB_CATEGORIES.map((cat) => (
                  <label key={cat.name}>
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={() => handleCategoryChange(cat.name)}
                    />{" "}
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
          </aside>
          {/* Main Job Grid */}
          <div className="flex-1">
            {geoLoading && (
              <div className="text-center text-gray-500 py-8">
                Detecting your country...
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Recommended jobs
              </h2>
              <div className="relative">
                <select
                  className="appearance-none border border-gray-200 rounded-full px-4 py-2 pr-8 text-gray-700 bg-white font-medium shadow-sm focus:outline-none"
                  value={sort}
                  onChange={handleSortChange}
                >
                  <option value="recent">Most recent</option>
                  <option value="high">Highest salary</option>
                  <option value="low">Lowest salary</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            </div>
            {loading && (
              <div className="text-center text-gray-500 py-8">
                Loading jobs...
              </div>
            )}
            {error && (
              <div className="text-center text-red-500 py-8">{error}</div>
            )}
            {!loading && !error && filteredJobs.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-lg">
                No jobs found. Try a different search.
              </div>
            )}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedJobs.map((job) => {
                // Entry level detection (same as filter)
                const entryKeywords = ["entry level", "junior", "intern"];
                const isEntryLevel = entryKeywords.some((kw) =>
                  `${job.title} ${(job.tags || []).join(" ")} ${
                    job.description
                  }`
                    .toLowerCase()
                    .includes(kw)
                );
                // Salary display
                const hasSalaryDigits = /\d/.test(job.salary || "");
                const salaryDisplay = hasSalaryDigits
                  ? job.salary
                  : "Not Given";
                // Location display
                const locationDisplay =
                  job.candidate_required_location || "Remote";
                // Date display
                const dateDisplay = new Date(
                  job.publication_date
                ).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                // Badges
                const badges = [];
                if (job.job_type) badges.push(jobTypeLabel(job.job_type));
                if (isEntryLevel) badges.push("Entry Level");
                if (job.tags && job.tags.length) badges.push(...job.tags);
                return (
                  <li
                    key={job.id}
                    className={`relative rounded-3xl border border-gray-200 shadow-md p-6 flex flex-col min-h-[340px] ${getPastelBg(
                      job.category
                    )}`}
                  >
                    {/* Date pill and bookmark */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-white/80 text-gray-700 text-xs rounded-full font-semibold shadow-sm border border-gray-100">
                        {dateDisplay}
                      </span>
                      <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border border-gray-100 shadow-sm hover:bg-gray-100 transition">
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 5v14l7-5 7 5V5a2 2 0 00-2-2H7a2 2 0 00-2 2z"
                          />
                        </svg>
                      </button>
                    </div>
                    {/* Company logo/initial */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm">
                        {job.company_logo_url ? (
                          <img
                            src={job.company_logo_url}
                            alt={job.company_name}
                            className="w-8 h-8 object-contain rounded-full"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-700">
                            {job.company_name[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 font-semibold leading-tight">
                          {job.company_name}
                        </div>
                        <div className="text-lg font-bold text-gray-900 leading-tight">
                          {job.title}
                        </div>
                      </div>
                    </div>
                    {/* Badges or Description */}
                    {job.description &&
                    !job.description.includes("<") &&
                    !job.description.includes(">") ? (
                      <div className="text-gray-600 text-sm line-clamp-2 mb-4 mt-2">
                        {job.description}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-4 mt-2">
                        {badges.map((badge, i) => (
                          <span
                            key={i}
                            className="inline-block bg-white/80 border border-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium shadow-sm"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Salary and location, Details button */}
                    <div className="flex items-end justify-between mt-auto pt-4">
                      <div>
                        <div className="text-gray-900 font-bold text-base">
                          {salaryDisplay}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {locationDisplay}
                        </div>
                      </div>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-black text-white rounded-full font-semibold text-sm shadow hover:bg-gray-900 transition"
                      >
                        Details
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${
                      page === 1
                        ? "text-gray-300"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-label="Previous page"
                  >
                    &#60;
                  </button>
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => i + 1
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                        p === page
                          ? "bg-gray-900 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 6 && (
                    <>
                      <span className="mx-1 text-gray-400 font-bold">...</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                          page === totalPages
                            ? "bg-gray-900 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${
                      page === totalPages
                        ? "text-gray-300"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-label="Next page"
                  >
                    &#62;
                  </button>
                </nav>
              </div>
            )}
          </div>
        </section>
      </div>
      {/* Footer (copied from previous design) */}
      <Footer />
    </>
  );
};

export default Jobs;
