import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.tsx'

const container = document.getElementById('root')

// A missing root element means the HTML shell was tampered with; fail loudly
// rather than silently rendering nothing.
if (container === null) {
  throw new Error('Root element #root was not found in index.html.')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
