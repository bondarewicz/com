import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import './site.css'
import { startStats } from './stats.js'

const root = document.getElementById('root')
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// the production build ships pre-rendered HTML; take it over instead of re-rendering
// (in dev the root only holds a placeholder comment, so check for elements)
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)

startStats()
