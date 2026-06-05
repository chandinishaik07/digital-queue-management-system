// ============================================================
// main.jsx
// This is the entry point of the entire React application.
// It is the first file that runs when the frontend starts.
//
// Responsibilities:
//   1. Imports React and ReactDOM
//   2. Imports the root App component
//   3. Imports global CSS styles
//   4. Mounts the entire React app into the HTML page
//
// How React works:
//   The browser loads index.html which has a <div id="root">
//   ReactDOM.createRoot finds that div and renders the entire
//   React application inside it. From that point on, React
//   controls what is displayed on the page.
// ============================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Global CSS — includes TailwindCSS utility classes
import './index.css'

// Root component — contains all routes and pages
import App from './App.jsx'

// Find the <div id="root"> element in index.html
// and mount the React app inside it
// StrictMode helps catch potential issues during development
// by running certain checks and warnings (only in development mode)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)