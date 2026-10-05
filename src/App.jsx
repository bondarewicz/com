import { useEffect, useState } from 'react'
import profile from './profile.json'
import { AgentProvider, AgentDrawer, AskAbout, ArrowUp, useAgent, API_BASE } from './Agent.jsx'

// label is what the visitor reads (my voice); question is what goes to the agent
const SUGGESTIONS = [
  { label: 'What have I built in the past?', question: 'What has Łukasz built in the past?' },
  { label: 'What am I building now?', question: 'What is Łukasz building now?' },
  { label: 'What am I looking for next?', question: 'What is Łukasz looking for next?' },
]

const year = (d) => (d ? d.slice(0, 4) : 'now')
const { contact } = profile
// hidden until a real profile URL is set in profile.json
const linkedin = contact.linkedin && !contact.linkedin.includes('[') ? contact.linkedin : null

const PLACEHOLDERS = [
  'Paste a job description for an honest fit report…',
  'What did he build as engineer #1?',
  'Is he a fit for a Forward Deployed Engineer role?',
  'How does dreamteam grade its agents?',
]

const TIMELINE = [
  { step: '01', when: 'Past', title: '18 years shipping', sub: 'Fastlane → ParcelVision → Parcelhero', ...SUGGESTIONS[0] },
  { step: '02', when: 'Now', title: 'Agents, graded by evals', sub: 'dreamteam · kalman', ...SUGGESTIONS[1] },
  { step: '03', when: 'Next', title: 'Senior builder roles', sub: 'Staff · Founding · Forward Deployed · AI Platform', ...SUGGESTIONS[2] },
]

// Types example questions into the placeholder until the visitor starts typing.
function useTypedPlaceholder(phrases, paused) {
  const [text, setText] = useState(phrases[0])
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let i = 0, n = 0, deleting = false, timer
    const tick = () => {
      const phrase = phrases[i]
      n += deleting ? -2 : 1
      setText(phrase.slice(0, Math.max(n, 0)))
      let delay = deleting ? 18 : 45
      if (!deleting && n >= phrase.length) { deleting = true; delay = 1800 }
      else if (deleting && n <= 0) { deleting = false; n = 0; i = (i + 1) % phrases.length; delay = 300 }
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, 1200)
    return () => clearTimeout(timer)
  }, [phrases, paused])
  return text
}

function useAgentOnline() {
  const [online, setOnline] = useState(false)
  useEffect(() => {
    fetch(`${API_BASE}/agent/profile`).then((r) => setOnline(r.ok)).catch(() => setOnline(false))
  }, [])
  return online
}

function Hero() {
  const { ask, busy } = useAgent()
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const placeholder = useTypedPlaceholder(PLACEHOLDERS, focused || draft.length > 0)
  const online = useAgentOnline()

  function submit(e) {
    e?.preventDefault()
    ask(draft)
    setDraft('')
  }

  return (
    <section className="hero">
      <h1>Engineer #1, twice. <em>Still building, now with agents.</em></h1>
      <p className="lede">18 years taking products, platforms and teams from first commit to running business. Today I build alongside a team of AI agents I designed, graded by evals, not vibes.</p>

      <form className="ask" onSubmit={submit}>
        <label htmlFor="ask" className="sr-only">Ask my agent a question or paste a job description</label>
        <span className="prompt" aria-hidden="true">›</span>
        <textarea
          id="ask"
          rows={1}
          value={draft}
          maxLength={6000}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
          placeholder={focused ? 'Ask anything, or paste a job description' : placeholder}
        />
        {online && (
          <span className="ask-status" title="Agent online · answers from my CV and GitHub">
            <span className="pulse" aria-hidden="true" /><span className="ask-status-text">Agent online</span>
          </span>
        )}
        <button type="submit" aria-label="Ask" disabled={busy || !draft.trim()}><ArrowUp /></button>
      </form>

      <ol className="timeline">
        {TIMELINE.map((t) => (
          <li key={t.step}>
            <button type="button" onClick={() => ask(t.question)} disabled={busy}>
              <span className="t-step">{t.step} · {t.when}</span>
              <span className="t-title">{t.title}</span>
              <span className="t-sub">{t.sub}</span>
              <span className="t-ask">{t.label} <span aria-hidden="true">→</span></span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

const parcelhero = profile.experience.find((e) => e.id === 'parcelhero')

function Now() {
  const { cited } = useAgent()
  const featured = profile.projects.filter((p) => p.group === 'now')
  return (
    <section id="now" className="block">
      <div className="label">Now building</div>
      <h2>AI in production, and on my own time</h2>
      <blockquote className="quote">
        “{parcelhero.summary[0]}”
        <cite>{parcelhero.title}, {parcelhero.company}</cite>
      </blockquote>
      <div className="feature-row">
        {featured.map((p, i) => {
          const dark = i === 0
          return (
            <article key={p.id} data-source={p.id} className={`feature ${dark ? 'dark' : ''} ${cited.has(p.id) ? 'cited' : ''}`}>
              <div className="feature-context">{p.context}</div>
              <div className="feature-meta"><span>{p.label || p.repo}</span><span>{p.meta}</span></div>
              <h3>{p.name}</h3>
              <p>{p.summary}</p>
              <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
              <div className="actions">
                <AskAbout className="btn accent" label="Ask for a walkthrough" question={`Can I get a walkthrough of ${p.name}? What problem does it solve and how is it built?`} />
                {p.url && <a className={dark ? 'btn ghost-dark' : 'btn ghost'} href={p.url} target="_blank" rel="noreferrer">GitHub ↗</a>}
                {Object.entries(p.links || {}).map(([label, href]) => (
                  <a key={label} className={dark ? 'btn ghost-dark' : 'btn ghost'} href={href} target="_blank" rel="noreferrer">{label} ↗</a>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ShortVersion() {
  const { cited } = useAgent()
  return (
    <section className="block short">
      <div>
        <div className="label">The short version</div>
        <h2>Three companies, zero to running</h2>
        {linkedin && <a href={linkedin} target="_blank" rel="noreferrer">Full history on LinkedIn ↗</a>}
      </div>
      <ol>
        {profile.experience.map((e) => (
          <li key={e.id} data-source={e.id} className={cited.has(e.id) ? 'cited' : ''}>
            <span className="mono">{year(e.start)} – {year(e.end)}</span>
            <span>{e.company} · {e.short}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Footer() {
  const { setOpen, setContactOpen } = useAgent()
  return (
    <footer className="foot">
      <button type="button" className="linkish" onClick={() => { setOpen(true); setContactOpen('form') }}>Get in touch</button>
      <nav>
        {linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
      </nav>
    </footer>
  )
}

function Page() {
  const { open } = useAgent()
  return (
    <div className={`shell ${open ? 'with-drawer' : ''}`}>
      <div className="band">
        <div className="page">
          <header className="nav">
            <a href="/" className="brand">{profile.name}</a>
            <nav>
              <a className="sec" href="#now">Now</a>
              {linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
              <a href={contact.github} target="_blank" rel="noreferrer">GitHub ↗</a>
            </nav>
          </header>
          <Hero />
        </div>
      </div>
      <div className="page">
        <main>
          <Now />
          <ShortVersion />
        </main>
        <Footer />
      </div>
      <AgentDrawer />
    </div>
  )
}

export default function App() {
  return (
    <AgentProvider>
      <Page />
    </AgentProvider>
  )
}
