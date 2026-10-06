// Copies what the site shows (capabilities and links) from the agent's profile in the api repo.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const source = process.argv[2] || join(here, '..', '..', 'api', 'agent', 'profile.json')
const profile = JSON.parse(readFileSync(source, 'utf8'))

// the site only renders the capabilities and links; nothing else (employers, dates, projects) ships in the bundle
const out = { capabilities: profile.capabilities, contact: { github: profile.contact.github, linkedin: profile.contact.linkedin } }

writeFileSync(join(here, '..', 'src', 'profile.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`[profile] synced ${out.capabilities.length} capabilities from ${source}`)
