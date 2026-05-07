import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const outFile = join(here, '..', 'src', 'version.js')

let sha = 'dev'
try {
  sha = execSync('git rev-parse --short HEAD', { cwd: join(here, '..') })
    .toString()
    .trim()
} catch {}

writeFileSync(outFile, `export const GIT_SHA = ${JSON.stringify(sha)}\n`)
console.log(`[version] wrote ${outFile} → ${sha}`)
