// Renders every page in both languages into dist/ (dist/index.html, dist/pl/index.html,
// dist/privacy/index.html, ...), each with its own language, title, description and links
// to its other-language version, then removes the server bundle.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const SITE = 'https://bondarewicz.com'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { render, ROUTES, STRINGS } = await import(pathToFileURL(join(root, 'dist-server', 'entry-server.js')).href)
const template = readFileSync(join(root, 'dist', 'index.html'), 'utf8')
if (!template.includes('<!--app-html-->')) throw new Error('index.html is missing the <!--app-html--> placeholder')

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
// replaces the content of one tag in the template, failing loudly if the tag moved
function swap(html, pattern, value) {
  if (!pattern.test(html)) throw new Error(`prerender: ${pattern} not found in index.html`)
  return html.replace(pattern, value)
}

for (const [page, paths] of Object.entries(ROUTES)) {
  for (const [lang, path] of Object.entries(paths)) {
    const { title, description } = STRINGS[lang].meta[page]
    const url = SITE + path
    let html = template
    html = swap(html, /<html lang="[^"]*">/, `<html lang="${lang}">`)
    html = swap(html, /<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`)
    html = swap(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${attr(description)}" />`)
    html = swap(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`
      + Object.entries(paths).map(([l, p]) => `\n    <link rel="alternate" hreflang="${l}" href="${SITE + p}" />`).join('')
      + `\n    <link rel="alternate" hreflang="x-default" href="${SITE + paths.en}" />`)
    html = swap(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    html = swap(html, /<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${lang === 'pl' ? 'pl_PL' : 'en_GB'}" />`)
    if (page !== 'home') {
      html = swap(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${attr(title)}" />`)
      html = swap(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${attr(description)}" />`)
      html = swap(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${attr(title)}" />`)
      html = swap(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${attr(description)}" />`)
    } else if (lang === 'pl') {
      html = swap(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${attr(`${STRINGS.pl.hero.headline} ${STRINGS.pl.agent.emptyHeading}`)}" />`)
      html = swap(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${attr(STRINGS.pl.hero.headline)}" />`)
    }
    html = html.replace('<!--app-html-->', render(page, lang))
    const out = join(root, 'dist', path)
    mkdirSync(out, { recursive: true })
    writeFileSync(join(out, 'index.html'), html)
    console.log(`[prerender] wrote dist${path}index.html`)
  }
}
rmSync(join(root, 'dist-server'), { recursive: true, force: true })
