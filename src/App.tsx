import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import ResumeBuilder from './components/ResumeBuilder'
import LoadingPage from './components/LoadingPage'
import AccountSettings from './components/AccountSettings'
import Courses from './components/Courses'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/resume" element={<ResumeBuilder />} />
        <Route path="/settings" element={<AccountSettings />} />
        <Route path="/courses" element={<Courses />} />
      </Routes>
    </Router>
  )
}

export default App 