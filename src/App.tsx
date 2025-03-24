import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import ResumeBuilder from './components/ResumeBuilder'
import LoadingPage from './components/LoadingPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/resume" element={<ResumeBuilder />} />
      </Routes>
    </Router>
  )
}

export default App 