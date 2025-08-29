import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ResumeBuilder from './components/ResumeBuilder';
import CoverLetterCreator from './components/CoverLetterCreator';
import LoadingPage from './components/LoadingPage';
import TemplatesPage from './components/TemplatesPage';
import Dashboard from './components/Dashboard';
import AccountSettings from './components/AccountSettings';
import Study from './components/Study';
import CreateStudySet from './components/CreateStudySet';
import SplashCursor from './components/SplashCursor';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <>
              <SplashCursor />
              <LandingPage />
            </>
          } />
          <Route path="/resume" element={<ResumeBuilder />} />
          <Route path="/cover-letter" element={
            <CoverLetterCreator 
              resumeData={{
                personalInfo: {},
                profile: "",
                experience: [],
                education: [],
                websites: [],
              }}
            />
          } />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/study" element={<Study />} />
          <Route path="/create" element={<CreateStudySet />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
