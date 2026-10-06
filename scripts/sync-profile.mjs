// Copies the public part of the agent's profile from the api repo into this site.
// Projects marked public: false (and anything pointing at them) stay out of the bundle.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const source = process.argv[2] || join(here, '..', '..', 'api', 'agent', 'profile.json')
const profile = JSON.parse(readFileSync(source, 'utf8'))

const projects = profile.projects.filter((p) => p.public !== false)
const visible = new Set(projects.map((p) => p.id))
const out = {
  ...profile,
  projects,
  principles: (profile.principles || []).filter((pr) => visible.has(pr.project)),
  sideProjects: (profile.sideProjects || []).filter((id) => visible.has(id)),
}

writeFileSync(join(here, '..', 'src', 'profile.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`[profile] synced ${projects.length} public projects from ${source}`)
