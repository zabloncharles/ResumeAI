import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import ResumeWorkspace from "./components/ResumeWorkspace";
import CoverLetterCreator from "./components/CoverLetterCreator";
import LoadingPage from "./components/LoadingPage";
import TemplatesPage from "./components/TemplatesPage";
import Dashboard from "./components/Dashboard";
import AccountSettings from "./components/AccountSettings";
import Study from "./components/Study";
import CreateStudySet from "./components/CreateStudySet";
import CreateStudySetFromTranscript from "./components/CreateStudySetFromTranscript";
import PodcastPage from "./components/Podcast";
import SplashCursor from "./components/SplashCursor";
import Services from "./components/Pages/Services";
import About from "./components/Pages/About";
import Contact from "./components/Pages/Contact.tsx";
import Privacy from "./components/Pages/Privacy";
import Terms from "./components/Pages/Terms";
import Jobs from "./components/Pages/Jobs";
import InstallAppPrompt from "./components/InstallAppPrompt";
import MobileAppNav from "./components/MobileAppNav";

function App() {
  return (
    <Router>
      <div className="App">
        <InstallAppPrompt />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SplashCursor />
                <LandingPage />
              </>
            }
          />
          <Route path="/resume/*" element={<ResumeWorkspace />} />
          <Route path="/cover-letter" element={<CoverLetterCreator />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/study" element={<Study />} />
          <Route path="/study/library" element={<Study />} />
          <Route path="/study/performance" element={<Study />} />
          <Route path="/study/folder/:folderId" element={<Study />} />
          <Route
            path="/create/from-transcript"
            element={<CreateStudySetFromTranscript />}
          />
          <Route path="/podcast" element={<PodcastPage />} />
          <Route path="/create" element={<CreateStudySet />} />
          <Route path="/edit/:studySetId" element={<CreateStudySet />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/courses" element={<Navigate to="/" replace />} />
          <Route path="/jobs" element={<Jobs />} />
        </Routes>
        <MobileAppNav />
      </div>
    </Router>
  );
}

export default App;
