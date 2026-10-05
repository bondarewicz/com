import { useEffect, useRef, useState } from 'react'
import profile from './profile.json'
import { AgentProvider, AskAbout, Thread, useAgent, focusConversation, API_BASE } from './Agent.jsx'

const { contact } = profile
// hidden until a real profile URL is set in profile.json
const linkedin = contact.linkedin && !contact.linkedin.includes('[') ? contact.linkedin : null

const HEADLINE = 'Don\'t read my CV. Ask it.'
// no longer than the headline, so the typed text never wraps onto a second line
const EXAMPLES = [
  'What did he build?',
  'Is he a fit for our team?',
  'What is he building now?',
  'What role does he want?',
]
const STARTERS = [
  { label: 'what he built as engineer #1', question: 'What has Łukasz built in the past?' },
  { label: 'what he\'s building now', question: 'What is Łukasz building now?' },
  { label: 'what he\'s looking for next', question: 'What is Łukasz looking for next?' },
]

const year = (d) => (d ? d.slice(0, 4) : 'today')

/**
 * The headline doubles as the input's placeholder: it holds, then types example questions,
 * until the visitor clicks in. It's the one piece of motion on the page.
 */
function useHeadlinePlaceholder(paused) {
  const [text, setText] = useState(HEADLINE)
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const phrases = [HEADLINE, ...EXAMPLES]
    let i = 0, n = HEADLINE.length, deleting = true, timer
    const tick = () => {
      const phrase = phrases[i]
      n += deleting ? -2 : 1
      setText(phrase.slice(0, Math.max(n, 0)))
      let delay = deleting ? 16 : 42
      if (!deleting && n >= phrase.length) { deleting = true; delay = i === 0 ? 4200 : 2000 }
      else if (deleting && n <= 0) { deleting = false; n = 0; i = (i + 1) % phrases.length; delay = 260 }
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, 4200)
    return () => clearTimeout(timer)
  }, [paused])
  return text
}

function useAgentOnline() {
  const [online, setOnline] = useState(false)
  useEffect(() => {
    fetch(`${API_BASE}/agent/profile`).then((r) => setOnline(r.ok)).catch(() => setOnline(false))
  }, [])
  return online
}

function ArrowUp() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

function Hero() {
  const { ask, busy, messages } = useAgent()
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const placeholder = useHeadlinePlaceholder(focused || draft.length > 0 || messages.length > 0)
  const online = useAgentOnline()
  const inputRef = useRef(null)

  function submit(e) {
    e?.preventDefault()
    if (!draft.trim()) return inputRef.current?.focus()
    ask(draft)
    setDraft('')
  }

  const started = messages.length > 0
  const input = (
    <form className={`askbox ${started ? 'compact' : ''}`} onSubmit={submit}>
      <label htmlFor="question" className="sr-only">Ask a question about my work</label>
      <textarea
        id="question"
        ref={inputRef}
        rows={1}
        value={draft}
        maxLength={6000}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
        placeholder={started ? 'Ask a follow-up' : focused ? 'Ask about my work' : placeholder}
      />
      <button type="submit" className="send" aria-label="Ask" disabled={busy}><ArrowUp /></button>
    </form>
  )

  return (
    <section className="hero" id="ask">
      <h1 className="intro">I'm Łukasz, a Technical Lead bringing AI into how teams build and ship, where it actually helps.</h1>
      {!started && (
        <>
          {input}
          <p className="starters">
            <span className={`presence ${online ? 'on' : ''}`} title={online ? 'The agent is online' : 'The agent is offline'} />
            Try{' '}
            {STARTERS.map((s, i) => (
              <span key={s.label}>
                {i === STARTERS.length - 1 ? ' or ' : i > 0 ? ', ' : ''}
                <button type="button" className="inline" onClick={() => ask(s.question)} disabled={busy}>{s.label}</button>
              </span>
            ))}.
          </p>
        </>
      )}
      <Thread />
      {started && (
        <>
          {input}
          <p className="starters small">
            <span className={`presence ${online ? 'on' : ''}`} />
            Conversations are saved.
          </p>
        </>
      )}
    </section>
  )
}

function Work() {
  const { cited } = useAgent()
  const [work, ...own] = profile.projects.filter((p) => p.group === 'now')
  return (
    <section className="section" id="work">
      <h2>What I'm building</h2>
      <div className="work">
        <article data-source={work.id} className={`work-main ${cited.has(work.id) ? 'cited' : ''}`}>
          <h3>At Parcelhero</h3>
          <p className="lead">{work.blurb}</p>
          <AskAbout question="Can I get a walkthrough of how Łukasz brings AI into how the team at Parcelhero builds and ships?" />
        </article>
        <div className="work-side">
          <h3>On my own time</h3>
          {own.map((p) => (
            <article key={p.id} data-source={p.id} className={`project ${cited.has(p.id) ? 'cited' : ''}`}>
              <h4>{p.name}</h4>
              <p>{p.blurb}</p>
              <div className="project-links">
                <AskAbout question={`Can I get a walkthrough of ${p.name}? What problem does it solve and how is it built?`} />
                {p.url && <a href={p.url} target="_blank" rel="noreferrer">Code on GitHub</a>}
                {Object.entries(p.links || {}).map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Career() {
  const { cited } = useAgent()
  return (
    <section className="section" id="career">
      <h2>Career</h2>
      <ol className="timeline">
        {profile.experience.map((e) => (
          <li key={e.id} data-source={e.id} className={cited.has(e.id) ? 'cited' : ''}>
            <span className="years">{year(e.start)} to {year(e.end)}</span>
            <div>
              <h3>{e.company}</h3>
              <p>{e.title}. {e.short}.</p>
            </div>
          </li>
        ))}
      </ol>
      {linkedin && <a className="more" href={linkedin} target="_blank" rel="noreferrer">Full history on LinkedIn</a>}
    </section>
  )
}

function Footer() {
  function askAgain() {
    focusConversation()
    setTimeout(() => document.getElementById('question')?.focus({ preventScroll: true }), 400)
  }
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <p>Still curious? Ask me anything.</p>
        <button type="button" className="btn-quiet light" onClick={askAgain}>Ask a question</button>
      </div>
    </footer>
  )
}

function Page() {
  return (
    <>
      <div className="night">
        <div className="wrap">
          <header className="top">
            <a href="/" className="name">Łukasz Bondarewicz</a>
            <nav aria-label="Sections">
              <a href="#work">Work</a>
              <a href="#career">Career</a>
              <a href={contact.github} target="_blank" rel="noreferrer">GitHub</a>
              {linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
            </nav>
          </header>
          <Hero />
        </div>
      </div>
      <main className="wrap">
        <Work />
        <Career />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <AgentProvider>
      <Page />
    </AgentProvider>
  )
}
