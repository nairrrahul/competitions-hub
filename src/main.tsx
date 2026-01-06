import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGlobalStore } from './state/GlobalState'

// Initialize data when app starts (only if not already initialized)
const store = useGlobalStore.getState()
store.initializeData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
