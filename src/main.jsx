import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerServiceWorker } from '@/lib/registerSW'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register PWA service worker (production only — dev is skipped automatically)
registerServiceWorker()