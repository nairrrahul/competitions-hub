import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DrawMaker from './pages/DrawMaker'
import CompetitionSimulator from './pages/CompetitionSimulator'
import RosterManager from './pages/RosterManager'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/draw-maker" element={<DrawMaker />} />
        <Route path="/competition-simulator" element={<CompetitionSimulator />} />
        <Route path="/roster-manager" element={<RosterManager />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
