import { renderToString } from 'react-dom/server'
import App from './App.jsx'

// Used at build time to pre-render the page, so crawlers and link previews see real content.
export function render() {
  return renderToString(<App />)
}
