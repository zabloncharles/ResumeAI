import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import ResumeBuilder from './components/ResumeBuilder'
import LoadingPage from './components/LoadingPage'
import AccountSettings from './components/AccountSettings'
import Courses from './components/Courses'
import Jobs from './components/Jobs'
import News from './components/News'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/resume" element={<ResumeBuilder />} />
        <Route path="/settings" element={<AccountSettings />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/news" element={<News />} />
      </Routes>
    </Router>
  )
}

export default App 