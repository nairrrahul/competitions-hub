import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DrawMaker from './pages/DrawMaker'
import CompetitionSimulator from './pages/CompetitionSimulator'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/competitions-hub" element={<DrawMaker />} />
        <Route path="/competition-simulator" element={<CompetitionSimulator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
