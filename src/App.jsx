import { useEffect, useState } from 'react'
import profile from './profile.json'
import { AgentProvider, AskAbout, Composer, ConversationView, useAgent, API_BASE } from './Agent.jsx'

const { contact } = profile
// hidden until a real profile URL is set in profile.json
const linkedin = contact.linkedin && !contact.linkedin.includes('[') ? contact.linkedin : null

// what a visitor might ask; short enough to fit the box on one line
const EXAMPLES = [
  'What did you build?',
  'Are you a fit for us?',
  'What are you building?',
  'What role do you want?',
]
const STARTERS = [
  { label: 'what I built as engineer #1', question: 'What has Łukasz built in the past?' },
  { label: 'what I\'m building now', question: 'What is Łukasz building now?' },
  { label: 'what I\'m looking for next', question: 'What is Łukasz looking for next?' },
]


/**
 * The question box types example questions until the visitor clicks in.
 * It's the one piece of motion on the page.
 */
function useTypedPlaceholder(paused) {
  const [text, setText] = useState(EXAMPLES[0])
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let i = 0, n = EXAMPLES[0].length, deleting = true, timer
    const tick = () => {
      const phrase = EXAMPLES[i]
      n += deleting ? -2 : 1
      setText(phrase.slice(0, Math.max(n, 0)))
      let delay = deleting ? 16 : 45
      if (!deleting && n >= phrase.length) { deleting = true; delay = 2200 }
      else if (deleting && n <= 0) { deleting = false; n = 0; i = (i + 1) % EXAMPLES.length; delay = 260 }
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, 2600)
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

function Hero() {
  const { ask, busy, messages, setOpen } = useAgent()
  const [paused, setPaused] = useState(false)
  const typed = useTypedPlaceholder(paused)
  const online = useAgentOnline()

  return (
    <section className="hero">
      <div className="hero-stack">
        <p className="greeting">Hi, I'm Łukasz.</p>
        <h1>I've spent nearly two decades helping teams ship better software, and now I bring in AI where it actually helps.</h1>

        <aside className="assistant" id="ask" aria-label="Ask me anything">
          <h2><span className={`presence ${online ? 'on' : ''}`} title={online ? 'Online' : 'Offline'} />Ask me anything</h2>
          {messages.length === 0 ? (
            <>
              <Composer placeholder={paused ? 'Ask about my work' : typed} onActiveChange={setPaused} />
              <p className="starters">
                Try{' '}
                {STARTERS.map((s, i) => (
                  <span key={s.label}>
                    {i === STARTERS.length - 1 ? ' or ' : i > 0 ? ', ' : ''}
                    <button type="button" className="inline" onClick={() => ask(s.question)} disabled={busy}>{s.label}</button>
                  </span>
                ))}.
              </p>
            </>
          ) : (
            // with a conversation going, the box is the way back into it
            <div onFocusCapture={() => setOpen(true)} onClickCapture={() => setOpen(true)}>
              <Composer placeholder="Ask a follow-up" />
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

function About() {
  return (
    <section className="section about" id="about">
      <h2>I help teams turn a first idea into software they can rely on.</h2>
      <div className="about-body">
        <p>Twice, I've been the first engineer a company hired. Both times it meant listening closely to what the business needed, building the pipelines and infrastructure a growing team could rely on, and helping new engineers find their feet as the team grew.</p>
        <p>Most recently, I helped set the technical direction of a logistics platform I'd built from its foundations, and brought AI into one of its core parts.</p>
        <p>If your team is starting something new, or wants to ship with more confidence, I'd love to hear about it.</p>
        <AskAbout label="Ask about my background" question="Tell me about Łukasz's background and how he works." />
      </div>
    </section>
  )
}

function Work() {
  return (
    <section className="section" id="work">
      <h2>What teams bring me in for.</h2>
      <div className="capabilities">
        {profile.capabilities.map((c) => (
          <article key={c.id} className="capability">
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  const { contact } = useAgent()
  // pre-rendered with the build year, then the visitor's current year, so it never goes stale
  const [year, setYear] = useState(__BUILD_YEAR__)
  useEffect(() => setYear(new Date().getFullYear()), [])
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <p>Still curious?</p>
        <button type="button" className="pill" onClick={contact}>Contact me</button>
      </div>
      <div className="wrap">
        <p className="rights">All rights reserved © Łukasz Bondarewicz {year}</p>
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
            <a href="/" className="logo" aria-label="bondarewicz.com, home">bondarewicz<span>.com</span></a>
            <nav aria-label="Sections">
              <a href="#work">What I do</a>
              <a href={contact.github} target="_blank" rel="noreferrer">GitHub</a>
              {linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
            </nav>
          </header>
          <Hero />
        </div>
      </div>
      <main className="wrap">
        <About />
        <Work />
      </main>
      <Footer />
      <ConversationView starters={STARTERS} />
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
