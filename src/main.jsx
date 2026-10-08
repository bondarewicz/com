import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import { routeFor } from './i18n.js'
import './site.css'

const root = document.getElementById('root')
const { page, lang, ask } = routeFor(location.pathname)
const app = (
  <React.StrictMode>
    <App page={page} lang={lang} ask={ask} />
  </React.StrictMode>
)

// the production build ships pre-rendered HTML; take it over instead of re-rendering
// (in dev the root only holds a placeholder comment, so check for elements)
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
