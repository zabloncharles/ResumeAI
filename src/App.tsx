import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import LandingPage from "./components/LandingPage";
import ResumeBuilder from "./components/ResumeBuilder";
import LoadingPage from "./components/LoadingPage";
import AccountSettings from "./components/AccountSettings";
import Courses from "./components/Courses";
import Jobs from "./components/Jobs";
import Study from "./components/Study";
import Dashboard from "./components/Dashboard";
import CoverLetterCreator from "./components/CoverLetterCreator";
import SplashCursor from "./components/SplashCursor";
import TemplatesPage from "./components/TemplatesPage";

// Create a wrapper component to conditionally render SplashCursor
const AppContent = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <>
      {isLandingPage && <SplashCursor />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/resume" element={<ResumeBuilder />} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/study" element={<Study />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route
          path="/cover-letter"
          element={
            <CoverLetterCreator
              resumeData={{
                personalInfo: {},
                profile: "",
                experience: [],
                education: [],
                websites: [],
              }}
            />
          }
        />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
