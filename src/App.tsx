import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './components/HomePage'
import DrawMaker from './components/DrawMaker'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/draw-maker" element={<DrawMaker />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
