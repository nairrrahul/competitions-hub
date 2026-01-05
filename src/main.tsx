import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGlobalStore } from './state/GlobalState'

// Load data when app starts
const store = useGlobalStore.getState()
store.loadPlayersData()
store.loadNationInfo()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
