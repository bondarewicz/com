// Injects the server-rendered page into dist/index.html, then removes the server bundle.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { render } = await import(pathToFileURL(join(root, 'dist-server', 'entry-server.js')).href)
const file = join(root, 'dist', 'index.html')
const html = readFileSync(file, 'utf8')
if (!html.includes('<!--app-html-->')) throw new Error('index.html is missing the <!--app-html--> placeholder')
writeFileSync(file, html.replace('<!--app-html-->', render()))
rmSync(join(root, 'dist-server'), { recursive: true, force: true })
console.log('[prerender] wrote dist/index.html')
