import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { QUESTIONS, ROUTES, STRINGS, askPath } from './i18n.js'

// Used at build time to pre-render every page in both languages, so crawlers and link previews
// see real content.
export { QUESTIONS, ROUTES, STRINGS, askPath }
export function render(page, lang) {
  return renderToString(<App page={page} lang={lang} />)
}
